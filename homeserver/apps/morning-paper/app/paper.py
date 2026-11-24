#!/usr/bin/env python3
"""Morning Paper for a phone.

Wraps the pinned kobo-morning-paper code (upstream/scripts) and swaps its Kobo half
for phone delivery:

  build    pick today's articles, extract them, build the EPUB (upstream dry-build,
           so no Calibre and no Docker calls), write the phone web page, prune old
           editions.
  deliver  push an ntfy alert that opens today's page, and email the paper with
           the EPUB attached.
  run      build, then deliver.

Sources (sources.json):
  feeds      RSS/Atom feeds. The article page is fetched and cleaned by trafilatura.
             A paywall teaser (too few words) is skipped in favour of the next item.
  newsletters  emails in a mailbox (IMAP), matched by sender. The email itself is the
             article: Substack, FT and Economist newsletters carry the full text.
  saved links  any email to the mailbox whose subject starts with "save" or "paper":
             its links go first in the next edition.

Secrets come only from environment variables (see secrets.example.env).
"""
import email
import email.policy
import hashlib
import html as htmlmod
import imaplib
import json
import os
import re
import shutil
import smtplib
import sys
import time
from datetime import date, datetime, timedelta, timezone
from email.message import EmailMessage
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlparse

import feedparser
import requests

APP = Path(__file__).resolve().parent
UPSTREAM = Path(os.environ.get("UPSTREAM_DIR", APP.parent / "upstream" / "scripts"))
DATA = Path(os.environ.get("PAPER_DATA", "/data"))
SITE = DATA / "site"            # served read-only by the web container
STATE = DATA / "state"          # seen.json, logs
SOURCES_FILE = Path(os.environ.get("PAPER_SOURCES", DATA / "sources.json"))
FONTS = DATA / "fonts"

sys.path.insert(0, str(UPSTREAM))


def log(msg: str) -> None:
    line = f"{datetime.now():%Y-%m-%d %H:%M:%S} {msg}"
    print(line, flush=True)
    try:
        STATE.mkdir(parents=True, exist_ok=True)
        with (STATE / "paper.log").open("a") as f:
            f.write(line + "\n")
    except OSError:
        pass


def load_sources() -> dict:
    cfg = json.loads(SOURCES_FILE.read_text())
    cfg.setdefault("articles_per_edition", 4)
    cfg.setdefault("min_words", 250)
    cfg.setdefault("keep_days", 14)
    cfg.setdefault("paper_title", "The Morning Paper")
    cfg.setdefault("paper_tagline", "All the Reads Worth Your Time")
    cfg.setdefault("max_item_age_hours", 36)
    return cfg


def env_expand(s: str) -> str:
    """Feed URLs may hold a private token: write them as ${VAR} in sources.json."""
    return re.sub(r"\$\{(\w+)\}", lambda m: os.environ.get(m.group(1), ""), s)


def uid(s: str) -> str:
    return hashlib.sha1(s.encode()).hexdigest()[:16]


# --------------------------------------------------------------------------- state
def load_seen() -> dict:
    p = STATE / "seen.json"
    try:
        return json.loads(p.read_text())
    except (OSError, ValueError):
        return {}


def save_seen(seen: dict) -> None:
    cutoff = (date.today() - timedelta(days=60)).isoformat()
    seen = {k: v for k, v in seen.items() if v >= cutoff}
    STATE.mkdir(parents=True, exist_ok=True)
    (STATE / "seen.json").write_text(json.dumps(seen, indent=0))


