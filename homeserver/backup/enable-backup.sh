#!/bin/bash
# Turns on the nightly encrypted backup (3:45 am) to the ServerBackup drive. Run once on the Mac mini:
#   bash homeserver/backup/enable-backup.sh
# See whether it's on and how the last backups went:  --status
# Turn it off again:                                   --off
# What's backed up and how to restore: docs/BACKUPS.md

set -euo pipefail

AGENT="ca.fehrgrownfarms.backup"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/$AGENT.plist"
source "$REPO/scripts/mac/apps.sh"
LOG="$HUB_DIR/logs/backup.log"

case "${1:-}" in
  --off)
    launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
    rm -f "$PLIST"
    echo "The nightly backup is off. Back up by hand with: bash homeserver/backup/backup.sh"
    exit 0 ;;
  --status)
    if launchctl print "gui/$(id -u)/$AGENT" >/dev/null 2>&1; then echo "Nightly backup: on (3:45 am)"; else echo "Nightly backup: off"; fi
    echo
    echo "Recent activity (all in ${LOG/#$HOME/~}):"
    tail -n 12 "$LOG" 2>/dev/null | sed 's/^/  /' || echo "  none yet"
    exit 0 ;;
esac

if ! command -v restic >/dev/null && [[ ! -x /opt/homebrew/bin/restic ]]; then
  echo "restic isn't installed. Install it with: brew install restic"; exit 1
fi
if [[ ! -f "$HOME/ServerData/secrets/restic-password" ]]; then
  echo "The backup isn't set up yet (no password in ~/ServerData/secrets). See docs/BACKUPS.md, step 1."; exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents" "$HUB_DIR/logs"
cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$AGENT</string>
  <key>ProgramArguments</key>
  <array><string>/bin/bash</string><string>$REPO/homeserver/backup/backup.sh</string></array>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>3</integer><key>Minute</key><integer>45</integer></dict>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
PLISTEOF
launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

echo "The nightly backup is on: every night at 3:45 am, while you're logged in on this Mac."
echo "History: ${LOG/#$HOME/~}    Check on it: bash homeserver/backup/enable-backup.sh --status"
