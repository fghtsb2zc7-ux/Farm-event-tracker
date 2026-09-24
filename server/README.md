# Farm Log server (runs on the Mac mini)

The self-hosted Farm Log: [PocketBase](https://pocketbase.io) v0.40.4 (open source, MIT) serving an installable web app.

Setup and day-to-day instructions: [docs/MAC-MINI-SETUP.md](../docs/MAC-MINI-SETUP.md). Guide for the team: [docs/TEAM-GUIDE.md](../docs/TEAM-GUIDE.md).

| Folder | What's in it |
|---|---|
| `pb_public/` | The app: `index.html`, `css/app.css` (brand tokens at the top), `js/app.js` (screens and logic), `js/adapter.js` (sign-in, live sync and offline queue on top of PocketBase), `sw.js` (offline support), `manifest.webmanifest` and `icons/` (home-screen install), `vendor/` (PocketBase SDK and SheetJS, so nothing loads from outside except fonts) |
| `pb_migrations/` | Database setup: `events`, `orders`, `notes`, `lists`, `weather`. Each record keeps its content in one JSON `data` field, the same shape the beta used. Team members read and write farm data; only the server writes weather. |
| `pb_hooks/` | Weather for Corinth from Open-Meteo. Checked every 30 minutes and refreshed when older than 6 hours. Superusers can force a refresh with `POST /api/farm/weather/refresh`. |

## Run it locally (any computer)

```bash
./pocketbase serve --dir=./pb_data --hooksDir=server/pb_hooks --migrationsDir=server/pb_migrations --publicDir=server/pb_public
./pocketbase superuser upsert you@example.com 'a-long-password' --dir=./pb_data
```

Then open <http://127.0.0.1:8090/_/> to add a user under **users**, and sign in at <http://127.0.0.1:8090>.

## Releasing a change

Edit files under `server/`, and bump `VERSION` in `pb_public/sw.js` so installed phones refresh their offline copy. On the Mac mini, run `bash scripts/mac/update.sh`.
