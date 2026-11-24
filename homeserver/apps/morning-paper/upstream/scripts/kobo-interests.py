#!/usr/bin/env python3
"""Build interests.json: the curation input for the morning paper.

Read-only on every source. Writes one file, atomically, into data_dir (see config.json).
The curation step (an LLM, see README) reads it and picks about 10 articles into queue.txt.

Inputs and base weights:
  books_reading  35%  Kobo sync progress > 0 in the last 30 days + Audiobookshelf progress
  own_titles     30%  media requests you made (JSONL log and/or Seerr)
  genre_core     20%  your standing genres, plus SPECIFIC screen entries only
  tiktok         10%  public collections listed with yt-dlp (config list)
  kickstarter     5%  backed projects (IMAP, readonly), at most one item
  conversation, instagram, notes: 0%

Every source is optional. A source that is not configured or that fails gives its weight
to books_reading and own_titles (35:30) and says why in interests.json.
"""
import imaplib
import json
import os
import re
import sqlite3
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timedelta, timezone
from email import message_from_bytes
from email.header import decode_header, make_header
from pathlib import Path
from urllib.request import Request, urlopen

from kobo_config import CFG, DATA_DIR

OUT = DATA_DIR / "interests.json"
MEDIA_WATCH = Path(CFG["media_watch_file"]).expanduser() if CFG["media_watch_file"] else None
CALIBRE_APP_DB = CFG["calibre_web_app_db"]
CALIBRE_META_DB = str(Path(CFG["calibre_library"]) / "metadata.db")
SEERR_SETTINGS = CFG["seerr_settings"]
YTDLP = CFG["ytdlp"]

BASE_WEIGHTS = {"books_reading": 0.35, "own_titles": 0.30, "genre_core": 0.20,
                "tiktok": 0.10, "kickstarter": 0.05}
ZERO_WEIGHT = ["conversation_topics", "instagram_saves", "notes_app"]
READING_DAYS = 30

# A screen entry must name a specific title, franchise or creator. These never qualify.
GENERIC_NAMES = {
    "movie", "movies", "film", "films", "tv", "television", "tv shows", "tv series",
    "entertainment", "entertainment news", "movies and tv", "movies & tv", "movies/tv",
    "cinema", "streaming", "shows", "series", "hollywood", "filmmaking",
}
ALLOWED_KINDS = {"book", "author", "title", "franchise", "creator", "universe",
                 "genre", "project", "recipe"}

RULES = [
    "Curate from the entries below. Weights say how many of the ~10 articles each input earns.",
    "No generic movies/TV or entertainment-news items. Cover only the named titles, franchises, creators and universes.",
    "Kickstarter: at most one item. Genres are reading genres only.",
    "Items at most max_age_days old, one primer per topic, queue.txt and pinned.txt always included.",
]


def today():
    return datetime.now(timezone.utc).date().isoformat()


def load_config():
    return dict(CFG)


def write_atomic(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=path.name + ".")
    with os.fdopen(fd, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, path)


def ro_connect(path):
    return sqlite3.connect(f"file:{path}?mode=ro", uri=True)


def clean_title(t):
    t = re.sub(r"\s*\((?:19|20)\d\d\)\s*$", "", t.strip())
    t = re.sub(r"\s*\((?:Tunarr|seasons?|S\d)[^)]*\)\s*$", "", t, flags=re.I)
    return t.strip()


# --- books_reading ----------------------------------------------------------------

def kobo_reading(cfg, now=None):
    if not Path(CALIBRE_APP_DB).exists():
        raise RuntimeError("calibre_web_app_db not found; set it in config.json")
    now = now or datetime.now(timezone.utc)
    cutoff = (now - timedelta(days=READING_DAYS)).strftime("%Y-%m-%d %H:%M:%S")
    app, meta = ro_connect(CALIBRE_APP_DB), ro_connect(CALIBRE_META_DB)
    rows = app.execute(
        """SELECT s.book_id, s.last_modified,
                  COALESCE(b.progress_percent,0)
           FROM kobo_reading_state s JOIN kobo_bookmark b ON b.kobo_reading_state_id = s.id
           WHERE s.user_id = ? AND s.last_modified >= ?""",
        (cfg["kobo_user_id"], cutoff)).fetchall()
    out = []
    for book_id, synced, progress in rows:
        if not progress or progress <= 0:
            continue
        r = meta.execute("SELECT title, author_sort FROM books WHERE id=?", (book_id,)).fetchone()
        if not r or r[0] == "Read Later":
            continue  # the paper itself is not a book you read
        authors = [a[0] for a in meta.execute(
            "SELECT a.name FROM authors a JOIN books_authors_link l ON l.author=a.id WHERE l.book=?",
            (book_id,))]
        out.append({"kind": "book", "name": r[0], "creator": ", ".join(authors),
                    "date": synced[:10], "progress_pct": round(progress, 1),
                    "why": f"Kobo sync, {round(progress)}% read, last synced {synced[:10]}"})
    return out


