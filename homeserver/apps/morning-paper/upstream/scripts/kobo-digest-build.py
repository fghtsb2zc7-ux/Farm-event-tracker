#!/usr/bin/env python3
"""Build one daily EPUB "newspaper" from queued article URLs and refresh it in Calibre.

Designed so the paper syncs to a Kobo through Calibre-Web's Kobo Sync: ONE Calibre book
that is refreshed every day, not a new file per batch.

  1. For each URL in queue.txt not already stored: fetch + extract clean article text
     with trafilatura and save one JSON per article under articles/. Failures are logged
     and dropped from the queue (not retried forever).
  2. Rebuild ONE EPUB (read-later.epub) from ALL stored articles with ebooklib, newest
     first, one chapter each, with a generated cover and a tappable front page.
  3. Update the single Calibre book in place with calibredb (add_format), refresh its
     KEPUB, put it on the Calibre-Web kobo_sync shelf, and restart Calibre-Web so Kobo
     Sync offers the refreshed book.

URLs reach queue.txt from the curation step (see README) or from scripts/kobo-queue.py.

Usage:
  kobo-digest-build.py                    full run (needs Calibre; see config.json)
  kobo-digest-build.py --dry-build DIR    build only the EPUB from DIR/articles/*.json.
                                          No network, no Calibre, nothing outside DIR.

All settings live in config.json (see config.example.json).
"""
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import requests
import trafilatura
from trafilatura.utils import decode_file
from ebooklib import epub

from kobo_config import CFG, DATA_DIR

BASE = DATA_DIR
QUEUE = BASE / "queue.txt"
ARTICLES = BASE / "articles"
EPUB_OUT = BASE / "read-later.epub"
BOOK_ID_FILE = BASE / "book_id.txt"
LOG = BASE / "build.log"

CALIBRE_LIB_HOST = CFG["calibre_library"]   # bind-mounted into the calibredb container
BOOK_TITLE = CFG["book_title"]
BOOK_AUTHOR = CFG["book_author"]
PAPER_TITLE = CFG["paper_title"]
PAPER_TAGLINE = CFG["paper_tagline"]

WORDS_PER_MIN = 200   # reading-speed assumption for the "(N min)" estimate
CAP_MINUTES = 0       # 0 = NO cap (full text always); >0 truncates to that many min
MAX_AGE_DAYS = int(CFG["max_age_days"])   # NEWS paper: drop any article older than this

# Some publishers reject the default python-requests UA; use normal reader headers.
ARTICLE_USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
)


def reading_minutes(words: int) -> int:
    return max(1, round(words / WORDS_PER_MIN))


def _text_words(html: str) -> int:
    import lxml.html
    try:
        return len(lxml.html.fromstring(html).text_content().split())
    except Exception:
        import re
        return len(re.sub(r"<[^>]+>", " ", html).split())


def _continue_link(url: str, domain: str) -> str:
    return (f"<p style='margin-top:1em'><em>[Truncated at ~{CAP_MINUTES} min.] "
            f"<a href='{url}'>Continue reading at {domain}</a></em></p>")


def truncate_html(html: str, cap_words: int, url: str, domain: str) -> str:
    """Cap the article near cap_words. Prefer cutting at whole top-level blocks
    (clean, no broken tags); if the article is one giant block, fall back to a
    plain-text word cut so it always caps."""
    import lxml.html
    from lxml.html import tostring
    import re
    try:
        root = lxml.html.fromstring(html)
    except Exception:
        words = re.sub(r"<[^>]+>", " ", html).split()
        if len(words) <= cap_words:
            return html
        return f"<p>{' '.join(words[:cap_words])} …</p>{_continue_link(url, domain)}"
    body = root.body if root.tag == "html" and root.body is not None else root
    children = list(body.iterchildren())
    kept, count = [], 0
    for el in children:
        w = len((el.text_content() or "").split())
        if kept and count + w > cap_words:
            break
        kept.append(el)
        count += w
    if kept and len(kept) < len(children):
        parts = [tostring(el, encoding="unicode") for el in kept]
        parts.append(_continue_link(url, domain))
        return "".join(parts)
    # element-boundary cut dropped nothing (single huge block, or all under cap):
    words = body.text_content().split()
    if len(words) <= cap_words:
        return html
    return f"<p>{' '.join(words[:cap_words])} …</p>{_continue_link(url, domain)}"


def log(msg: str) -> None:
    line = f"{datetime.now():%Y-%m-%d %H:%M:%S} {msg}"
    print(line)
    try:
        with LOG.open("a") as f:
            f.write(line + "\n")
    except OSError:
        pass


def slugify(url: str) -> str:
    import hashlib
    return hashlib.sha1(url.encode()).hexdigest()[:16]


def read_queue() -> list[str]:
    if not QUEUE.exists():
        return []
    seen, out = set(), []
    for ln in QUEUE.read_text().splitlines():
        u = ln.strip()
        if u and not u.startswith("#") and u not in seen:
            seen.add(u)
            out.append(u)
    return out


class ArticleFailure(Exception):
    """A reason suitable for the per-URL log and the run summary."""


