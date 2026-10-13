# Photos (Immich) and movies (Jellyfin)

Both are private: they only open on devices with Tailscale on. Both are free and open source.

| What | Address | Runs |
|---|---|---|
| Photo library (Immich) | https://photos.taild086ea.ts.net | In Docker (`homeserver/stacks/photos`) |
| Movies, shows, music (Jellyfin) | https://media.taild086ea.ts.net | As a Mac program (`homeserver/scripts/enable-jellyfin.sh`), using the Mac's video chip |

## Photos

**First time:** open https://photos.taild086ea.ts.net and create the admin account (you). Save the
password in your password manager. Then in **Administration > Settings > User Settings**, check that public
sign-up is off (Immich has no public sign-up by default), and add family accounts under **Administration > Users**.

**iPhone backup:**

1. Install **Immich** from the App Store.
2. Server URL: `https://photos.taild086ea.ts.net`, then sign in.
3. Tap the cloud icon (top right) > choose **Recents** (or the albums you want) > **Enable Backup**.
4. In the app's settings (your picture > Settings > Backup), turn on **Background backup**, and allow
   Background App Refresh when iOS asks.
5. Keep Tailscale on (VPN On Demand), so backup also works away from home.

**Importing an existing library** (for example a Google Takeout or an external drive): ask Claude to do it in
batches, so the Mac's memory and disk are watched as it goes.

**Backups:** photos and videos are in `~/ServerData/photos/library` (backed up every night). Immich keeps its
own nightly database copies in `library/backups`, and the nightly backup also makes a fresh database copy
first (`~/ServerData/dumps/immich.sql.gz`). Thumbnails and converted videos aren't backed up: Immich makes them
again from the originals.

**Updates:** never automatic. Read the release notes (https://github.com/immich-app/immich/releases), change
the version in `homeserver/stacks/photos/compose.yaml`, then `bash homeserver/scripts/stack.sh up photos`.

## Movies, shows and music

**First time:** open https://media.taild086ea.ts.net. (There was an older Jellyfin trial on this Mac from
2025 with the user "kieranfehr". Its settings carried over; a copy of the old app and settings is in
`~/Documents/removed-jobs-2026-10-12/`. If you don't remember that password, click "Forgot password" and
follow the steps; the PIN file it mentions appears on the Mac mini.)

1. **Libraries:** Dashboard > Libraries > Add: Movies > `~/ServerData/media/movies`, Shows >
   `~/ServerData/media/shows`, Music > `~/ServerData/media/music`. Remove the old "Home Videos and Photos"
   library (it points to a drive that isn't there).
2. **Video chip:** Dashboard > Playback > Transcoding > Hardware acceleration: **Apple VideoToolbox**, tick
   H264 and HEVC, Save.
3. **People:** Dashboard > Users > + for each person (their own password).
4. Put files in the folders above (Finder works). Jellyfin finds them within a few minutes.

**Apps:** Jellyfin or Swiftfin on iPhone/iPad/Apple TV; server address `https://media.taild086ea.ts.net`.

**Family away from home:** they need Tailscale. Share the `media` machine with them (docs/ACCESS.md, Way 2)
and give them their own Jellyfin user.

**Backups:** Jellyfin's settings, users and watch history are backed up nightly. The movies, shows and music
themselves are **not** (they're too big for the backup drive, and you can get them again).
