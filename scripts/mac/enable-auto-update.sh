#!/bin/bash
# Turns on automatic nightly updates for the Farm Log (4:10 am). Run once on the Mac mini:
#   bash scripts/mac/enable-auto-update.sh
# Turn them off again with:
#   bash scripts/mac/enable-auto-update.sh --off

set -euo pipefail

LABEL="ca.fehrgrownfarms.farmlog"
AGENT="ca.fehrgrownfarms.farmlog.update"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/$AGENT.plist"
SUDOERS="/etc/sudoers.d/farmlog-restart"
ME="$(id -un)"

if [[ "${1:-}" == "--off" ]]; then
  launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  sudo rm -f "$SUDOERS"
  echo "Automatic updates are off. Update by hand with: bash scripts/mac/update.sh"
  exit 0
fi

echo "Setting up automatic updates (asks for your Mac password once)…"

# Allow this user to restart the Farm Log service (and nothing else) without a password,
# so the nightly update can restart it unattended.
TMP="$(mktemp)"
echo "$ME ALL=(root) NOPASSWD: /bin/launchctl kickstart -k system/$LABEL" > "$TMP"
if ! sudo visudo -cf "$TMP" >/dev/null; then
  echo "Couldn't create the restart permission. Nothing was changed."; rm -f "$TMP"; exit 1
fi
sudo install -m 440 -o root -g wheel "$TMP" "$SUDOERS"
rm -f "$TMP"

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/FarmLog/logs"
cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$AGENT</string>
  <key>ProgramArguments</key>
  <array><string>/bin/bash</string><string>$REPO/scripts/mac/auto-update.sh</string></array>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>4</integer><key>Minute</key><integer>10</integer></dict>
  <key>StandardOutPath</key><string>$HOME/FarmLog/logs/update.log</string>
  <key>StandardErrorPath</key><string>$HOME/FarmLog/logs/update.log</string>
</dict>
</plist>
PLISTEOF
launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

echo "Checking for an update now…"
bash "$REPO/scripts/mac/auto-update.sh" || true
echo
tail -n 5 "$HOME/FarmLog/logs/update.log"
echo
echo "Automatic updates are on: every night at 4:10 am, while you're logged in on this Mac."
echo "History of updates: ~/FarmLog/logs/update.log"
