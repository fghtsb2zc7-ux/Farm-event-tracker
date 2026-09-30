# App Hub control panel: setup and use

About 10 minutes, once. The control panel is a website for you only. It shows whether every app is running, lets you restart one, and lets you change how the apps look and what's in their dropdown lists, without code and without asking Claude. It also has an **Ask Claude** tab (see [CLAUDE-AGENT-SETUP.md](CLAUDE-AGENT-SETUP.md)).

It runs on the Mac mini like the other apps, at the same address with `/hub/` on the end:
`https://<your-mac>.<your-tailnet>.ts.net/hub/`

---

## 1. Get the latest version

If nightly updates are on, you already have it. Otherwise, in **Terminal** on the Mac mini:

```bash
cd ~/Farm-event-tracker
git pull
```

## 2. Install the control panel

```bash
bash scripts/mac/setup.sh hub
```

It asks for an **admin email and password**: this is your login for the control panel. Use a strong password (the control panel can restart and change your apps), and keep it somewhere safe.

## 3. Restart the other apps once

So they pick up the control panel's settings (colors, lists) straight away:

```bash
bash scripts/mac/update.sh
```

## 4. Put it online

```bash
bash scripts/mac/share-online.sh hub
```

Open the address it prints on your iPhone, sign in, and add it to your home screen (Share → Add to Home Screen).

---

## What's in it

| Tab | What you can do |
|---|---|
| **Apps** | See each app's status and last backup. **Restart** an app (tap twice). **Pause alerts** while you work on something, so the watchdog leaves it alone. Recent activity from the watchdog and nightly updates. |
| **Look** | Pick an app, then change its colors (or tap a ready-made color set), fonts, corner roundness, name, logo and home-screen icon. The preview on the right (on a phone, at the top) is the real app with your changes. Nothing changes for anyone until you tap **Save**. |
| **Lists** | Edit the choices offered in each app: crops, fields, saved chemicals and fertilizers, event type names and colors (Farm Log); products, options and prices, order stage names, shop details (Rough Cut Dezigns). Drag the ⋮⋮ handle to reorder. Tap **Save changes** under a list to publish it; everyone using the app sees it right away. |
| **Ask Claude** | Chat with the Claude agent on the Mac mini. Same conversation as texting it. |
| **History** | Every change made in Look and Lists. **Undo** any of them (tap twice). |

Good to know:
- **Renaming** a crop, field or product changes what's offered from now on. Past entries keep the name they were saved with.
- **Colors** are for light mode. In dark mode, backgrounds stay dark and your colors are lightened so they stay readable. If the text color is hard to read on your background, the Look tab warns you.
- **New icon**: phones that already have the app on their home screen may need to remove it and add it again to show the new icon.
- If you forget the control panel password: `~/AppHub/bin/pocketbase superuser upsert you@example.com 'NewPassword123' --dir ~/AppHub/pb_data`

## Where things live

| What | Where |
|---|---|
| The control panel's code | `hub/` in the project folder |
| Its data (change history, chat) | `~/AppHub/pb_data`, backed up nightly |
| Look settings for each app | `~/AppHub/apps/<app>/` |
| The key the control panel uses to reach the apps | `~/AppHub/hub.key` (keep it private) |