def _declared_date(downloaded: str) -> "str | None":
    """The publisher's OWN published date from the page, as YYYY-MM-DD.

    trafilatura's meta.date is a heuristic and it can land on a date from a
    sidebar or a related-posts block, which would make a fresh article look stale
    and drop it from the edition with nothing in the log to say why.

    So prefer what the page declares about itself. Only article:published_time
    and JSON-LD datePublished are read; MODIFIED times are deliberately ignored,
    because a much-later edit would make an old article look new.
    """
    import re as _re
    patterns = (
        r'<meta[^>]+property=["\']article:published_time["\'][^>]+content=["\'](\d{4}-\d{2}-\d{2})',
        r'<meta[^>]+content=["\'](\d{4}-\d{2}-\d{2})[^"\']*["\'][^>]+property=["\']article:published_time["\']',
        r'"datePublished"\s*:\s*["\'](\d{4}-\d{2}-\d{2})',
    )
    for pattern in patterns:
        m = _re.search(pattern, downloaded, _re.I)
        if m:
            return m.group(1)
    return None


def extract_article(url: str) -> dict:
    """Fetch + extract one article, raising ArticleFailure on failure."""
    downloaded = None
    try:
        with requests.get(url, timeout=30, headers={
            "User-Agent": ARTICLE_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }) as response:
            if response.status_code in (401, 403, 429):
                raise ArticleFailure(f"blocked (HTTP {response.status_code})")
            elif not 200 <= response.status_code < 300:
                raise ArticleFailure(f"fetch error (HTTP {response.status_code})")
            else:
                downloaded = decode_file(response.content)
    except requests.RequestException as e:
        reason = " ".join(str(e).split()) or type(e).__name__
        raise ArticleFailure(f"fetch error ({reason})") from e
    html = trafilatura.extract(downloaded, output_format="html",
                               include_links=False, include_images=False,
                               with_metadata=False)
    if not html:
        raise ArticleFailure("no content extracted")
    meta = trafilatura.extract_metadata(downloaded)
    title = (getattr(meta, "title", None) or url) if meta else url
    guessed = (getattr(meta, "date", None) if meta else None)
    declared = _declared_date(downloaded)
    date = declared or guessed or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if declared and guessed and not str(guessed).startswith(declared):
        # Visible on purpose: a silent disagreement here decides whether the
        # 7-day filter keeps the article, so it should never be invisible.
        log(f"date: using declared {declared} over extracted {guessed} for {url}")
    domain = urlparse(url).netloc.replace("www.", "")
    image = getattr(meta, "image", None) if meta else None
    if not image:  # fall back to og:image / twitter:image in the raw html
        import re as _re
        m = _re.search(r'<meta[^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\'][^>]+content=["\']([^"\']+)', downloaded, _re.I)
        if not m:
            m = _re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:og:image|twitter:image)', downloaded, _re.I)
        image = m.group(1) if m else None
    return {
        "url": url,
        "title": title.strip()[:200],
        "domain": domain,
        "published": date,
        "saved": datetime.now(timezone.utc).isoformat(),
        "image": image,
        "html": html,
    }


def store_new(urls: list[str]) -> tuple[int, list[tuple[str, str]]]:
    ARTICLES.mkdir(parents=True, exist_ok=True)
    added, failed = 0, []
    for url in urls:
        path = ARTICLES / f"{slugify(url)}.json"
        if path.exists():
            continue  # already have it; the digest is rebuilt from the full store
        try:
            art = extract_article(url)
        except ArticleFailure as e:
            reason = str(e)
        except Exception as e:  # network/parse errors must not kill the batch
            reason = f"extract error ({type(e).__name__})"
        else:
            path.write_text(json.dumps(art))
            added += 1
            log(f"stored: {art['title']} ({art['domain']})")
            continue
        failed.append((url, reason))
        log(f"{reason}: {url}")
    return added, failed


def _date_key(a: dict) -> str:
    import re
    m = re.match(r"(\d{4}-\d{2}-\d{2})", (a.get("published") or "").strip())
    return m.group(1) if m else (a.get("saved", "")[:10] or "0000-00-00")


def _fmt_date(a: dict) -> str:
    import re
    from datetime import datetime as _d
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", (a.get("published") or "").strip())
    if not m:
        return ""
    try:
        return _d(int(m.group(1)), int(m.group(2)), int(m.group(3))).strftime("%b %-d, %Y")
    except Exception:
        return m.group(0)


def load_all_articles() -> list[dict]:
    arts = []
    for p in ARTICLES.glob("*.json"):
        try:
            arts.append(json.loads(p.read_text()))
        except (OSError, ValueError):
            continue
    # NEWS paper: never show a stale story. Drop anything older than MAX_AGE_DAYS,
    # UNLESS its URL is pinned (you explicitly asked for that article) -- pinned
    # URLs live one-per-line in pinned.txt and bypass the age filter.
    from datetime import date, timedelta
    cutoff = (date.today() - timedelta(days=MAX_AGE_DAYS)).isoformat()
    pinned = set()
    pf = BASE / "pinned.txt"
    if pf.exists():
        pinned = {ln.strip() for ln in pf.read_text().splitlines()
                  if ln.strip() and not ln.startswith("#")}
    fresh, stale = [], []
    for a in arts:
        keep = _date_key(a) >= cutoff or a.get("url") in pinned
        (fresh if keep else stale).append(a)
    for a in stale:
        log(f"excluded stale ({_date_key(a)}, >{MAX_AGE_DAYS}d): {a.get('title','')[:50]}")
    fresh.sort(key=_date_key, reverse=True)  # newest first, by published date
    return fresh


