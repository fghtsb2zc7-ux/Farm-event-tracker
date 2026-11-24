#!/usr/bin/env python3
"""Queue every `kobo: <url>` line found in a message, optionally fetching it now.

Run: python scripts/kobo-queue.py [--store] [message.txt]
Omit the file to read the complete message from stdin. Anything that can run a command can
feed it: a chat bot, an iOS Shortcut over SSH, a mail filter. This is not a listener.
Queue and article paths come from kobo-digest-build.py (data_dir in config.json).

--store fetches only newly queued URLs, retaining the queue for the builder.
Verdicts compare the builder's date key and inclusive max_age_days cutoff
against the next local 6 AM build. Override
with --build-date YYYY-MM-DD for a manual build. This reports age eligibility,
not pinned exceptions; it never builds an EPUB or touches Calibre.
Published dates are the extractor's metadata, which falls back to the saved
day when no publication date is available.

Exit 3 means no matching kobo: URL line; fetch failures still exit 0 and retain
the extractor's reason. Ordinary input/filesystem errors are not fetch failures.
"""
import argparse
import importlib.util
import json
import re
import sys
from datetime import date, datetime, timedelta
from pathlib import Path


_spec = importlib.util.spec_from_file_location(
    "kobo_digest_build", Path(__file__).with_name("kobo-digest-build.py")
)
digest = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(digest)

KOBO_LINE = re.compile(r"^\s*kobo:\s*(?:<\s*([^<>\s]+)\s*>|([^<>\s]+))\s*$", re.I)


def extract_urls(message: str) -> list[str]:
    urls = []
    for line in message.splitlines():
        match = KOBO_LINE.fullmatch(line)
        if match:
            urls.append(match.group(1) or match.group(2))
    return urls


def next_build_date(now: datetime | None = None) -> date:
    now = now or datetime.now()
    scheduled = now.replace(hour=6, minute=0, second=0, microsecond=0)
    return (scheduled if now < scheduled else scheduled + timedelta(days=1)).date()


def queue_urls(urls: list[str]) -> tuple[list[str], int]:
    seen = set(digest.read_queue())
    new, skipped = [], 0
    for url in urls:
        if url in seen or (digest.ARTICLES / f"{digest.slugify(url)}.json").exists():
            skipped += 1
        else:
            new.append(url)
            seen.add(url)
    if new:
        digest.QUEUE.parent.mkdir(parents=True, exist_ok=True)
        # Preserve comments and existing contents, including a missing final newline.
        with digest.QUEUE.open("a+", encoding="utf-8") as queue:
            queue.seek(0)
            contents = queue.read()
            if contents and not contents.endswith("\n"):
                queue.write("\n")
            queue.write("".join(url + "\n" for url in new))
    return new, skipped


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("message", nargs="?", type=Path, help="message file (default: stdin)")
    parser.add_argument("--store", action="store_true", help="fetch newly queued URLs now")
    parser.add_argument("--build-date", type=date.fromisoformat,
                        help="freshness target YYYY-MM-DD (default: next local 6 AM)")
    args = parser.parse_args(argv)
    message = args.message.read_text(encoding="utf-8") if args.message else sys.stdin.read()
    urls = extract_urls(message)
    if not urls:
        print("No kobo: URL line found.", file=sys.stderr)
        return 3
    new, skipped = queue_urls(urls)
    stored, failed = 0, []
    if args.store:
        build_date = args.build_date or next_build_date()
        cutoff = (build_date - timedelta(days=digest.MAX_AGE_DAYS)).isoformat()
        stored, failed = digest.store_new(new)
        failures = dict(failed)
        for url in new:
            if url in failures:
                print(f"{url} | failed: {failures[url]}")
                continue
            article = json.loads((digest.ARTICLES / f"{digest.slugify(url)}.json").read_text())
            verdict = "fresh" if digest._date_key(article) >= cutoff else "stale"
            title = " ".join(article["title"].split())
            published = " ".join((article.get("published") or "unknown").split())
            print(f"{url} | {title} | published: {published} | {verdict} "
                  f"for build {build_date} (max {digest.MAX_AGE_DAYS} days)")
    print(f"queued: {len(new)}, skipped as duplicate: {skipped}, "
          f"stored: {stored}, failed: {len(failed)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