# --------------------------------------------------------------------------- feeds
def feed_candidates(src: dict, max_age_h: int) -> list[dict]:
    url = env_expand(src["url"])
    if not url:
        log(f"{src['name']}: feed URL empty (secret not set?), skipped")
        return []
    try:
        r = requests.get(url, timeout=30, headers={"User-Agent": "MorningPaper/1.0 (+personal feed reader)"})
        r.raise_for_status()
    except requests.RequestException as e:
        log(f"{src['name']}: feed error ({type(e).__name__}: {e})")
        return []
    parsed = feedparser.parse(r.content)
    now = datetime.now(timezone.utc)
    out = []
    for e in parsed.entries:
        link = e.get("link")
        if not link:
            continue
        t = e.get("published_parsed") or e.get("updated_parsed")
        when = datetime(*t[:6], tzinfo=timezone.utc) if t else now
        if now - when > timedelta(hours=max_age_h):
            continue
        full = ""
        if e.get("content"):
            full = max((c.get("value", "") for c in e.content), key=len)
        out.append({
            "kind": "feed", "source": src["name"], "id": link, "url": link,
            "title": e.get("title", link), "when": when.isoformat(),
            "summary": e.get("summary", ""), "full_html": full,
        })
    out.sort(key=lambda c: c["when"], reverse=True)
    return out


def words(html: str) -> int:
    return len(re.sub(r"<[^>]+>", " ", html or "").split())


def feed_to_article(c: dict, min_words: int) -> "dict | None":
    """Prefer full text in the feed (e.g. a paid 404 Media feed), else fetch the page."""
    import trafilatura
    if words(c["full_html"]) >= min_words:
        body = trafilatura.extract(c["full_html"], output_format="html", include_links=False,
                                   include_images=False) or c["full_html"]
        return make_article(c, body)
    build = upstream_build()
    try:
        art = build.extract_article(c["url"])
    except Exception as e:
        log(f"{c['source']}: could not read '{c['title'][:60]}' ({e})")
        return None
    if words(art["html"]) < min_words:
        log(f"{c['source']}: '{c['title'][:60]}' looks like a paywall teaser "
            f"({words(art['html'])} words), skipped")
        return None
    art["title"] = c["title"] or art["title"]
    art["source"] = c["source"]
    return art


def make_article(c: dict, body_html: str, image=None) -> dict:
    return {
        "url": c["url"],
        "title": c["title"].strip()[:200],
        "domain": c["source"],
        "source": c["source"],
        "published": c["when"][:10],
        "saved": datetime.now(timezone.utc).isoformat(),
        "image": image,
        "html": body_html,
    }


# --------------------------------------------------------------------------- email
def imap_connect():
    host = os.environ.get("IMAP_HOST", "imap.gmail.com")
    user, pw = os.environ.get("MAIL_USER"), os.environ.get("MAIL_APP_PASSWORD")
    if not (user and pw):
        return None
    m = imaplib.IMAP4_SSL(host, timeout=60)
    m.login(user, pw)
    return m


def fetch_emails(m, folder: str, since_days: int = 2) -> list:
    typ, _ = m.select(f'"{folder}"', readonly=True)
    if typ != "OK":
        log(f"mail folder '{folder}' not found")
        return []
    since = (date.today() - timedelta(days=since_days)).strftime("%d-%b-%Y")
    typ, data = m.search(None, "SINCE", since)
    msgs = []
    for num in (data[0].split() if data and data[0] else []):
        typ, parts = m.fetch(num, "(BODY.PEEK[])")
        if typ == "OK" and parts and isinstance(parts[0], tuple):
            msgs.append(email.message_from_bytes(parts[0][1], policy=email.policy.default))
    return msgs


def email_html(msg) -> str:
    part = msg.get_body(preferencelist=("html", "plain"))
    if part is None:
        return ""
    content = part.get_content()
    if part.get_content_type() == "text/plain":
        content = "".join(f"<p>{htmlmod.escape(p)}</p>" for p in content.split("\n\n") if p.strip())
    return content


WEB_LINK_RE = re.compile(r'href="(https?://[^"]+)"[^>]*>\s*(?:<[^>]+>\s*)*(?:view (?:this post )?(?:in|on) (?:your )?(?:browser|the web|web)|read (?:online|in browser|on the web))', re.I)


