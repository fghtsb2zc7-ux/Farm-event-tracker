# The password manager (Vaultwarden)

Your passwords live on the Mac mini, in Vaultwarden (free, open source), and you use them with the
official **Bitwarden** apps. Address: **https://vault.taild086ea.ts.net**, reachable only from your own
devices with Tailscale on. It's never on the public internet.

## Rules

- Nobody can sign up. People join only when you invite them.
- Everyone turns on **two-step login** right after creating their account.
- The admin page (https://vault.taild086ea.ts.net/admin) needs the admin password. Only a scrambled (hashed)
  copy is on the Mac, in `~/ServerData/secrets/vault/admin-token-hash`. Keep the real one in your password
  manager.
- It's never updated automatically. Read the release notes (https://github.com/dani-garcia/vaultwarden/releases)
  before changing the version in `homeserver/stacks/vault/compose.yaml`.

## Setting yourself up

1. **Invite yourself:** open https://vault.taild086ea.ts.net/admin, enter the admin password, go to
   **Users**, type your email under "Invite User", and click Invite. The invite arrives in your Gmail.
2. **Create the account:** open the link in the email and create your account. The **master password**
   is the one password you can't forget: nobody (not even the Mac) can recover it. Write it down and keep it
   somewhere safe at home.
3. **Two-step login:** on https://vault.taild086ea.ts.net, sign in > your picture (top right) > **Account
   settings > Security > Two-step login** > **Authenticator app** > scan the QR code with your
   authenticator app > enter the code > Turn on. Save the **recovery code** it shows with your master password.
4. **iPhone:** install **Bitwarden** from the App Store. On the sign-in screen, tap the region selector
   ("Logging in on: bitwarden.com") > **Self-hosted** > Server URL `https://vault.taild086ea.ts.net` > Save,
   then sign in. Turn on AutoFill: Settings > General > AutoFill > AutoFill Passwords > Bitwarden.
5. **Laptop:** install the Bitwarden app (https://bitwarden.com/download) and the browser extension. On
   each, choose **Self-hosted** with the same server URL, then sign in.
6. **Moving from another password manager:** export from the old one, then on
   https://vault.taild086ea.ts.net: **Tools > Import data**. Delete the export file afterwards.

**Family:** invite them from the admin page (step 1 with their email), share Tailscale's `vault` machine
with them (docs/ACCESS.md, Way 2), and make sure they turn on two-step login.

## Backups

- **Every hour** (at :15): a checked copy of the database, plus attachments, keys and settings, goes to the
  ServerBackup drive (`homeserver/backup/vault-backup.sh`, history in `~/AppHub/logs/vault-backup.log`).
  48 hourly, 30 daily and 12 monthly copies are kept.
- **Every night** at 3:45 it's in the main backup too.
- You get an alert (phone and email) if a backup fails.

## Emergency plan

**The Mac mini is off or broken.** The Bitwarden apps on your phone and laptop keep a copy of your vault:
you can still open them and read your passwords (you just can't save changes until the server is back).

**Bringing the vault back from a backup**, on the Mac mini or any computer with Docker and restic:

```bash
export RESTIC_REPOSITORY=/Volumes/ServerBackup/restic RESTIC_PASSWORD_FILE=~/ServerData/secrets/restic-password
restic snapshots --tag vault                               # pick one (the newest is usually right)
restic restore latest --tag vault --target ~/vault-restore
# The restored files are in ~/vault-restore/Users/<you>/ServerData/vault:
#   backups/db.sqlite3 is the database. Put it in place of data/db.sqlite3 (with Vaultwarden stopped),
#   together with data/rsa_key.pem and data/attachments, then start Vaultwarden again.
```

Ask Claude to do this for you; it can test it on a spare copy first.

**A copy that doesn't depend on the Mac at all.** A few times a year (and before big changes), on
https://vault.taild086ea.ts.net: **Tools > Export vault** > format **.json (Encrypted)** > "Password
protected" > set a strong file password > Export. Put the file on a USB stick kept somewhere safe (not on the
Mac). Write the file password down with your master password.
