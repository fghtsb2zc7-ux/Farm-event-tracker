# App Hub: Plan

One home on the Mac mini for every family and business app: the Farm Log, Rough Cut Dezigns Orders, the outfit app, and whatever comes next. It keeps them running, tells you when something's wrong, lets you change how they look and work without code, and gives you a Claude agent you can text.

Status: **Phases 1 to 3 built** (watchdog and alerts, control panel, Claude agent). Setup guides: [watchdog](docs/APP-HUB-SETUP.md), [control panel](docs/CONTROL-PANEL-SETUP.md), [Claude agent](docs/CLAUDE-AGENT-SETUP.md). Phases 4 to 6 below are the plan.

## Decisions (2026-09-30)

| Question | Answer | What it changes |
|---|---|---|
| Alerts and texting the agent | iMessage | The Mac mini sends and receives iMessages through its Messages app, from its own Apple ID ([setup](docs/APP-HUB-SETUP.md)). |
| Claude account for the agent | The owner's Claude Pro subscription | The agent signs in with a long-lived token from `claude setup-token`, so it uses the plan's own allowance (no API bill). A daily cap (25 runs) keeps a busy day from using it all up. |
| What you want to change yourself | Look and branding, lists and dropdowns, form fields, drag-and-drop layout | Phase 2 (look, lists), Phase 4 (form fields), Phase 5 (layout). |
| How much the agent does alone | Fix outages alone; ask before changes you request | The agent may restart, roll back and repair without asking, and texts you what it did. New features and design changes wait for your "yes". |

## How the apps are kept apart

Each app is its own program, with its own data folder, port and background service (`/Library/LaunchDaemons`). macOS restarts any app that crashes. One app failing, updating or being worked on doesn't touch the others. They share one web address through Tailscale Funnel (`/` the farm, `/shop/` the shop, `/outfits/` next).

This stays as native macOS services rather than Docker. Docker on a Mac runs a hidden Linux virtual machine that takes several GB of memory, and it would be one more thing that can fail. PocketBase apps are single small programs that don't need it.

## Phases

| Phase | Scope | Result |
|---|---|---|
| **1. Watchdog and alerts** ✅ | Checks every app each minute; restarts stopped apps; iMessage alerts for outages, lost internet sharing, missed backups, low storage and failed nightly updates; optional outside check for the whole Mac going offline | You hear about problems before your family and customers do, and usually they're already fixed |
| **2. Control panel** ✅ | A third small app, **App Hub**, at `/hub/`, for you only. **Dashboard**: every app's status, restart and pause buttons, recent events. **Look and branding**: colors (color pickers), logo and icon upload, fonts (dropdown), app name, with a live preview. **Lists and dropdowns**: edit, reorder (drag) and hide choices like farm event types, crops, shop products, sizes and order statuses. Every change can be undone. | Everyday tweaks without Claude or code |
| **3. Claude agent** ✅ | Claude Code on the Mac mini, working inside the project. **Texting**: the Mac reads new iMessages from your number only (they need macOS Full Disk Access) and replies in the same conversation. **Chat box** in the control panel. **Outages**: when a restart doesn't fix an app, the watchdog hands it to the agent, which reads the logs, repairs or rolls back, and texts you what it did. **Changes you ask for**: it texts back a plan (and a preview link for design changes), waits for your "yes", then publishes. Every change is saved as a version you can undo. | Ask questions and request changes by text, from anywhere |
| **4. Form fields** | In the control panel: add, rename, reorder, hide or require the fields on each form (for example add "Pickup date" to shop orders). The apps build their forms from these settings instead of fixed code. | Change what you record without a developer |
| **5. Drag-and-drop layout** | Arrange the sections of each app's home screen and pages (for example the farm dashboard units): drag to reorder, show or hide, choose small or large. | Pages laid out the way you want |
| **6. Outfit app, and a template for new apps** | `add-app` script: a new app from the hub template in one step (folder, port, web address, background service, backups, watchdog, control panel settings). The outfit curation app is the first app built this way. | New apps start organized and look after themselves from day one |

Each phase is its own update, so you can try it before the next one starts.

## Safety rules for the agent (Phase 3)

- Obeys texts only from your phone number.
- Never deletes app data. Before any change, it confirms a fresh backup exists.
- Works on a copy, checks the app still starts, then publishes. If an app doesn't come back, it undoes the change by itself.
- A daily limit on how much it can run, so a stuck conversation can't use up your Claude plan.

## How phases 2 and 3 are built

- **Control panel** (`hub/`): a third PocketBase app on port 8092, shared at `/hub/`, owner login only. It reads app status from the watchdog's files, restarts apps with the same limited permission the nightly update uses, and records every change in its own database so each can be undone.
- **Each app's side** (`hub/lib/app_side.js`, loaded by each app's `pb_hooks/hub.pb.js`): serves `/api/hub/theme.css`, `look.js`, logo, icons and a home-screen manifest built from `~/AppHub/apps/<app>/`, so a saved look reaches phones on their next visit. Lists kept in an app's database are changed through that app (key-protected), so everyone sees them live. `hub/lib/theme.js` turns look settings into CSS; the same code draws the control panel's live preview inside the real app.
- **Claude agent** (`scripts/mac/agent.py`): runs Claude Code headless in the project folder. Answering mode can only read; a change runs only after the owner's yes (or to fix an outage the watchdog hands over). After any change it checks every app still answers and undoes the change if not. Texts come in through a `sqlite3` job with Full Disk Access reading Messages; replies go out through `notify.sh`.
- **A new app** gets all of this by adding its block to `scripts/mac/apps.sh`, a `pb_hooks/hub.pb.js` like the others, and its lists in `hub/lib/app_side.js`.

## Later (optional)

- Rename this GitHub repository from `Farm-event-tracker` to something like `home-apps`. GitHub redirects the old name, so the Mac mini keeps updating.