def abs_reading(now=None):
    if not CFG["audiobookshelf_container"]:
        raise RuntimeError("audiobookshelf_container not set (source skipped)")
    now = now or datetime.now(timezone.utc)
    js = (f"const s=require('sqlite3');const db=new s.Database('{CFG['audiobookshelf_db']}',s.OPEN_READONLY);"
          "db.all(\"select mp.currentTime t,mp.duration d,mp.isFinished f,mp.updatedAt u,b.title n "
          "from mediaProgresses mp join books b on b.id=mp.mediaItemId where mp.currentTime>60\","
          "(e,r)=>{if(e){console.error(e.message);process.exit(1)}console.log(JSON.stringify(r))});")
    p = subprocess.run(["docker", "exec", CFG["audiobookshelf_container"], "node", "-e", js],
                       capture_output=True, text=True, timeout=60)
    if p.returncode != 0:
        raise RuntimeError("audiobookshelf read failed: " + p.stderr.strip()[:200])
    cutoff = (now - timedelta(days=READING_DAYS)).date().isoformat()
    meta = ro_connect(CALIBRE_META_DB)
    out = []
    for r in json.loads(p.stdout):
        if r["f"] or r["u"][:10] < cutoff:
            continue
        authors = ""
        m = meta.execute("SELECT id FROM books WHERE title=?", (r["n"],)).fetchone()
        if m:
            authors = ", ".join(a[0] for a in meta.execute(
                "SELECT a.name FROM authors a JOIN books_authors_link l ON l.author=a.id WHERE l.book=?",
                (m[0],)))
        pct = round(100 * r["t"] / r["d"], 1) if r["d"] else None
        out.append({"kind": "book", "name": r["n"], "creator": authors, "date": r["u"][:10],
                    "progress_pct": pct, "why": f"Audiobookshelf progress {pct}%, last played {r['u'][:10]}"})
    return out


def merge_books(*lists):
    seen = {}
    for lst in lists:
        for e in lst:
            key = e["name"].lower()
            if key in seen:
                seen[key]["why"] += "; " + e["why"].split(",")[0]
                seen[key]["date"] = max(seen[key]["date"], e["date"])
            else:
                seen[key] = dict(e)
    return sorted(seen.values(), key=lambda e: e["date"], reverse=True)


# --- own_titles ---------------------------------------------------------------------

def excluded_title(title, cfg):
    low = title.lower()
    if "tunarr" in low:
        return True
    return any(x.lower() in low for x in cfg["exclude_titles"])


def media_watch_titles(cfg):
    out = []
    if MEDIA_WATCH is None or not MEDIA_WATCH.exists():
        raise RuntimeError("media_watch_file not set or missing (source skipped)")
    for line in MEDIA_WATCH.read_text().splitlines():
        if not line.strip():
            continue
        d = json.loads(line)
        if d.get("requested_by") != cfg["media_requester"] or d.get("service") not in ("sonarr", "radarr"):
            continue
        if excluded_title(d["title"], cfg):
            continue
        out.append({"kind": "title", "name": clean_title(d["title"]),
                    "date": datetime.fromtimestamp(d["added_at"], timezone.utc).date().isoformat(),
                    "why": f"your {d['service']} request via media log"})
    return out


def seerr_get(cfg, path):
    if not cfg["seerr_url"] or not SEERR_SETTINGS:
        raise RuntimeError("seerr_url / seerr_settings not set (source skipped)")
    key = json.load(open(SEERR_SETTINGS))["main"]["apiKey"]
    req = Request(cfg["seerr_url"] + path, headers={"X-Api-Key": key})
    with urlopen(req, timeout=20) as r:
        return json.load(r)


def seerr_titles(cfg, fetch=None):
    """Your Seerr requests only. Returns (titles, screen_leads) where leads feed genre_core."""
    fetch = fetch or (lambda p: seerr_get(cfg, p))
    titles, leads = [], []
    for r in fetch("/api/v1/request?take=200")["results"]:
        who = r.get("requestedBy", {})
        name = who.get("username") or who.get("displayName") or ""
        if name != cfg["seerr_user"] or name in cfg["exclude_requesters"]:
            continue
        kind, tmdb = r["media"]["mediaType"], r["media"]["tmdbId"]
        try:
            info = fetch(f"/api/v1/{'tv' if kind == 'tv' else 'movie'}/{tmdb}")
        except Exception:
            continue
        title = info.get("title") or info.get("name")
        if not title or excluded_title(title, cfg):
            continue
        date = r["createdAt"][:10]
        titles.append({"kind": "title", "name": title, "date": date,
                       "why": "your Seerr request"})
        coll = (info.get("collection") or info.get("belongsToCollection") or {}).get("name")
        if coll:
            leads.append({"kind": "franchise", "name": coll.replace(" Collection", ""), "date": date,
                          "why": f"franchise of your Seerr request '{title}'"})
        if kind == "tv":
            for c in info.get("createdBy", [])[:2]:
                leads.append({"kind": "creator", "name": c["name"], "date": date,
                              "why": f"creator of your Seerr request '{title}'"})
        else:
            for c in info.get("credits", {}).get("crew", []):
                if c.get("job") == "Director":
                    leads.append({"kind": "creator", "name": c["name"], "date": date,
                                  "why": f"director of your Seerr request '{title}'"})
                    break
    return titles, leads


