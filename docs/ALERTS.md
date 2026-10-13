# Alerts: how the Mac mini tells you something's wrong

Everything that watches the Mac mini sends its alerts the same way, through `scripts/mac/notify.sh`:

| Channel | What you get | Needs |
|---|---|---|
| **Phone notification (ntfy)** | An instant notification on your iPhone | The free ntfy app, and Tailscale on on the phone |
| **Email** | An email to your Gmail | A Google app password saved on the Mac (below) |
| **iMessage** | A text from the Mac mini | Messages signed in on the Mac mini |

Who sends alerts:

- **The watchdog** (every minute): the Farm Log, the shop, and every Docker service in `homeserver/services.sh`. After two failed checks it restarts the app by itself, then alerts you if it's still down, and again when it's back. It also alerts you if Docker stops, if the Mac's storage gets over 85% full, or if the ServerBackup drive is unplugged.
- **The nightly backup** (3:45 am): if it fails, or the backup drive is getting full.
- **Updates** (`homeserver/scripts/update.sh`): if an update broke a service and was rolled back.
- **The Claude helper** (if it's turned on): when the watchdog can't fix something, Claude looks into it without changing anything, sends you what it found and what it would do, and waits for your yes.
- **The status page** (Uptime Kuma, https://status.taild086ea.ts.net): a dashboard of what's up and what was down. It can send its own alerts too.

## Turning channels on and off

Edit `~/AppHub/notify.conf` on the Mac mini (open it with TextEdit):

```
NOTIFY_NTFY="yes"
NOTIFY_EMAIL="yes"
NOTIFY_IMESSAGE="yes"
EMAIL_FROM="you@gmail.com"
EMAIL_TO="you@gmail.com"
```

Change `yes` to `no` to switch one off. Send a test to every channel that's on:

```bash
bash scripts/mac/notify.sh "Test from the Mac mini"
```

## Phone notifications (ntfy)

ntfy runs on the Mac mini at https://ntfy.taild086ea.ts.net, private to your devices. Your alerts go to a
"topic" with a random secret name, saved in `~/ServerData/secrets/ntfy-topic`. Show it on the Mac with
`cat ~/ServerData/secrets/ntfy-topic; echo`.

On the iPhone:

1. Install **ntfy** from the App Store (free).
2. Open it, tap the gear (Settings) > **Default server** > enter `https://ntfy.taild086ea.ts.net`.
3. Back on the main screen, tap **+**, type the topic name exactly, and tap **Subscribe**.
4. Allow notifications when it asks.

Tailscale must be on on the phone to see the message (turn on "VPN On Demand" in the Tailscale app so it's always on).

## Email (Gmail)

1. The Google account needs 2-Step Verification on: https://myaccount.google.com/security
2. Create an app password: https://myaccount.google.com/apppasswords, name it "Mac mini", click Create, and copy the 16-letter password.
3. On the Mac mini, run this, paste the password (nothing shows while you paste), and press Return:
   ```bash
   (umask 077; read -rs PW && printf '%s' "${PW// /}" > ~/ServerData/secrets/msmtp-password) && echo saved
   ```
4. Put your address in `EMAIL_FROM` (and `EMAIL_TO`, if alerts should go to a different address) in `~/AppHub/notify.conf`.

To stop email alerts from working entirely, delete the app password at https://myaccount.google.com/apppasswords.

## The status page (Uptime Kuma)

https://status.taild086ea.ts.net. The first time you open it, create its admin login (save it in your password manager).
Then add, with **+ Add New Monitor** (type HTTP(s), interval 60 seconds):

| Name | URL |
|---|---|
| Farm Log | `https://kierans-mac-mini.taild086ea.ts.net/api/health` |
| Shop | `https://kierans-mac-mini.taild086ea.ts.net/shop/api/health` |
| ntfy | `https://ntfy.taild086ea.ts.net/v1/health` |
| Scan Notes | `https://scannotes.taild086ea.ts.net/api/health` |

For its alerts: **Settings > Notifications > Setup Notification**, type **ntfy**, server URL `https://ntfy.taild086ea.ts.net`,
topic = your topic name, "Default enabled" and "Apply on all existing monitors" on.

## The whole Mac going offline (optional)

The watchdog can't tell you the Mac is off, because it runs on the Mac. For that, make a free check at
https://healthchecks.io (period 5 minutes, grace 10 minutes, with your email), copy its ping URL, and run
`bash scripts/mac/enable-watchdog.sh` again: paste it at "Ping URL". healthchecks.io then emails you when the Mac stops checking in.
