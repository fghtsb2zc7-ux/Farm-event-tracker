#!/bin/bash
# Runs Jellyfin (movies, shows and music) in the background each time you log in on the Mac mini.
# Jellyfin runs as a normal Mac program (not in Docker) so it can use the Mac's video chip (VideoToolbox).
# It only listens on this Mac (127.0.0.1); your devices reach it at https://media.taild086ea.ts.net
# through the "media" Tailscale sidecar in the core stack. Run once:
#   bash homeserver/scripts/enable-jellyfin.sh
# See whether it's on:  --status        Turn it off:  --off
# Install or update the app itself with: brew install --cask jellyfin  (or: brew upgrade --cask jellyfin)

set -euo pipefail

AGENT="ca.fehrgrownfarms.jellyfin"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/$AGENT.plist"
source "$REPO/scripts/mac/apps.sh"
APP="/Applications/Jellyfin.app/Contents/MacOS"
DATA="$HOME/Library/Application Support/jellyfin"
LOG="$HUB_DIR/logs/jellyfin.log"

case "${1:-}" in
  --off)
    launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
    rm -f "$PLIST"
    echo "Jellyfin is off. Your media and settings are untouched."
    exit 0 ;;
  --status)
    if launchctl print "gui/$(id -u)/$AGENT" >/dev/null 2>&1; then echo "Start at login: on"; else echo "Start at login: off"; fi
    if curl -fs --max-time 5 -o /dev/null http://127.0.0.1:8096/health; then echo "Jellyfin: running"; else echo "Jellyfin: NOT ANSWERING"; fi
    exit 0 ;;
esac

[[ -x "$APP/jellyfin" ]] || { echo "Jellyfin isn't installed. Install it with: brew install --cask jellyfin"; exit 1; }
mkdir -p "$HOME/Library/LaunchAgents" "$HUB_DIR/logs" "$DATA" "$HOME/ServerData/media/movies" "$HOME/ServerData/media/shows" "$HOME/ServerData/media/music"

cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$AGENT</string>
  <key>ProgramArguments</key>
  <array>
    <string>$APP/jellyfin</string>
    <string>--service</string>
    <string>--datadir</string><string>$DATA</string>
    <string>--cachedir</string><string>$HOME/Library/Caches/jellyfin</string>
    <string>--logdir</string><string>$DATA/log</string>
    <string>--webdir</string><string>/Applications/Jellyfin.app/Contents/Resources/jellyfin-web</string>
    <string>--ffmpeg</string><string>$APP/ffmpeg</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>30</integer>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
PLISTEOF
launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

echo "Jellyfin is on: it starts by itself each time this Mac logs in."
echo "Open it at https://media.taild086ea.ts.net (Tailscale on). Check on it: bash homeserver/scripts/enable-jellyfin.sh --status"