def dedupe(entries):
    seen, out = set(), []
    for e in entries:
        k = (e["kind"], e["name"].lower())
        if k not in seen:
            seen.add(k)
            out.append(e)
    return out


# --- genre_core -----------------------------------------------------------------------

def generic(name):
    return name.strip().lower() in GENERIC_NAMES


def genre_core(cfg, books, own, leads):
    """Genres stay genres. The movies/TV part is only concrete: franchises, creators, titles
    seeded from your own titles and your reading. Never a movies/tv category."""
    entries = [{"kind": "genre", "name": g, "date": today(), "why": "fixed core, reading genre"}
               for g in cfg["genres"]]
    entries += leads
    for b in books:
        for a in filter(None, [x.strip() for x in b.get("creator", "").split(",")]):
            entries.append({"kind": "creator", "name": a, "date": b["date"],
                            "why": f"author of '{b['name']}' you are reading: adaptations and same-universe news"})
    entries = [e for e in dedupe(entries) if e["kind"] in ALLOWED_KINDS and not generic(e["name"])]
    return entries


# --- tiktok -----------------------------------------------------------------------------

def tiktok_collection(url):
    p = subprocess.run([YTDLP, "--flat-playlist", "-J", "--no-warnings", url],
                       capture_output=True, text=True, timeout=120)
    if not p.stdout.strip():
        raise RuntimeError("yt-dlp: " + (p.stderr.strip().splitlines() or ["no output"])[-1][:160])
    data = json.loads(p.stdout)
    items = [e for e in data.get("entries", []) if e]
    if not items:
        why = (p.stderr.strip().splitlines() or ["empty listing"])[0][:160]
        raise RuntimeError("collection listing empty: " + why)
    name = data.get("title") or url
    return [{"kind": "recipe" if "recipe" in name.lower() else "title",
             "name": e.get("title") or e.get("id"), "date": today(),
             "why": f"public TikTok collection {name}"} for e in items[:40]]


def tiktok(cfg, lister=tiktok_collection):
    entries, errors = [], []
    if not cfg["tiktok_collections"]:
        return [], {"status": "failed", "reason": "no tiktok_collections configured"}
    for url in cfg["tiktok_collections"]:
        try:
            entries += lister(url)
        except Exception as e:
            errors.append(f"{url}: {e}")
    if errors and not entries:
        return [], {"status": "failed", "reason": " | ".join(errors)}
    st = {"status": "ok"}
    if errors:
        st["partial_errors"] = errors
    return entries, st


# --- kickstarter -----------------------------------------------------------------------

def kickstarter_projects():
    if not CFG["kickstarter_enabled"]:
        raise RuntimeError("kickstarter_enabled is false (source skipped)")
    env = {"user": os.environ.get("KOBO_IMAP_USER"), "password": os.environ.get("KOBO_IMAP_PASSWORD")}
    if not (env["user"] and env["password"]):
        raise RuntimeError("set KOBO_IMAP_USER and KOBO_IMAP_PASSWORD")
    M = imaplib.IMAP4_SSL(CFG["imap_host"])
    try:
        M.login(env["user"], env["password"])
        M.select('"%s"' % CFG["imap_folder"], readonly=True)
        t, d = M.search(None, "FROM", "kickstarter.com", "SUBJECT", '"You just backed"')
        out = []
        for i in d[0].split():
            t, m = M.fetch(i, "(BODY.PEEK[HEADER.FIELDS (SUBJECT DATE)])")
            msg = message_from_bytes(m[0][1])
            subj = str(make_header(decode_header(msg["Subject"]))).replace("\r\n", " ")
            name = re.sub(r"^You just backed\s+", "", subj)
            date = datetime.strptime(msg["Date"][:25].strip(), "%a, %d %b %Y %H:%M:%S").date().isoformat()
            out.append({"kind": "project", "name": re.split(r"\s[:|\-]\s|:\s|,\s", name)[0].strip(),
                        "date": date, "why": f"Kickstarter project you backed ({date}); updates only"})
        return sorted(out, key=lambda e: e["date"], reverse=True)
    finally:
        try:
            M.logout()
        except Exception:
            pass


