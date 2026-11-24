#!/usr/bin/env python3
"""Runs the paper on a daily schedule inside the container (no cron needed).

BUILD_AT and DELIVER_AT are local times (HH:MM) in TZ. A missed run (for example the
Mac was off at 6:00) is caught up once if the container starts later the same morning,
before NOON.
"""
import json
import os
import subprocess
import sys
import time
from datetime import date, datetime, timedelta
from pathlib import Path

BUILD_AT = os.environ.get("BUILD_AT", "06:00")
DELIVER_AT = os.environ.get("DELIVER_AT", "06:30")
DATA = Path(os.environ.get("PAPER_DATA", "/data"))
PAPER = [sys.executable, str(Path(__file__).with_name("paper.py"))]


def at(hhmm: str, day: date) -> datetime:
    h, m = map(int, hhmm.split(":"))
    return datetime.combine(day, datetime.min.time()).replace(hour=h, minute=m)


def built(day: date) -> bool:
    return (DATA / "site" / day.isoformat() / "edition.json").exists()


def delivered(day: date) -> bool:
    p = DATA / "site" / day.isoformat() / "edition.json"
    return p.exists() and bool(json.loads(p.read_text()).get("delivered"))


def run(cmd: str) -> None:
    print(f"{datetime.now():%Y-%m-%d %H:%M:%S} scheduler: running {cmd}", flush=True)
    subprocess.run(PAPER + [cmd])


def main() -> None:
    print(f"scheduler: build {BUILD_AT}, deliver {DELIVER_AT} ({os.environ.get('TZ', 'UTC')})", flush=True)
    tried_build = tried_deliver = None
    while True:
        now, today = datetime.now(), date.today()
        noon = at("12:00", today)
        if at(BUILD_AT, today) <= now < noon and not built(today) and tried_build != today:
            tried_build = today
            run("build")
        if at(DELIVER_AT, today) <= now < noon and built(today) and not delivered(today) \
                and tried_deliver != today:
            tried_deliver = today
            run("deliver")
        time.sleep(30)


if __name__ == "__main__":
    main()