FONTS = Path(CFG["fonts_dir"]).expanduser()
FONTS = FONTS if FONTS.is_absolute() else BASE / FONTS
MAST_FONT = str(FONTS / CFG["masthead_font"])
SERIF_B = str(FONTS / CFG["serif_bold_font"])
SERIF_R = str(FONTS / CFG["serif_regular_font"])
COVER_OUT = BASE / "cover.jpg"
EDITION_FILE = BASE / "edition.txt"


def _next_edition() -> int:
    try:
        n = int(EDITION_FILE.read_text().strip()) + 1
    except (OSError, ValueError):
        n = 1
    EDITION_FILE.write_text(str(n))
    return n


def _font(path, size):
    """Load a TTF, or fall back to Pillow's built-in font so a build never fails on a missing file."""
    from PIL import ImageFont
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default(size)


def _fit_font(draw, text, font_path, max_w, start, floor):
    from PIL import ImageFont
    size = start
    while size > floor:
        f = _font(font_path, size)
        if draw.textlength(text, font=f) <= max_w:
            return f
        size -= 2
    return _font(font_path, floor)


def _wrap(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=font) <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def _download_image(url):
    from io import BytesIO
    from PIL import Image
    import urllib.request
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        data = urllib.request.urlopen(req, timeout=10).read()
        return Image.open(BytesIO(data)).convert("L").convert("RGB")
    except Exception:
        return None


def _photo_score(url: str) -> float:
    """How photographic an image is. Flat logos and title cards (a wordmark on
    white, white text on black) are dominated by a couple of colours and score
    low; real photos spread pixels across many colours and score high. Score =
    colour richness * share of pixels NOT in the top-two colours."""
    from collections import Counter
    im = _download_image(url)
    if not im:
        return -1.0
    try:
        s = im.convert("RGB").resize((80, 80))
        px = list(s.getdata())
        n = len(px) or 1
        cnt = Counter((r >> 4, g >> 4, b >> 4) for r, g, b in px)
        top2 = sum(c for _, c in cnt.most_common(2))
        return len(cnt) * (1.0 - top2 / n)
    except Exception:
        return 0.0


