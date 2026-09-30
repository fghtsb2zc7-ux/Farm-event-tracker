# App Hub control panel

The owner's control panel for every app on the Mac mini, and the pieces each app uses to take part. Setup and use: [docs/CONTROL-PANEL-SETUP.md](../docs/CONTROL-PANEL-SETUP.md). The plan behind it: [HUB-PLAN.md](../HUB-PLAN.md).

- `pb_migrations/`: collections `changes` (every change made in the panel, for undo) and `agent_messages` (the Claude chat). Owner (superuser) only.
- `pb_hooks/hub.pb.js`: routes under `/api/hub/`. All need the owner's login except `/api/hub/agent/runner/…`, which the Claude agent calls with the hub key (`~/AppHub/hub.key`).
- `lib/hub_side.js`: the panel's server logic. Reads the app list from `scripts/mac/apps.sh` and the watchdog's state from `~/AppHub/state`.
- `lib/app_side.js`: loaded by each app's `pb_hooks/hub.pb.js`. Serves the app's look (theme CSS, `look.js`, logo, icons, manifest) and its editable lists. To add a new app's lists, add a branch to `listsGet` and `listsPut`.
- `lib/theme.js`: look settings → CSS. Self-contained, because it's also sent to the browser for the live preview.
- `pb_public/`: the panel (plain HTML, CSS and JS). Vendored: PocketBase JS SDK (MIT) and SortableJS 1.15.7 (MIT) in `vendor/`; icons from Lucide (ISC), inlined in `js/hub.js`.