# --- assembly ---------------------------------------------------------------------------

def redistribute(weights, failed):
    w = dict(weights)
    freed = sum(w[k] for k in failed)
    for k in failed:
        w[k] = 0.0
    base = w["books_reading"] + w["own_titles"]
    for k in ("books_reading", "own_titles"):
        w[k] += freed * w[k] / base
    return {k: round(v, 4) for k, v in w.items()}


def build(cfg, src):
    status, notes = {}, {}

    def run(name, fn, default):
        try:
            res = fn()
            status[name] = {"status": "ok"}
            return res
        except Exception as e:
            status[name] = {"status": "failed", "reason": str(e)[:300]}
            return default

    kobo = run("kobo_sync", src["kobo"], [])
    abook = run("audiobookshelf", src["abs"], [])
    books = merge_books(kobo, abook)
    mw = run("media_watch", src["media_watch"], [])
    seerr_res = run("seerr", src["seerr"], ([], []))
    own = dedupe(mw + seerr_res[0])
    own.sort(key=lambda e: e["date"], reverse=True)
    genres = genre_core(cfg, books, own, seerr_res[1])
    tk_entries, status["tiktok"] = src["tiktok"]()
    ks = run("kickstarter", src["kickstarter"], [])

    input_status = {
        "books_reading": status["kobo_sync"] if status["kobo_sync"]["status"] == "failed" or
        status["audiobookshelf"]["status"] == "ok" else status["audiobookshelf"],
        "own_titles": status["media_watch"] if status["media_watch"]["status"] == "failed" else status["seerr"],
        "genre_core": {"status": "ok"},
        "tiktok": status["tiktok"],
        "kickstarter": status["kickstarter"],
    }
    # a books/own source pair reports failed only when every part failed
    if status["kobo_sync"]["status"] == "failed" and status["audiobookshelf"]["status"] == "failed":
        input_status["books_reading"] = status["kobo_sync"]
    elif "failed" in (status["kobo_sync"]["status"], status["audiobookshelf"]["status"]):
        input_status["books_reading"] = {"status": "partial", "parts": {
            "kobo_sync": status["kobo_sync"], "audiobookshelf": status["audiobookshelf"]}}
    if status["media_watch"]["status"] == "failed" and status["seerr"]["status"] == "failed":
        input_status["own_titles"] = status["media_watch"]
    elif "failed" in (status["media_watch"]["status"], status["seerr"]["status"]):
        input_status["own_titles"] = {"status": "partial", "parts": {
            "media_watch": status["media_watch"], "seerr": status["seerr"]}}

    failed = [k for k in ("tiktok", "kickstarter") if input_status[k]["status"] == "failed"]
    weights = redistribute(BASE_WEIGHTS, failed)
    for k in failed:
        notes[k] = (f"{k} failed ({input_status[k]['reason']}); its {BASE_WEIGHTS[k]:.0%} moved to "
                    "books_reading and own_titles in proportion 35:30.")
    weights.update({k: 0.0 for k in ZERO_WEIGHT})

    inputs = {
        "books_reading": {"weight": weights["books_reading"], "entries": books},
        "own_titles": {"weight": weights["own_titles"], "entries": own},
        "genre_core": {"weight": weights["genre_core"], "entries": genres},
        "tiktok": {"weight": weights["tiktok"], "entries": tk_entries},
        "kickstarter": {"weight": weights["kickstarter"], "max_items": 1, "entries": ks},
    }
    for k, v in inputs.items():
        v["status"] = input_status[k]
        v["count"] = len(v["entries"])
    return {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "weights": weights,
        "weight_notes": notes,
        "inputs": inputs,
        "excluded_inputs": {k: "weight 0" for k in ZERO_WEIGHT},
        "always_included": [f"{DATA_DIR}/queue.txt (kobo: urls)", f"{DATA_DIR}/pinned.txt"],
        "rules": RULES + list(cfg.get("extra_rules", [])),
    }


def main():
    cfg = load_config()
    src = {
        "kobo": lambda: kobo_reading(cfg),
        "abs": abs_reading,
        "media_watch": lambda: media_watch_titles(cfg),
        "seerr": lambda: seerr_titles(cfg),
        "tiktok": lambda: tiktok(cfg),
        "kickstarter": kickstarter_projects,
    }
    doc = build(cfg, src)
    write_atomic(OUT, doc)
    print(f"{datetime.now():%F %T} wrote {OUT}: " + ", ".join(
        f"{k}={v['count']}({v['status']['status']})" for k, v in doc["inputs"].items()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
