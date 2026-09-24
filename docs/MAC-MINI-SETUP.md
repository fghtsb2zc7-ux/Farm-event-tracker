# Setting up the Farm Log on the Mac mini

About 30 to 60 minutes, once. After that the Farm Log starts by itself whenever the Mac mini turns on.

**What you end up with**
- The Farm Log running on the Mac mini, with the farm's data stored there
- A private, secure web address (`https://<name>.<your-tailnet>.ts.net`) that works from any phone, anywhere
- Weather for Corinth that updates by itself, and a backup every night

**What you need**
- The Mac mini, connected to the internet and plugged in
- An administrator login on the Mac (the password you use to install apps)
- A free Tailscale account (step 4)

---

## 1. Get the Farm Log files onto the Mac mini

1. Open **Terminal** (Applications → Utilities → Terminal).
2. Copy and paste these lines, pressing Return after each:

   ```bash
   cd ~
   git clone https://github.com/fghtsb2zc7-ux/Farm-event-tracker.git
   cd Farm-event-tracker
   git checkout claude/farm-event-tracker-plan-glfwwp
   ```

   - If the Mac asks to install **command line developer tools**, click Install, wait for it to finish, then run the `git clone` line again.
   - If the repository is private, git asks you to sign in to GitHub. If that's awkward in Terminal, install **GitHub Desktop**, sign in, choose *File → Clone repository*, and save it to your home folder (not Documents or Desktop). Then continue in Terminal with `cd ~/Farm-event-tracker`.

   > Keep the folder in your home folder. macOS doesn't let background services read Documents, Desktop, Downloads or iCloud Drive.

## 2. Run the setup script

```bash
bash scripts/mac/setup.sh
```

It will:
1. Download PocketBase, the open-source program that runs the Farm Log, and check the download is genuine.
2. Ask for an **admin email and password**. This is the owner login for the admin dashboard. Use a strong password and keep it somewhere safe.
3. Ask for your **Mac password** to install the background service.
4. Offer to stop the Mac from sleeping and to restart it after a power cut. Say yes.

When it finishes, open <http://127.0.0.1:8090> in Safari on the Mac mini. You should see the Farm Log sign-in page.

## 3. Add the team

1. On the Mac mini, open <http://127.0.0.1:8090/_/> and sign in with the admin email and password from step 2.
2. Click **Collections → users → New record**.
3. For each person, fill in **email**, **name** (shown on their entries), and a **password**, and switch **verified** on. Then click **Create**.

To reset someone's password, open their record, set a new password and save. To remove someone, delete their record. Their past entries stay.

## 4. Put it online with Tailscale Funnel

1. Install Tailscale from <https://tailscale.com/download/mac> and sign in (a Google, Microsoft or Apple login works). The free Personal plan is enough.
2. Optional: give the Mac a tidy name. In the Tailscale admin console (<https://login.tailscale.com/admin/machines>), click the Mac mini → *Edit machine name* → e.g. `fehr-farm`. The address becomes `https://fehr-farm.<your-tailnet>.ts.net`.
3. In Terminal, in the project folder:

   ```bash
   bash scripts/mac/share-online.sh
   ```

   The first time, Tailscale prints a link to approve **HTTPS** and **Funnel** for your account. Open it, approve both, then run the script again.
4. The script prints the Farm Log's address. Open it on your phone to check, then share it with the team along with [TEAM-GUIDE.md](TEAM-GUIDE.md).

Your teammates don't install Tailscale. Only the Mac mini needs it.

## 5. Move the beta data across

When you're ready to switch, ask Claude to export the beta's data. You'll get a `farm-log-….json` file. In the new Farm Log, go to **Import → Backup and move data → Load a Farm Log file** and choose it. Loading the same file twice is safe.

---

## Day-to-day

| Task | How |
|---|---|
| Update to the latest version | In Terminal: `cd ~/Farm-event-tracker && bash scripts/mac/update.sh` |
| Download all data | In the app: **Import → Download all data** |
| Backups | Automatic every night at 3 am, keeping 14 days, in `~/FarmLog/pb_data/backups`. Restore from the admin dashboard under **Settings → Backups**. Turn on Time Machine too, so there's a copy off the Mac mini's own disk. |
| Weather | Automatic: checked every 30 minutes and refreshed when it's more than 6 hours old. |
| Restart the Farm Log | `sudo launchctl kickstart -k system/ca.fehrgrownfarms.farmlog` |
| See what went wrong | The log file: `~/FarmLog/logs/farmlog.log` |
| Stop sharing online | `tailscale funnel --https=443 off` (the app keeps running on the Mac) |

## Where things live

| What | Where |
|---|---|
| The app's code (from GitHub) | `~/Farm-event-tracker` (`server/` holds the app, `scripts/mac/` the setup scripts) |
| The farm's data and backups | `~/FarmLog/pb_data` |
| The PocketBase program | `~/FarmLog/bin/pocketbase` |
| The background service | `/Library/LaunchDaemons/ca.fehrgrownfarms.farmlog.plist` |

## Security notes

- The Farm Log only accepts connections from the Mac itself. The outside world reaches it through Tailscale's encrypted Funnel, so no router ports are opened.
- Everyone signs in, and only signed-in people can see or change farm data.
- The admin dashboard (`/_/`) can also be reached through the Funnel address. Use a strong admin password, and consider turning on two-step sign-in in the dashboard under **Collections → _superusers → ⚙ (options) → Multi-factor authentication**.