def newsletter_candidates(msgs: list, sources: list, max_age_h: int) -> list[dict]:
    now = datetime.now(timezone.utc)
    out = []
    for msg in msgs:
        sender = str(msg.get("From", "")).lower()
        src = next((s for s in sources if any(f.lower() in sender for f in s["from"])), None)
        if not src:
            continue
        try:
            when = parsedate_to_datetime(msg["Date"]).astimezone(timezone.utc)
        except Exception:
            when = now
        if now - when > timedelta(hours=max_age_h):
            continue
        html = email_html(msg)
        m = WEB_LINK_RE.search(html)
        mid = str(msg.get("Message-ID", "")) or uid(sender + str(msg["Subject"]))
        out.append({
            "kind": "email", "source": src["name"], "id": mid,
            "url": m.group(1) if m else "", "title": str(msg.get("Subject", "Newsletter")),
            "when": when.isoformat(), "html": html,
        })
    out.sort(key=lambda c: c["when"], reverse=True)
    return out


def email_to_article(c: dict, min_words: int) -> "dict | None":
    import trafilatura
    body = trafilatura.extract(c["html"], output_format="html", include_links=True,
                               include_images=False, favor_recall=True)
    if not body or words(body) < min_words // 2:
        log(f"{c['source']}: newsletter '{c['title'][:60]}' had too little text, skipped")
        return None
    return make_article(c, body)


SAVE_SUBJECT = re.compile(r"^\s*(fwd?:\s*)?(save|paper)\b", re.I)
URL_RE = re.compile(r"https?://[^\s<>\"')]+")


def saved_links(msgs: list) -> list[dict]:
    allowed = [a.strip().lower() for a in os.environ.get("SAVE_FROM", "").split(",") if a.strip()]
    out = []
    for msg in msgs:
        if not SAVE_SUBJECT.match(str(msg.get("Subject", ""))):
            continue
        sender = str(msg.get("From", "")).lower()
        if allowed and not any(a in sender for a in allowed):
            log(f"saved link from unknown sender ignored: {sender}")
            continue
        part = msg.get_body(preferencelist=("plain", "html"))
        text = part.get_content() if part else ""
        for u in URL_RE.findall(text):
            out.append({"kind": "saved", "source": "Saved for you", "id": u, "url": u,
                        "title": "", "when": datetime.now(timezone.utc).isoformat(),
                        "summary": "", "full_html": ""})
    return out


# --------------------------------------------------------------------------- pick
def pick(cfg: dict, seen: dict) -> list[dict]:
    """Saved links first, then one per source in priority order, round-robin."""
    n, min_w, age = cfg["articles_per_edition"], cfg["min_words"], cfg["max_item_age_hours"]
    pools: dict[str, list] = {}
    order: list[str] = []
    msgs = []
    try:
        m = imap_connect()
        if m:
            msgs = fetch_emails(m, os.environ.get("MAIL_FOLDER", "INBOX"))
            m.logout()
        elif cfg.get("newsletters"):
            log("mail login not set; newsletters and saved links skipped")
    except Exception as e:
        log(f"mail error ({type(e).__name__}: {e}); newsletters skipped")

    saved = [c for c in saved_links(msgs) if c["id"] not in seen]
    news = newsletter_candidates(msgs, cfg.get("newsletters", []), age)
    for s in cfg.get("priority", []):
        order.append(s)
    for c in news:
        pools.setdefault(c["source"], []).append(c)
    for src in cfg.get("feeds", []):
        pools.setdefault(src["name"], []).extend(feed_candidates(src, age))
    for name in pools:
        if name not in order:
            order.append(name)

    chosen: list[dict] = []
    for c in saved:
        if len(chosen) >= n:
            break
        art = feed_to_article(c, 0)
        seen[c["id"]] = date.today().isoformat()
        if art:
            art["source"] = "Saved for you"
            chosen.append(art)

    while len(chosen) < n and any(pools.get(s) for s in order):
        for s in order:
            if len(chosen) >= n:
                break
            pool = pools.get(s) or []
            while pool:
                c = pool.pop(0)
                if c["id"] in seen:
                    continue
                art = email_to_article(c, min_w) if c["kind"] == "email" else feed_to_article(c, min_w)
                seen[c["id"]] = date.today().isoformat()
                if art:
                    chosen.append(art)
                    break
    return chosen


# --------------------------------------------------------------------------- build
_BUILD = None


def upstream_build():
    global _BUILD
    if _BUILD is None:
        import importlib.util
        spec = importlib.util.spec_from_file_location("digest", UPSTREAM / "kobo-digest-build.py")
        _BUILD = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(_BUILD)
    return _BUILD


