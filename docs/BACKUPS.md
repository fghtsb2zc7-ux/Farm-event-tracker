# Backups: an encrypted copy of every app's data, every night

About 10 minutes, once. After that the Mac mini backs itself up every night to the **ServerBackup** drive, and texts you only if something goes wrong.

**What it does**
- Every night at 3:45 am, copies the Farm Log, Rough Cut Dezigns Orders, the App Hub (once it's set up) and `~/ServerData` (data for services added later) to the ServerBackup drive.
- Only changes are copied, so each night takes seconds and very little space.
- Everything on the drive is encrypted. Without the password, nobody can read it, including you, so keep a copy of the password off the Mac (step 2).
- Keeps a copy from each of the last 14 days, 8 weeks and 12 months, and clears out older ones.
- Every Sunday, reads back a sample of the backup to make sure it's healthy.
- Texts you if a backup fails, if the drive isn't plugged in, or if the drive is over 80% full (texts work once the watchdog's alerts are set up, see [APP-HUB-SETUP.md](APP-HUB-SETUP.md)).

The backup uses [restic](https://restic.net), a free, open-source backup program.

**How it fits with the other backups**

| Backup | What | Where | When |
|---|---|---|---|
| PocketBase's own | Each app's database, as a zip | Inside each app's folder, e.g. `~/FarmLog/pb_data/backups` (on the Mac's own disk) | 3:00 am farm, 3:15 am shop, kept 14 days |
| This one (restic) | Each app's whole data folder, including those zips | ServerBackup drive, encrypted | 3:45 am, kept up to a year |
| Time Machine | The whole Mac (except big folders that don't need it) | TimeMachine space on the same drive | Every hour |

3:45 am is after the apps' own zips are made, so the backup always holds a fresh, consistent copy, and it finishes before the nightly update restarts the apps at 4:10.

---

## 1. Set it up

If Claude set this up for you, skip to step 2.

You need the backup drive plugged in, with a volume named **ServerBackup**. In **Terminal**:

```bash
brew install restic
mkdir -p ~/ServerData/secrets ~/ServerData/dumps && chmod 700 ~/ServerData/secrets
(umask 077; openssl rand -base64 33 | tr -d '\n' > ~/ServerData/secrets/restic-password)
restic init --repo /Volumes/ServerBackup/restic --password-file ~/ServerData/secrets/restic-password
cd ~/Farm-event-tracker
bash homeserver/backup/backup.sh
bash homeserver/backup/enable-backup.sh
```

## 2. Save the password somewhere safe (important)

The password is in `~/ServerData/secrets/restic-password` on the Mac mini. If the Mac dies, that file goes with it, and the backup can't be opened. Show it with:

```bash
cat ~/ServerData/secrets/restic-password; echo
```

Copy it into a password manager, or write it down and keep it somewhere safe. Never put it in GitHub or a text message.

## 3. Check it's working

```bash
bash homeserver/backup/enable-backup.sh --status
```

It shows whether the nightly backup is on and the last few backups. Each night should end with a line like `Done. ServerBackup drive is 3% full.`

---

## Getting something back

All of these use the backup on the ServerBackup drive. First tell restic where it is (paste this into Terminal once per window):

```bash
export RESTIC_REPOSITORY=/Volumes/ServerBackup/restic RESTIC_PASSWORD_FILE=~/ServerData/secrets/restic-password
```

1. **See the backups** (one line per night):
   `restic snapshots`
2. **Get files back into a separate folder, without touching the live app:**
   `restic restore latest --target ~/Desktop/restored --include ~/ShopLog/pb_data`
   Use a snapshot's ID instead of `latest` for an older night. The files land in `~/Desktop/restored/Users/…`.
3. **Put an app's data back** (only if the live data is lost or broken):
   1. Stop the app: `sudo launchctl bootout system /Library/LaunchDaemons/ca.roughcutdezigns.orders.plist` (the Farm Log is `ca.fehrgrownfarms.farmlog`).
   2. Rename the broken folder instead of deleting it: `mv ~/ShopLog/pb_data ~/ShopLog/pb_data-broken`
   3. Restore it in place: `restic restore latest --target / --include ~/ShopLog/pb_data`
   4. Start the app again: `bash scripts/mac/setup.sh shop` (it keeps the restored data).

   Or, to go back to one of PocketBase's own nightly zips instead, use the app's admin dashboard: **Settings → Backups**.

If the Mac mini itself is lost: set up a new Mac with [MAC-MINI-SETUP.md](MAC-MINI-SETUP.md), install restic, plug in the drive, save the password into `~/ServerData/secrets/restic-password`, and use step 3 above.

## When the drive gets full

You'll get a text at 80%. The backup and Time Machine share the 500 GB drive: Time Machine is capped at 250 GB, so the backup always has the rest. When it fills:

1. Buy a bigger external drive: **at least 4 TB**, so there's room for photos and other services later.
2. Ask Claude to move the backup to it (or format it as APFS with a **ServerBackup** volume, copy `/Volumes/ServerBackup/restic` across with Finder, and unplug the old drive).

## Day-to-day

| To… | Do this |
|---|---|
| See whether backups are running | `bash homeserver/backup/enable-backup.sh --status` |
| Back up right now | `bash homeserver/backup/backup.sh` |
| Read the full history | `~/AppHub/logs/backup.log` |
| Get a file back | See **Getting something back** above |
| Turn the nightly backup off | `bash homeserver/backup/enable-backup.sh --off` (turn it on again by running it without `--off`) |
| Unplug the drive | Eject **ServerBackup** and **TimeMachine** in Finder first. A night without the drive is skipped, and you get a text. |
