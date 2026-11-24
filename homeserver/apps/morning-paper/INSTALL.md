# Morning Paper: install on the Mac mini (for the Remote Control session)

Owner approved building it now (thread "Plan Morning Paper for phone", 2026-11-23 10:17 pm Toronto).
Plan: /mnt/project-files/plans/morning-paper-plan.md. Owner's steps: YOUR-STEPS.md in this folder.
Ask before each change on the Mac mini, before commit and before push, as usual.

## What this folder holds
- `upstream/` pinned copy of jstriblet/kobo-morning-paper (MIT, commit in PINNED_COMMIT), unmodified.
  Only its `--dry-build` path is used, so its Calibre and `docker` calls never run.
- `app/paper.py` picks 4 articles (feeds + newsletters in a mailbox + "save" emails), builds EPUB
  and phone page, sends ntfy push + email. `app/scheduler.py` runs build 06:00, deliver 06:30.
- `config/sources.json` (copy to the data folder), `config/secrets.example.env`.
- `Dockerfile`. The stack (compose, nginx.conf, Tailscale serve.json) is in `homeserver/stacks/paper/`.
- `tests/test_paper.py` offline test (passed in the cloud; the image was also built and run
  read-only there).

## Steps
1. (Done) The app lives in `homeserver/apps/morning-paper/`; the stack that runs it is `homeserver/stacks/paper/`.
2. `mkdir -p ~/ServerData/morning-paper/{site,state} ~/ServerData/secrets/morning-paper`
   then `cp config/sources.json ~/ServerData/morning-paper/` and
   `cp config/secrets.example.env ~/ServerData/secrets/morning-paper/paper.env`, `chmod 600` it.
   Fill in NTFY_URL (the server's ntfy address), NTFY_TOKEN if ntfy uses auth, MAIL_TO
   (fehrkieran11@gmail.com) and SAVE_FROM (same address). Open the file in TextEdit
   (`open -e`) for the owner to paste MAIL_USER, MAIL_APP_PASSWORD and, if they have one,
   FEED_404MEDIA. The password never goes in chat or git.
3. Tailscale: `compose.yaml` has a generic sidecar named `paper`. Change it to match the
   existing app sidecar pattern on this server (auth key file, tags, serve config) so the page
   is `https://paper.taild086ea.ts.net`, tailnet only, no Funnel, no host port.
4. Colima file ownership: the builder runs as uid 1000. If it can't write
   `~/ServerData/morning-paper`, set `user:` in compose to match how the other apps run.
5. `docker compose up -d --build`, then a test issue right away:
   `docker compose exec builder python /app/paper.py run`. Send the owner the page link.
6. Backups: confirm `~/ServerData/morning-paper` is inside the nightly restic set
   (exclude `site/*.epub` only if space is tight; it is a few MB).
7. Watchdog: after 07:00 alert if `~/ServerData/morning-paper/site/$(date +%F)/edition.json`
   is missing. Uptime Kuma: HTTP monitor on the paper page.
8. Commit and push (ask first). Update project memory file morning-paper.md.

## Notes
- Reuters has no RSS since 2020; the feed uses Google News headlines for reuters.com, and
  Reuters often blocks article fetches, so those items are skipped when unreadable.
- Apple News recommendations can't be read by any tool (no API or feed). Owner was told.
- Change sources/time without rebuilding: edit `sources.json` / `BUILD_AT`, `DELIVER_AT`
  in compose, then `docker compose up -d`.
- After the Ubuntu/Cosmos rebuild, the same compose file can be imported into Cosmos.