def build_epub(ed_dir: Path, cfg: dict, articles: list[dict], edition_no: int) -> Path:
    """Upstream --dry-build: works only inside ed_dir, never touches Calibre or Docker."""
    work = ed_dir / "work"
    (work / "articles").mkdir(parents=True, exist_ok=True)
    for a in articles:
        (work / "articles" / f"{uid(a['url'] or a['title'])}.json").write_text(json.dumps(a))
    if FONTS.exists():
        shutil.copytree(FONTS, work / "fonts", dirs_exist_ok=True)
    (work / "edition.txt").write_text(str(edition_no - 1))
    b = upstream_build()
    b.PAPER_TITLE, b.PAPER_TAGLINE = cfg["paper_title"], cfg["paper_tagline"]
    b.MAX_AGE_DAYS = 3650  # we already chose today's items
    rc = b.main(["--dry-build", str(work)])
    epub = work / "read-later.epub"
    if rc != 0 or not epub.exists():
        raise RuntimeError("EPUB build failed; see build.log")
    out = ed_dir / f"morning-paper-{ed_dir.name}.epub"
    shutil.move(str(epub), out)
    if (work / "cover.jpg").exists():
        shutil.move(str(work / "cover.jpg"), ed_dir / "cover.jpg")
    shutil.rmtree(work, ignore_errors=True)
    return out


CSS = """
:root{--bg:#f7f3ea;--ink:#1d1b17;--muted:#6b645a;--rule:#d8cfbf;--link:#7a2e1c}
@media (prefers-color-scheme:dark){:root{--bg:#161513;--ink:#ece6da;--muted:#a39b8e;--rule:#3a362f;--link:#e59a7f}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:19px/1.6 Georgia,"Iowan Old Style",serif}
main{max-width:40rem;margin:0 auto;padding:1.25rem 1rem 4rem}
header.mast{text-align:center;border-bottom:3px double var(--rule);padding-bottom:.75rem;margin-bottom:1rem}
.mast h1{font:700 2.1rem/1.1 "Old English Text MT",UnifrakturMaguntia,Georgia,serif;margin:.2rem 0}
.mast p{margin:0;color:var(--muted);font-size:.85rem;letter-spacing:.04em;text-transform:uppercase}
.btns{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin:.9rem 0 0}
.btn{display:inline-block;padding:.55rem .9rem;border:1px solid var(--rule);border-radius:.5rem;color:var(--ink);text-decoration:none;font:600 .85rem system-ui,sans-serif}
ol.toc{padding-left:1.2rem;margin:0 0 1.5rem}ol.toc li{margin:.35rem 0}
ol.toc a,article a{color:var(--link)}
article{border-top:1px solid var(--rule);padding-top:1rem;margin-top:1.5rem}
article h2{font-size:1.45rem;line-height:1.25;margin:.2rem 0 .3rem}
.meta{color:var(--muted);font:.8rem system-ui,sans-serif;margin-bottom:.8rem}
article img{max-width:100%;height:auto}
article h1,article h3,article h4{font-size:1.15rem;line-height:1.3}
.top{font:.8rem system-ui,sans-serif}
ul.archive{list-style:none;padding:0}ul.archive li{padding:.6rem 0;border-bottom:1px solid var(--rule)}
"""


def clean_body(html: str) -> str:
    """Strip anything active from extracted HTML before it goes on the page."""
    html = re.sub(r"(?is)<(script|style|iframe|object|embed|form)[^>]*>.*?</\1>", "", html)
    html = re.sub(r"(?is)<(script|iframe|object|embed|form|input|button)[^>]*/?>", "", html)
    html = re.sub(r'(?i)\son\w+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)', "", html)
    html = re.sub(r'(?i)(href|src)\s*=\s*(["\'])\s*javascript:[^"\']*\2', r'\1="#"', html)
    return html


def page(title: str, body: str) -> str:
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<meta name="robots" content="noindex"><title>{htmlmod.escape(title)}</title>'
            f'<meta name="apple-mobile-web-app-title" content="Paper">'
            f'<style>{CSS}</style></head><body><main>{body}</main></body></html>')


