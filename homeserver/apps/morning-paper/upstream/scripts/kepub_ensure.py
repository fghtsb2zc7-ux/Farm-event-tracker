#!/usr/bin/env python3
"""Ensure a Calibre book has a KEPUB format, so the Kobo gets a kepub (not a plain EPUB).

Why: Calibre-Web offers the Kobo whatever formats the book has. A book with only an EPUB is
downloaded as a plain EPUB, and highlights made in it vanish on the Kobo (seen in practice; adding a KEPUB fixed it). Calibre-Web's own sync-time conversion does
not leave a KEPUB row for books added by outside scripts, so the build calls this instead.

Usage: kepub_ensure.py <book_id> [<book_id> ...] [--replace]
Library import: ensure_kepub(book_id, replace=False) -> bool (never raises; logs and returns False)
"""
import argparse
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from kobo_config import CFG

LIBRARY = Path(CFG["calibre_library"])
CALIBRE_IMAGE = CFG["calibre_docker_image"]
WEB_CONTAINER = CFG["calibre_web_container"]   # its image must include kepubify (linuxserver/calibre-web does)
KEPUBIFY = "/usr/bin/kepubify"
OWNER = CFG.get("library_owner", "1000:1000")  # uid:gid that owns your Calibre library


def _log(msg):
    print(f"[kepub_ensure] {msg}", file=sys.stderr)


def _formats(book_id, library):
    c = sqlite3.connect(f"file:{library / 'metadata.db'}?mode=ro", uri=True)
    try:
        return {r[0]: r[1] for r in c.execute("select format, name from data where book=?", (book_id,))}, \
            (c.execute("select path from books where id=?", (book_id,)).fetchone() or [None])[0]
    finally:
        c.close()


def ensure_kepub(book_id, replace=False, library=LIBRARY, backup=True):
    try:
        fmts, rel = _formats(book_id, library)
        if rel is None or "EPUB" not in fmts:
            _log(f"book {book_id}: no EPUB to convert")
            return False
        if "KEPUB" in fmts and not replace:
            return True
        epub = library / rel / f"{fmts['EPUB']}.epub"
        work = Path(tempfile.mkdtemp(prefix="kepub-ensure-"))
        try:
            src = work / "in.epub"
            shutil.copy(epub, src)
            subprocess.run(["docker", "exec", WEB_CONTAINER, "mkdir", "-p", "/tmp/kepub-ensure"], check=True)
            subprocess.run(["docker", "cp", str(src), f"{WEB_CONTAINER}:/tmp/kepub-ensure/in.epub"], check=True)
            r = subprocess.run(["docker", "exec", WEB_CONTAINER, KEPUBIFY, "-o", "/tmp/kepub-ensure",
                                "/tmp/kepub-ensure/in.epub"], capture_output=True, text=True, timeout=300)
            if r.returncode != 0 or "1 converted" not in r.stdout + r.stderr:
                _log(f"book {book_id}: kepubify failed: {(r.stdout + r.stderr)[-200:]}")
                return False
            out = work / "book.kepub"
            subprocess.run(["docker", "cp", f"{WEB_CONTAINER}:/tmp/kepub-ensure/in_converted.kepub.epub",
                            str(out)], check=True)
            if backup:
                shutil.copy(library / "metadata.db", library / f"metadata.db.before-kepub{book_id}-{int(time.time())}")
            r = subprocess.run(["docker", "run", "--rm", "-v", f"{library}:/books", "-v", f"{work}:/staged:ro",
                                "--entrypoint", "/usr/bin/calibredb", CALIBRE_IMAGE,
                                "add_format", str(book_id), "/staged/book.kepub",
                                "--with-library", "/books"], capture_output=True, text=True, timeout=180)
            if r.returncode != 0:
                _log(f"book {book_id}: add_format failed: {r.stderr.strip()[:200]}")
                return False
            # calibredb runs as root: fix ownership of this book's folder and the db only
            subprocess.run(["docker", "run", "--rm", "-v", f"{library}:/books", "busybox", "sh", "-c",
                            f'chown -R {OWNER} "/books/{rel}" /books/metadata.db'],
                           capture_output=True, check=False)
        finally:
            pass  # `work` is a fresh dir under the OS temp dir; the OS cleans it up
        return "KEPUB" in _formats(book_id, library)[0]
    except Exception as e:  # ingest must never fail because of this
        _log(f"book {book_id}: {e}")
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="+", type=int)
    ap.add_argument("--replace", action="store_true")
    a = ap.parse_args()
    ok = True
    for i in a.ids:
        res = ensure_kepub(i, a.replace)
        print(f"{i}: {'KEPUB present' if res else 'FAILED'}")
        ok &= res
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