def _has_prominent_face(url: str) -> bool:
    """True if the image shows a prominent human face; product/hardware/illustration
    shots return False. Used to keep front-page lead images off person-centered photos.
    Needs opencv-python-headless; without it this always returns False. Turn it off with
    "lead_image_avoid_faces": false in config.json."""
    if not CFG.get("lead_image_avoid_faces", True):
        return False
    im = _download_image(url)
    if not im:
        return False
    try:
        import numpy as np, cv2
        g = cv2.cvtColor(np.array(im.convert("RGB")), cv2.COLOR_RGB2GRAY)
        H, W = g.shape[:2]
        cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        faces = cascade.detectMultiScale(g, scaleFactor=1.1, minNeighbors=6,
                                         minSize=(max(24, W // 14), max(24, H // 14)))
        area = float(W * H) or 1.0
        return any((w * h) / area > 0.02 for (x, y, w, h) in faces)
    except Exception:
        return False


def _pick_lead_image(candidates: list[dict]) -> "dict | None":
    """Choose the most photographic og:image for the front page lead."""
    best, best_score = None, -1.0
    for a in candidates:
        s = _photo_score(a.get("image"))
        if s > best_score:
            best, best_score = a, s
    return best or (candidates[0] if candidates else None)


def generate_cover(articles: list[dict]) -> "Path | None":
    """Render a daily NYT-style front page ('the paper') as the EPUB
    cover: blackletter masthead, tagline, dateline with today's date, a real
    image from the edition, and headline blocks. Regenerated every build."""
    from PIL import Image, ImageDraw, ImageFont, ImageOps
    try:
        W, H, M = 1264, 1680, 60
        black, gray = (18, 18, 18), (95, 95, 95)
        img = Image.new("RGB", (W, H), "white")
        d = ImageDraw.Draw(img)
        y = 46
        mast = _fit_font(d, PAPER_TITLE, MAST_FONT, W - 2 * M, 150, 60)
        tw = d.textlength(PAPER_TITLE, font=mast)
        d.text(((W - tw) / 2, y), PAPER_TITLE, font=mast, fill=black)
        y += mast.getbbox("Tg")[3] + 28
        d.line([(M, y), (W - M, y)], fill=black, width=3)
        d.line([(M, y + 7), (W - M, y + 7)], fill=black, width=1)
        y += 22
        tag = _font(SERIF_R, 26)
        tagt = PAPER_TAGLINE
        d.text(((W - d.textlength(tagt, font=tag)) / 2, y), tagt, font=tag, fill=gray)
        y += 46
        d.line([(M, y), (W - M, y)], fill=black, width=1)
        y += 9
        small = _font(SERIF_R, 20)
        # Dateline defaults to the local date the build runs (the 6 AM cron gets the
        # correct day automatically). KOBO_DATELINE_DATE=YYYY-MM-DD overrides it for
        # a hand-built "morning edition" prepared the night before.
        _override = os.environ.get("KOBO_DATELINE_DATE")
        _d = datetime.strptime(_override, "%Y-%m-%d") if _override else datetime.now()
        try:
            date = _d.strftime("%A, %B %-d, %Y").upper()
        except ValueError:
            date = _d.strftime("%A, %B %d, %Y").upper()
        edition = _next_edition()
        d.text((M, y), f"VOL. I  ·  No. {edition}", font=small, fill=black)
        d.text((W - M - d.textlength("READ LATER", font=small), y), "READ LATER", font=small, fill=black)
        d.text(((W - d.textlength(date, font=small)) / 2, y), date, font=small, fill=black)
        y += 30
        d.line([(M, y), (W - M, y)], fill=black, width=1)
        y += 26
        imgs = [a for a in articles if a.get("image")]
        # the cover lead follows the same face-free rule
        _ff = [a for a in imgs if not _has_prominent_face(a.get("image"))]
        lead_art = (next((a for a in _ff if _photo_score(a.get("image")) > 30), None)
                    or (_ff[0] if _ff else None))
        lead = _download_image(lead_art["image"]) if lead_art else None
        if lead:
            bw, bh = W - 2 * M, int((W - 2 * M) * 0.52)
            lead = ImageOps.fit(lead, (bw, bh), Image.LANCZOS)
            img.paste(lead, (M, y))
            y += bh + 8
            cap = _font(SERIF_R, 18)
            for line in _wrap(d, lead_art["title"], cap, W - 2 * M)[:1]:
                d.text((M, y), line, font=cap, fill=gray)
            y += 30
        hl = _font(SERIF_B, 33)
        sub = _font(SERIF_R, 20)
        for a in articles:
            if y > H - 130:
                break
            d.line([(M, y), (W - M, y)], fill=black, width=1)
            y += 14
            for line in _wrap(d, a["title"], hl, W - 2 * M)[:3]:
                d.text((M, y), line, font=hl, fill=black)
                y += hl.getbbox("Tg")[3] + 4
            mins = reading_minutes(_text_words(a["html"]))
            d.text((M, y), f"{a['domain']}  ·  {mins} min", font=sub, fill=gray)
            y += 36
        img.save(str(COVER_OUT), "JPEG", quality=88)
        log(f"cover generated (edition {edition}, {len(articles)} headlines, image={'yes' if lead else 'no'})")
        return COVER_OUT
    except Exception as e:
        log(f"cover generation failed: {type(e).__name__}: {str(e)[:80]}")
        return None


def _fp_summary(html_text: str, max_sentences: int, max_chars: int) -> str:
    """First 1-3 sentences of an article, tags stripped, for a front-page teaser."""
    import re
    txt = re.sub(r"<[^>]+>", " ", html_text or "")
    txt = re.sub(r"\s+", " ", txt).strip()
    out, sents = "", 0
    for p in re.split(r"(?<=[.!?])\s+", txt):
        if not p:
            continue
        if out and len(out) + len(p) + 1 > max_chars:
            break
        out = (out + " " + p).strip()
        sents += 1
        if sents >= max_sentences:
            break
    return out or txt[:max_chars]


def build_front_page(book, articles: list[dict]):
    """Build the paper as newspaper-styled IMAGE blocks, every block a
    separate LINKED image (<a><img>) so each taps to its OWN article (Kobo does
    NOT honour HTML image maps -- every tap went to the first area -- and ignores
    CSS layout, so both the look and the per-story tap have to be baked into
    stacked linked images). Blocks:
      - HERO (page 1): nameplate + lead story (big headline, photo, summary),
        sized ~full screen, links to the lead article.
      - SECONDARY: thumbnail + headline + summary, one linked block each.
      - ROUNDUP: the remaining stories as compact styled headline blocks, one
        linked block each (this replaces the old plain HTML list so the inside
        pages keep the newspaper format).
    Rendered at the Kobo Libra Colour width (1264) so images map ~1:1."""
    from io import BytesIO
    from PIL import Image, ImageDraw, ImageFont, ImageOps

    W, M = 1264, 44
    CW = W - 2 * M
    BLACK, GRAY = (17, 17, 17), (90, 90, 90)
    blocks = []  # (href_img, article_href_or_None, pil)

    def lh(font, extra=6):
        return font.getbbox("Tg")[3] + extra

    def canvas():
        im = Image.new("RGB", (W, 4000), "white")
        return im, ImageDraw.Draw(im)

    def wrap_draw(d, text, font, x, y, maxw, fill, extra=6, maxlines=99):
        for line in _wrap(d, text, font, maxw)[:maxlines]:
            d.text((x, y), line, font=font, fill=fill); y += lh(font, extra)
        return y

    def add(pil, y, href):
        pil = pil.crop((0, 0, W, y))
        buf = BytesIO(); pil.save(buf, "JPEG", quality=90)
        n = len(blocks)
        book.add_item(epub.EpubItem(uid=f"fpimg_{n}", file_name=f"images/fp_{n}.jpg",
                                    media_type="image/jpeg", content=buf.getvalue()))
        blocks.append((f"images/fp_{n}.jpg", href, pil))

    _ov = os.environ.get("KOBO_DATELINE_DATE")
    _dt = datetime.strptime(_ov, "%Y-%m-%d") if _ov else datetime.now()
    try:
        dateline = _dt.strftime("%A, %B %-d, %Y").upper()
    except ValueError:
        dateline = _dt.strftime("%A, %B %d, %Y").upper()
    try:
        edition = int(EDITION_FILE.read_text().strip())
    except Exception:
        edition = 1

    page_of, running = {}, 0
    for i, a in enumerate(articles):
        page_of[i] = 2 + running // 300
        running += _text_words(a["html"])
    idx = {id(a): i for i, a in enumerate(articles)}

    # Lean on recency (articles are newest-first): the lead is the most RECENT
    # article with a real photo (skip flat logos via _photo_score); secondary are the
    # next most recent photo stories; the rest fall to the roundup in date order.
    # Front-page images: by default product/hardware/illustration only. Photos with a
    # prominent face are skipped for the lead + secondary thumbnails, and those stories
    # run text-only in the roundup. Still lean recent (articles are date-desc).
    facefree = [a for a in articles if a.get("image") and not _has_prominent_face(a.get("image"))]
    ff_ids = {id(a) for a in facefree}
    lead = (next((a for a in facefree if _photo_score(a.get("image")) > 30), None)
            or (facefree[0] if facefree else None)
            or (articles[0] if articles else None))
    lead_photo_ok = bool(lead) and id(lead) in ff_ids   # never render a face photo as lead
    rest = [a for a in articles if a is not lead]
    secondary = [a for a in rest if id(a) in ff_ids][:2]
    sec_ids = {id(a) for a in secondary}
    roundup = [a for a in rest if id(a) not in sec_ids]

    # ---- HERO: nameplate + lead (page 1, ~full screen) ----
    img, d = canvas(); y = 40
    mast = _fit_font(d, PAPER_TITLE, MAST_FONT, CW, 176, 60)
    d.text(((W - d.textlength(PAPER_TITLE, font=mast)) / 2, y), PAPER_TITLE, font=mast, fill=BLACK)
    y += mast.getbbox("Tg")[3] + 24
    d.line([(M, y), (W - M, y)], fill=BLACK, width=4); d.line([(M, y + 9), (W - M, y + 9)], fill=BLACK, width=1); y += 28
    tag = _font(SERIF_R, 30)
    d.text(((W - d.textlength(PAPER_TAGLINE, font=tag)) / 2, y), PAPER_TAGLINE, font=tag, fill=GRAY); y += 50
    d.line([(M, y), (W - M, y)], fill=BLACK, width=1); y += 12
    small = _font(SERIF_R, 23)
    d.text((M, y), f"VOL. I   No. {edition}", font=small, fill=BLACK)
    d.text((W - M - d.textlength("READ LATER", font=small), y), "READ LATER", font=small, fill=BLACK)
    d.text(((W - d.textlength(dateline, font=small)) / 2, y), dateline, font=small, fill=BLACK); y += 36
    d.line([(M, y), (W - M, y)], fill=BLACK, width=3); y += 20
    lead_i = idx[id(lead)] if lead else None
    if lead:
        hl = _font(SERIF_B, 58)
        y = wrap_draw(d, lead["title"], hl, M, y, CW, BLACK, 6); y += 8
        sum_f = _font(SERIF_R, 27); cont_f = _font(SERIF_R, 23)
        ls_h = len(_wrap(d, _fp_summary(lead["html"], 3, 300), sum_f, CW)[:3]) * lh(sum_f, 8)
        photo_h = max(320, min(760, 1590 - y - ls_h - lh(cont_f, 12) - 16))
        im = _download_image(lead.get("image")) if lead_photo_ok else None
        if im:
            im = ImageOps.fit(im.convert("L"), (CW, photo_h), Image.LANCZOS)
            img.paste(im.convert("RGB"), (M, y)); y += photo_h + 12
        y = wrap_draw(d, _fp_summary(lead["html"], 3, 300), sum_f, M, y, CW, GRAY, 8, 3); y += 2
        _dl = _fmt_date(lead)
        d.text((M, y), (f"{_dl}   \u00b7   " if _dl else "") + f"Continued on page {page_of[lead_i]}",
               font=cont_f, fill=BLACK); y += lh(cont_f, 12)
    add(img, y, f"art_{lead_i}.xhtml" if lead else None)

    # ---- SECONDARY blocks ----
    for a in secondary:
        i = idx[id(a)]
        img, d = canvas(); y = 20
        d.line([(M, y), (W - M, y)], fill=BLACK, width=1); y += 14
        thumb_w = int(CW * 0.34); thumb_h = int(thumb_w * 0.72)
        text_x, text_w = M, CW
        im = _download_image(a.get("image"))
        if im:
            im = ImageOps.fit(im.convert("L"), (thumb_w, thumb_h), Image.LANCZOS)
            img.paste(im.convert("RGB"), (M, y))
            text_x = M + thumb_w + 24; text_w = W - M - text_x
        hl = _font(SERIF_B, 37)
        ty = wrap_draw(d, a["title"], hl, text_x, y, text_w, BLACK, 4); ty += 4
        ty = wrap_draw(d, _fp_summary(a["html"], 2, 200), _font(SERIF_R, 24), text_x, ty, text_w, GRAY, 6, 3)
        yb = max(ty, y + thumb_h) + 6
        _meta = "   ".join(x for x in [a['domain'], _fmt_date(a), f"{reading_minutes(_text_words(a['html']))} min", f"Continued on page {page_of[i]}"] if x)
        d.text((M, yb), _meta, font=_font(SERIF_R, 21), fill=GRAY); yb += lh(_font(SERIF_R, 21), 12)
        add(img, yb, f"art_{i}.xhtml")

    # ---- ROUNDUP blocks (styled, not a plain list) ----
    if roundup:
        img, d = canvas(); y = 20
        d.line([(M, y), (W - M, y)], fill=BLACK, width=3); y += 12
        d.text((M, y), "MORE IN THIS EDITION", font=_font(SERIF_B, 26), fill=BLACK); y += 44
        d.line([(M, y), (W - M, y)], fill=BLACK, width=1); y += 8
        add(img, y, None)
        for a in roundup:
            i = idx[id(a)]
            img, d = canvas(); y = 14
            hl = _font(SERIF_B, 32)
            y = wrap_draw(d, a["title"], hl, M, y, CW, BLACK, 4); y += 2
            _rmeta = "   ".join(x for x in [a['domain'], _fmt_date(a), f"{reading_minutes(_text_words(a['html']))} min", f"page {page_of[i]}"] if x)
            d.text((M, y), _rmeta, font=_font(SERIF_R, 21), fill=GRAY); y += lh(_font(SERIF_R, 21), 12)
            d.line([(M, y), (W - M, y)], fill=BLACK, width=1); y += 8
            add(img, y, f"art_{i}.xhtml")

    parts = []
    for href, artlink, _pil in blocks:
        tagimg = f'<img src="{href}" style="width:100%;display:block"/>'
        parts.append(f'<a href="{artlink}">{tagimg}</a>' if artlink else tagimg)
    css = "body{margin:0;padding:0}img{width:100%;display:block;margin:0}a{display:block;text-decoration:none}"
    fp = epub.EpubHtml(title=PAPER_TITLE, file_name="frontpage.xhtml", lang="en")
    fp.content = f"<html><head><style>{css}</style></head><body>{''.join(parts)}</body></html>"
    book.add_item(fp)

    # stitched preview
    try:
        total = sum(p.height for _, _, p in blocks)
        prev = Image.new("RGB", (W, total), "white"); yy = 0
        for _, _, p in blocks:
            prev.paste(p, (0, yy)); yy += p.height
        prev.save(str(BASE / "frontpage_preview.jpg"), "JPEG", quality=86)
    except Exception:
        pass
    return fp


def build_epub(articles: list[dict]) -> None:
    book = epub.EpubBook()
    book.set_identifier(f"read-later-{int(time.time())}")  # fresh id each build nudges Kobo Sync
    book.set_title(BOOK_TITLE)
    book.set_language("en")
    book.add_author(BOOK_AUTHOR)
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    book.add_metadata("DC", "description", f"Saved articles digest. Refreshed {stamp}.")

    cover = generate_cover(articles)
    if cover and cover.exists():
        book.set_cover("cover.jpg", cover.read_bytes())

    chapters = []
    for i, a in enumerate(articles):
        full_min = reading_minutes(_text_words(a["html"]))
        body_html = a["html"]
        if CAP_MINUTES and full_min > CAP_MINUTES:
            body_html = truncate_html(a["html"], CAP_MINUTES * WORDS_PER_MIN,
                                      a["url"], a["domain"])
        disp_title = f"{a['title']} ({full_min} min)"
        ch = epub.EpubHtml(title=disp_title, file_name=f"art_{i}.xhtml", lang="en")
        head = (f"<h1>{a['title']}</h1>"
                f"<p style='color:#666'>{a['domain']} &middot; {a.get('published','')}"
                f" &middot; {full_min} min &middot; <a href='{a['url']}'>source</a></p><hr/>")
        # "More in this edition" footer: real cross-navigation between articles AND it
        # pads every chapter past ~5000 characters. The Kobo shows a footnote-style
        # POPUP (instead of navigating) for in-book links whose target is under 5000
        # chars; a full-length footer guarantees the front-page tap opens the article.
        import html as _hh
        others = "".join(
            f"<p style='margin:.4em 0'><a href='art_{j}.xhtml'>{_hh.escape(o['title'])}</a>"
            f"<br/><span style='color:#666'>{_hh.escape(o['domain'])} &middot; "
            f"{reading_minutes(_text_words(o['html']))} min</span><br/>"
            f"{_hh.escape(_fp_summary(o['html'], 2, 240))}</p>"
            for j, o in enumerate(articles) if j != i)
        footer = (f"<hr/><h2>More in this edition</h2>{others}"
                  f"<p style='color:#666'>{_hh.escape(PAPER_TITLE)} &middot; refreshed daily.</p>")
        content = f"{head}{body_html}{footer}"
        # HARD FLOOR: the Kobo pops up a footnote preview (instead of navigating) when a
        # link target is under ~5000 chars. The footer usually clears it, but very short
        # items (1-min blurbs, short tweets) can still fall under -- so pad to a floor with
        # faint masthead lines until the chapter's visible text exceeds it.
        import re as _re2
        MIN_CHARS = 5200
        cur = len(_re2.sub(r"<[^>]+>", "", content))
        if cur < MIN_CHARS:
            filler_line = ("<p style='color:#c8c8c8;font-size:0.8em;margin:.2em 0'>"
                           f"{_hh.escape(PAPER_TITLE)} &middot; {_hh.escape(PAPER_TAGLINE)}</p>")
            unit = len(_re2.sub(r"<[^>]+>", "", filler_line))
            reps = (MIN_CHARS - cur) // unit + 1
            content += "<hr/>" + filler_line * reps
        ch.content = f"<html><body>{content}</body></html>"
        book.add_item(ch)
        chapters.append(ch)

    front = build_front_page(book, articles)

    book.toc = tuple(chapters)
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())
    # Front page is the landing page: opening the book shows the newspaper with
    # tappable headlines, not a plain list. nav stays for the reader's TOC menu.
    book.spine = [front] + chapters
    epub.write_epub(str(EPUB_OUT), book)
    log(f"built EPUB with {len(chapters)} article(s) + interactive front page -> {EPUB_OUT}")


def calibredb(args: list[str], timeout: int = 120) -> subprocess.CompletedProcess:
    """Run calibredb against the live library via the linuxserver/calibre image,
    mirroring the pattern annas-fetch uses. EPUB_OUT is mounted read-only."""
    cmd = ["docker", "run", "--rm",
           "-v", f"{CALIBRE_LIB_HOST}:/books",
           "-v", f"{EPUB_OUT.parent}:/staged:ro",
           "--entrypoint", "/usr/bin/calibredb",
           CFG["calibre_docker_image"]] + args
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)


def update_calibre_book() -> int:
    staged = f"/staged/{EPUB_OUT.name}"
    book_id = None
    if BOOK_ID_FILE.exists():
        try:
            book_id = int(BOOK_ID_FILE.read_text().strip())
        except ValueError:
            book_id = None
    if book_id:
        r = calibredb(["add_format", str(book_id), staged, "--with-library", "/books"])
        if r.returncode == 0:
            log(f"replaced EPUB on Calibre book {book_id}")
            # Refresh the KEPUB too, or the Kobo keeps getting a plain EPUB / a stale kepub.
            sys.path.insert(0, str(Path(__file__).resolve().parent))
            from kepub_ensure import ensure_kepub
            log("refreshed KEPUB" if ensure_kepub(book_id, replace=True, backup=False)
                else "KEPUB refresh failed (kepub-sweep will retry)")
            # The Kobo fetches its cover thumbnail from calibre-web's cover endpoint,
            # which serves the LIBRARY cover file, not the EPUB's embedded image. The
            # EPUB replace alone leaves that file stale, so the device keeps showing the
            # old cover. Push the freshly generated cover into the library too.
            if COVER_OUT.exists():
                rc = calibredb(["set_metadata", str(book_id),
                                "--field", f"cover:/staged/{COVER_OUT.name}",
                                "--with-library", "/books"])
                log("updated library cover" if rc.returncode == 0
                    else f"library cover update failed ({rc.stderr.strip()[:80]})")
            return book_id
        log(f"add_format failed ({r.stderr.strip()[:120]}); recreating the book")
    # create the book fresh and record its id
    r = calibredb(["add", staged, "--with-library", "/books",
                   "--title", BOOK_TITLE, "--authors", BOOK_AUTHOR, "--languages", "en"])
    out = (r.stdout or "") + (r.stderr or "")
    import re
    m = re.search(r"Added book ids?:\s*(\d+)", out)
    if not m:
        raise SystemExit(f"calibredb add did not return a book id: {out[:200]}")
    new_id = int(m.group(1))
    BOOK_ID_FILE.write_text(str(new_id))
    log(f"created Calibre book id {new_id}")
    return new_id


CW_APP_DB = CFG["calibre_web_app_db"]  # Calibre-Web config (users/shelves/kobo sync)


def ensure_on_kobo_shelf(book_id: int) -> None:
    """Calibre-Web's Kobo Sync is shelf-restricted: only books on a shelf with
    kobo_sync=1 reach the Kobo. Make sure the digest book is on that shelf, so a
    refresh (or a recreate with a new id) can never silently drop out of sync."""
    import sqlite3
    from datetime import datetime as _dt
    try:
        c = sqlite3.connect(CW_APP_DB, timeout=10)
        shelf = c.execute("SELECT id FROM shelf WHERE kobo_sync=1 ORDER BY id LIMIT 1").fetchone()
        if not shelf:
            log("no kobo_sync shelf in Calibre-Web; cannot ensure sync scope")
            c.close()
            return
        sid = shelf[0]
        now = _dt.utcnow()
        exists = c.execute("SELECT 1 FROM book_shelf_link WHERE book_id=? AND shelf=?",
                           (book_id, sid)).fetchone()
        if exists:
            # CRITICAL for re-sync: in only_kobo_shelves mode calibre-web's kobo.py
            # selects changed books by `BookShelf.date_added > sync_token watermark`,
            # NOT by book.last_modified. Replacing the EPUB bumps the book's
            # last_modified but leaves date_added untouched, so the Kobo would see
            # "Books to Sync: 0" and never pull the refreshed digest. Re-touch
            # date_added to now on every build so each refresh clears the watermark.
            c.execute("UPDATE book_shelf_link SET date_added=? WHERE book_id=? AND shelf=?",
                      (now, book_id, sid))
            # Also clear calibre-web's "already synced" record. kobo.py excludes any
            # book already in kobo_synced_books (`Books.id.notin_(...)`), so a re-touched
            # date_added alone is NOT enough — the book stays filtered out and the Kobo
            # sees "Books to Sync: 0". Because we edit the book outside calibre-web, it
            # never removes the synced marker itself. Delete it so the digest re-offers
            # as a fresh entitlement and the Kobo re-downloads the refreshed EPUB.
            try:
                c.execute("DELETE FROM kobo_synced_books WHERE book_id=?", (book_id,))
            except Exception:
                pass
            c.commit()
            log(f"re-touched shelf {sid} date_added + cleared synced marker for book {book_id} (forces Kobo re-sync)")
        else:
            mx = c.execute("SELECT COALESCE(MAX([order]),0) FROM book_shelf_link WHERE shelf=?",
                           (sid,)).fetchone()[0]
            c.execute("INSERT INTO book_shelf_link (book_id,[order],shelf,date_added) VALUES (?,?,?,?)",
                      (book_id, mx + 1, sid, now))
            c.commit()
            log(f"added book {book_id} to kobo_sync shelf {sid}")
        c.close()
    except Exception as e:
        log(f"ensure_on_kobo_shelf failed: {type(e).__name__}")


def restart_calibre_web() -> None:
    try:
        subprocess.run(["docker", "restart", CFG["calibre_web_container"]], capture_output=True, timeout=60)
        log("restarted calibre-web (so Kobo Sync offers the refreshed book)")
    except Exception as e:
        log(f"calibre-web restart failed: {type(e).__name__}")


def main(argv=None) -> int:
    global BASE, QUEUE, ARTICLES, EPUB_OUT, BOOK_ID_FILE, LOG, FONTS, MAST_FONT, SERIF_B, SERIF_R
    global COVER_OUT, EDITION_FILE
    argv = sys.argv[1:] if argv is None else argv
    dry = None
    if "--dry-build" in argv:
        # Dry build: work entirely inside DIR (articles/ and, optionally, fonts/ live
        # there). No network, no Calibre, no calibre-web restart, no queue clear, and the
        # real edition counter is not touched.
        dry = Path(argv[argv.index("--dry-build") + 1])
        BASE = dry
        QUEUE, ARTICLES = BASE / "queue.txt", BASE / "articles"
        EPUB_OUT, BOOK_ID_FILE, LOG = BASE / "read-later.epub", BASE / "book_id.txt", BASE / "build.log"
        FONTS = BASE / "fonts"
        MAST_FONT = str(FONTS / CFG["masthead_font"])
        SERIF_B = str(FONTS / CFG["serif_bold_font"])
        SERIF_R = str(FONTS / CFG["serif_regular_font"])
        COVER_OUT, EDITION_FILE = BASE / "cover.jpg", BASE / "edition.txt"
    BASE.mkdir(parents=True, exist_ok=True)
    urls = [] if dry else read_queue()
    if not urls and not any(ARTICLES.glob("*.json")):
        log("nothing queued and no stored articles; nothing to build")
        return 0
    added, failed = store_new(urls)
    if failed:
        log("failed URLs: " + ", ".join(f"{reason}: {url}" for url, reason in failed))
    articles = load_all_articles()
    if not articles:
        log("no articles could be extracted; not touching Calibre")
        return 1
    build_epub(articles)
    if dry:
        log(f"DRY BUILD DONE: {len(articles)} items -> {EPUB_OUT} (no Calibre, no state saved)")
        return 0
    if not CFG["calibre_enabled"]:
        log(f"calibre_enabled is false: built {EPUB_OUT}, not touching Calibre")
        return 0
    book_id = update_calibre_book()
    ensure_on_kobo_shelf(book_id)
    restart_calibre_web()
    # clear the queue: everything queued was either stored or logged as failed
    QUEUE.write_text("")
    log(f"DONE: +{added} new, {len(failed)} failed, {len(articles)} total in digest, Calibre book {book_id}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