def edition_html(cfg: dict, day: date, no: int, arts: list[dict], epub_name: str, for_email=False) -> str:
    esc = htmlmod.escape
    stamp = f"{day:%A, %B} {day.day}, {day.year} · No. {no}"
    btns = "" if for_email else (
        f'<div class="btns"><a class="btn" href="{esc(epub_name)}">Open in Books</a>'
        f'<a class="btn" href="../">Past issues</a></div>')
    toc = "".join(f'<li><a href="#a{i}">{esc(a["title"])}</a> '
                  f'<span class="meta">{esc(a.get("source") or a["domain"])}</span></li>'
                  for i, a in enumerate(arts))
    body = (f'<header class="mast"><p>{esc(stamp)}</p><h1>{esc(cfg["paper_title"])}</h1>'
            f'<p>{esc(cfg["paper_tagline"])}</p>{btns}</header><ol class="toc">{toc}</ol>')
    for i, a in enumerate(arts):
        mins = max(1, round(words(a["html"]) / 200))
        link = (f' · <a href="{esc(a["url"])}">original</a>' if a.get("url") else "")
        body += (f'<article id="a{i}"><h2>{esc(a["title"])}</h2>'
                 f'<div class="meta">{esc(a.get("source") or a["domain"])} · {mins} min{link}</div>'
                 f'{clean_body(a["html"])}'
                 + ("" if for_email else '<p class="top"><a href="#">Back to top</a></p>')
                 + "</article>")
    return page(f'{cfg["paper_title"]}, {day:%b} {day.day}', body)


def write_index(cfg: dict) -> None:
    eds = sorted((p for p in SITE.iterdir() if p.is_dir() and re.match(r"\d{4}-\d{2}-\d{2}$", p.name)),
                 reverse=True)
    items = ""
    for p in eds:
        meta = json.loads((p / "edition.json").read_text()) if (p / "edition.json").exists() else {}
        d = date.fromisoformat(p.name)
        items += (f'<li><a href="{p.name}/">{d:%A, %B} {d.day}</a>'
                  f'<div class="meta">{htmlmod.escape(" · ".join(meta.get("titles", [])))}</div></li>')
    latest = f'<div class="btns"><a class="btn" href="{eds[0].name}/">Today\'s paper</a></div>' if eds else ""
    body = (f'<header class="mast"><h1>{htmlmod.escape(cfg["paper_title"])}</h1>'
            f'<p>Past issues</p>{latest}</header><ul class="archive">{items or "<li>No issues yet.</li>"}</ul>')
    (SITE / "index.html").write_text(page(cfg["paper_title"], body))
    if eds:
        (SITE / "latest.json").write_text(json.dumps({"date": eds[0].name}))


def prune(keep_days: int) -> None:
    cutoff = date.today() - timedelta(days=keep_days)
    for p in SITE.iterdir():
        if p.is_dir() and re.match(r"\d{4}-\d{2}-\d{2}$", p.name) and date.fromisoformat(p.name) < cutoff:
            shutil.rmtree(p, ignore_errors=True)
            log(f"removed old issue {p.name}")


def cmd_build(day: "date | None" = None) -> int:
    cfg = load_sources()
    day = day or date.today()
    SITE.mkdir(parents=True, exist_ok=True)
    seen = load_seen()
    arts = pick(cfg, seen)
    if not arts:
        log("no articles could be read today; no issue built")
        notify_failure("No Morning Paper today: none of the sources could be read. See paper.log.")
        save_seen(seen)
        return 1
    no_file = STATE / "edition.txt"
    no = int(no_file.read_text()) + 1 if no_file.exists() else 1
    ed = SITE / day.isoformat()
    if ed.exists():
        shutil.rmtree(ed)
    ed.mkdir(parents=True)
    try:
        epub = build_epub(ed, cfg, arts, no)
    except Exception as e:
        log(f"build failed: {e}")
        notify_failure(f"Morning Paper build failed: {e}")
        return 1
    (ed / "index.html").write_text(edition_html(cfg, day, no, arts, epub.name))
    (STATE / "email.html").write_text(edition_html(cfg, day, no, arts, epub.name, for_email=True))
    (ed / "edition.json").write_text(json.dumps({
        "number": no, "built": datetime.now().isoformat(timespec="seconds"),
        "titles": [a["title"] for a in arts], "sources": [a.get("source") for a in arts],
        "epub": epub.name}))
    no_file.write_text(str(no))
    save_seen(seen)
    prune(cfg["keep_days"])
    write_index(cfg)
    log(f"built issue {no} for {day}: " + "; ".join(f"{a.get('source')}: {a['title'][:50]}" for a in arts))
    return 0


