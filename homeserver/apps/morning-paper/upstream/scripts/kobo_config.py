"""Shared configuration for the morning-paper scripts.

Settings come from a JSON file. Lookup order:
  1. the path in the KOBO_PAPER_CONFIG environment variable
  2. ./config.json (the current directory)
  3. config.json in the repo root (next to scripts/)
Every key has a default, so the scripts run with no config file at all.
Secrets (the optional IMAP login) are read from environment variables, never from the file.
"""
import json
import os
from pathlib import Path

DEFAULTS = {
    # Where the pipeline keeps its files: queue.txt, articles/, interests.json, the EPUB, logs.
    "data_dir": "~/kobo-articles",
    # The paper itself.
    "paper_title": "The Morning Paper",
    "paper_tagline": "All the Reads Worth Your Time",
    "book_title": "Read Later",          # the single Calibre book that is refreshed daily
    "book_author": "Articles",
    "max_age_days": 7,                    # drop articles older than this (pinned.txt bypasses)
    # Fonts for the generated cover and front page (TTF files). See README, "Fonts".
    "fonts_dir": "fonts",                 # relative to data_dir unless absolute
    "masthead_font": "UnifrakturMaguntia-Book.ttf",
    "serif_bold_font": "PT_Serif-Web-Bold.ttf",
    "serif_regular_font": "PT_Serif-Web-Regular.ttf",
    # Calibre / Calibre-Web (all optional: without them the build stops after writing the EPUB).
    "calibre_enabled": True,
    "calibre_library": "/path/to/calibre/library",   # folder that holds metadata.db
    "calibre_docker_image": "lscr.io/linuxserver/calibre:latest",
    "calibre_web_container": "calibre-web",
    "calibre_web_app_db": "/path/to/calibre-web/config/app.db",
    "kobo_user_id": 1,                    # Calibre-Web user id that owns the Kobo
    # Interest model sources.
    "audiobookshelf_container": "",       # docker container name; empty = skip Audiobookshelf
    "audiobookshelf_db": "/config/absdatabase.sqlite",
    "media_watch_file": "",               # optional JSONL of media requests; empty = skip
    "media_requester": "me",              # value of requested_by that counts as yours
    "seerr_url": "",                      # e.g. http://localhost:5055 ; empty = skip Seerr
    "seerr_settings": "",                 # path to Seerr settings.json (holds the API key)
    "seerr_user": "",
    "ytdlp": "yt-dlp",                    # path or name of the yt-dlp binary
    "tiktok_collections": [],             # public TikTok collection URLs
    "exclude_titles": [],
    "exclude_requesters": [],
    "genres": ["fiction", "fantasy"],
    "extra_rules": [],                    # extra plain-English rules appended to interests.json
    "lead_image_avoid_faces": True,       # skip photos with a prominent face for lead images
    "library_owner": "1000:1000",         # uid:gid that owns your Calibre library
    "kickstarter_enabled": False,         # needs KOBO_IMAP_USER / KOBO_IMAP_PASSWORD
    "imap_host": "imap.gmail.com",
    "imap_folder": "[Gmail]/All Mail",
}


def config_path() -> Path:
    env = os.environ.get("KOBO_PAPER_CONFIG")
    if env:
        return Path(env).expanduser()
    for p in (Path.cwd() / "config.json", Path(__file__).resolve().parent.parent / "config.json"):
        if p.exists():
            return p
    return Path("config.json")


def load() -> dict:
    cfg = dict(DEFAULTS)
    p = config_path()
    if p.exists():
        cfg.update({k: v for k, v in json.loads(p.read_text()).items() if not k.startswith("_")})
    return cfg


CFG = load()
DATA_DIR = Path(CFG["data_dir"]).expanduser()
