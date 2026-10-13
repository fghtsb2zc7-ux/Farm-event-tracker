# Access: who can reach what on the Mac mini

| What | Address | Who can open it |
|---|---|---|
| Farm Log | https://kierans-mac-mini.taild086ea.ts.net/ | Anyone with the link, then the Farm Log's own login |
| Shop orders | https://kierans-mac-mini.taild086ea.ts.net/shop/ | Anyone with the link, then the shop's own login |
| Web apps for friends and family | https://apps.taild086ea.ts.net/&lt;app&gt; | Only people you've given a login (password + second step), and only the apps their group allows |
| ntfy, status page, Scan Notes, later photos and passwords | https://&lt;name&gt;.taild086ea.ts.net | Only your own devices with Tailscale on, or people you share that one app with |
| The Mac mini itself (screen sharing, SSH, admin pages) | | Only your own devices |

## Way 1: a login for the web apps (easiest for them)

They need nothing installed: just a web browser and, on their phone, an authenticator app
(Google Authenticator, Microsoft Authenticator, 1Password...) or a passkey (Face ID / Touch ID).

**Invite someone.** On the Mac mini, run:

```bash
bash homeserver/scripts/add-person.sh
```

It asks for their name, email, a username and their groups: `family`, `friends`, or both (`family,friends`).
It shows a temporary password once. Give it to them in person or by phone, together with the address
https://apps.taild086ea.ts.net/&lt;app&gt;.

**What they do the first time.**

1. Open the link, sign in with the username and temporary password.
2. Click "Register device" for the second step. A code is emailed to them (from fehrkieran11@gmail.com, check Spam).
3. Scan the QR code with their authenticator app (or choose a passkey) and type the 6-digit code.
4. Change their password: on the sign-in page, "Reset password" emails them a link.

From then on: password + a 6-digit code (or Face ID) each time, remembered for up to a month on their device.

**Which apps a group can open** is set in `homeserver/stacks/core/config/authelia/configuration.yml`
(one rule per app). See "How to host a new web app" in `homeserver/README.md`.

**See who has a login:** `bash homeserver/scripts/add-person.sh --list`

**Take a login away:** `bash homeserver/scripts/add-person.sh --remove <username>`. They're out within a minute.

**Someone lost their phone (second step):** remove them and add them again; they set up the second step anew.

## Way 2: share one private app through Tailscale

For private apps that aren't behind the front door (for example the photo library later). They see only
that one app, nothing else on your network.

1. They install **Tailscale** on their phone or computer (https://tailscale.com/download) and sign up with
   their own Google, Apple or Microsoft account. Free.
2. In the Tailscale admin console, go to **Machines**, find the app (for example `photos`), click **…** >
   **Share…**, and send the invite link (or enter their email).
3. They open the link and accept. The app appears in their Tailscale, at the same address you use.

To stop sharing: **Machines** > the app > **…** > **Share…** > remove them.
(Sharing works for a whole app address. They still need that app's own login.)

## Lab computers (Scan Notes)

Lab PCs join your Tailscale with a key tagged `tag:lab`. The access rules let `tag:lab` reach only Scan Notes,
nothing else. Make the key in the Tailscale admin console: **Settings > Keys > Generate auth key**,
Tags: `tag:lab`, Reusable on. Install Tailscale on each lab PC and sign in with that key.

## The access rules (Tailscale)

The rules live in the Tailscale admin console, **Access controls**. A copy of the current version, with
notes, is in `homeserver/tailscale-policy.hujson`. Change them there, then paste the whole file into the
console and Save.