# --------------------------------------------------------------------------- deliver
def ntfy(title: str, message: str, click: str = "", priority: str = "default", tags: str = "newspaper") -> None:
    base, topic = os.environ.get("NTFY_URL", "").rstrip("/"), os.environ.get("NTFY_TOPIC", "")
    if not (base and topic):
        log("ntfy not set; push skipped")
        return
    headers = {"Title": title, "Priority": priority, "Tags": tags}
    if click:
        headers["Click"] = click
    if os.environ.get("NTFY_TOKEN"):
        headers["Authorization"] = f"Bearer {os.environ['NTFY_TOKEN']}"
    try:
        requests.post(f"{base}/{topic}", data=message.encode(), headers=headers, timeout=20).raise_for_status()
        log(f"ntfy sent: {title}")
    except requests.RequestException as e:
        log(f"ntfy failed: {e}")


def notify_failure(msg: str) -> None:
    ntfy("Morning Paper problem", msg, priority="high", tags="warning")


def send_email(subject: str, html: str, attachment: "Path | None") -> None:
    user, pw, to = os.environ.get("MAIL_USER"), os.environ.get("MAIL_APP_PASSWORD"), os.environ.get("MAIL_TO")
    if not (user and pw and to):
        log("email not set; email skipped")
        return
    msg = EmailMessage()
    msg["Subject"], msg["From"], msg["To"] = subject, f"Morning Paper <{user}>", to
    msg.set_content("Today's Morning Paper is attached as an EPUB. Open it in Apple Books.")
    msg.add_alternative(html, subtype="html")
    if attachment and attachment.exists():
        msg.add_attachment(attachment.read_bytes(), maintype="application", subtype="epub+zip",
                           filename=attachment.name)
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    with smtplib.SMTP_SSL(host, int(os.environ.get("SMTP_PORT", "465")), timeout=60) as s:
        s.login(user, pw)
        s.send_message(msg)
    log(f"email sent to {to}")


def cmd_deliver(day: "date | None" = None) -> int:
    cfg = load_sources()
    day = day or date.today()
    ed = SITE / day.isoformat()
    meta_p = ed / "edition.json"
    if not meta_p.exists():
        notify_failure(f"No Morning Paper was built for {day}. See paper.log.")
        return 1
    meta = json.loads(meta_p.read_text())
    if meta.get("delivered"):
        log("already delivered today")
        return 0
    base = os.environ.get("PAPER_URL", "").rstrip("/")
    titles = meta["titles"]
    ntfy(f"{cfg['paper_title']} is ready", "\n".join(f"• {t}" for t in titles),
         click=f"{base}/{day.isoformat()}/" if base else "")
    try:
        send_email(f"{cfg['paper_title']}, {day:%a %b} {day.day}: {titles[0]}",
                   (STATE / "email.html").read_text(), ed / meta["epub"])
    except Exception as e:
        log(f"email failed: {type(e).__name__}: {e}")
        notify_failure(f"Morning Paper email failed: {type(e).__name__}")
    meta["delivered"] = datetime.now().isoformat(timespec="seconds")
    meta_p.write_text(json.dumps(meta))
    return 0


def main(argv: list[str]) -> int:
    cmd = argv[1] if len(argv) > 1 else "run"
    if cmd == "build":
        return cmd_build()
    if cmd == "deliver":
        return cmd_deliver()
    if cmd == "run":
        rc = cmd_build()
        return cmd_deliver() if rc == 0 else rc
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
