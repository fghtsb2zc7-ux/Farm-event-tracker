# App Hub: texts to your iPhone when an app has a problem

About 15 minutes, once. After that the Mac mini watches every app by itself and texts you (iMessage) only when something needs your attention.

**What it does**
- Checks each app on the Mac mini (the Farm Log, Rough Cut Dezigns Orders, and any app added later) every minute.
- If an app stops answering for two minutes, restarts it. Most problems end there, and you don't hear about them.
- Texts you if the restart didn't fix it, again every 2 hours while it stays down, and a ✅ text when it's back.
- Every 5 minutes, checks that phones can reach the apps over the internet. If they can't, it re-applies the sharing setting, and texts you if that doesn't help.
- Every 6 hours, checks that the nightly backups ran and that the Mac has storage left.
- Texts you if a nightly update fails. The update puts the previous version back by itself.

---

## 1. Give the Mac mini its own iMessage address (recommended)

If the Mac sends texts from **your** Apple ID, they arrive as messages from yourself, and your iPhone won't notify you. Give the Mac its own address instead:

1. Create a free Apple ID for the Mac at <https://account.apple.com> (for example `fehr.apphub@icloud.com`).
2. On the Mac mini, open **Messages → Settings → iMessage** and sign in with that new Apple ID. This only changes Messages. The Mac's other iCloud settings stay as they are.
3. On your iPhone, save that address as a contact named **App Hub**. Alerts then show as "App Hub".

Later, this same conversation is where you'll text the Claude agent (Phase 3 in [HUB-PLAN.md](../HUB-PLAN.md)).

## 2. Make sure the Mac logs in by itself after a restart

The watchdog and Messages run while you're logged in on the Mac mini. After a power cut, the Mac should log straight back in:

**System Settings → Users & Groups → Automatically log in as** → choose your user.

> If that option is greyed out, FileVault is on. Choosing between the two is a trade-off: FileVault protects the disk if the Mac is stolen, while automatic login keeps the apps and alerts running after a power cut without anyone at the Mac. For a Mac mini that stays at home, most people choose automatic login.

## 3. Get the latest version of the project

If nightly automatic updates are on, you already have it. Otherwise, in **Terminal**:

```bash
cd ~/Farm-event-tracker
git pull
```

## 4. Turn on the watchdog

```bash
bash scripts/mac/enable-watchdog.sh
```

It asks for:
1. **Your iPhone number** (or the Apple ID email your iPhone gets iMessages on).
2. **An optional "ping URL"** (see step 5). Press Return to skip.
3. **Your Mac password**, so the watchdog can restart the apps (and nothing else).

Then it sends a test text. The first time, the Mac asks whether **bash** or **osascript** may control **Messages**. Click **OK**. If the test text doesn't arrive, the script tells you what to check.

## 5. Optional: hear about it if the whole Mac mini goes offline

If the Mac mini itself is off (a power cut, frozen, or its internet is out), it can't text you. A free outside service can notice when the Mac goes quiet:

1. Sign up at <https://healthchecks.io> (free). Create a check with **Period 5 minutes** and **Grace 10 minutes**.
2. Under **Integrations**, add your email (or their iPhone app) so it can reach you.
3. Copy the check's **ping URL** and run `bash scripts/mac/enable-watchdog.sh` again, pasting it when asked.

---

## Day-to-day

| To… | Do this |
|---|---|
| See what's running, and recent events | `bash scripts/mac/watchdog.sh --status` |
| Work on an app without getting texts | `bash scripts/mac/watchdog.sh --pause shop`. Undo it with `--resume shop`. Use `farm` for the Farm Log. |
| Send another test text | `bash scripts/mac/enable-watchdog.sh --test` |
| Change the phone number | Run `bash scripts/mac/enable-watchdog.sh` again |
| Turn the watchdog off | `bash scripts/mac/enable-watchdog.sh --off` |
| Read the full history | `~/AppHub/logs/watchdog.log` |

New apps set up with `scripts/mac/setup.sh` are watched automatically. There's nothing to add.

## Where things live

| What | Where |
|---|---|
| Alert settings (phone number, ping URL) | `~/AppHub/notify.conf` |
| What the watchdog remembers between checks | `~/AppHub/state/` |
| Watchdog history | `~/AppHub/logs/watchdog.log` |
| The background job | `~/Library/LaunchAgents/ca.fehrgrownfarms.apphub.watchdog.plist` |
