#!/bin/bash
# Turns on the hourly backup of the password manager (every hour at :15) to the ServerBackup drive.
# Run once on the Mac mini:
#   bash homeserver/backup/enable-vault-backup.sh
# See whether it's on and how the last backups went:  --status
# Turn it off again:                                   --off
# What's backed up and how to restore: docs/VAULT.md

set -euo pipefail

AGENT="ca.fehrgrownfarms.vault-backup"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/$AGENT.plist"
source "$REPO/scripts/mac/apps.sh"
LOG="$HUB_DIR/logs/vault-backup.log"

case "${1:-}" in
  --off)
    launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
    rm -f "$PLIST"
    echo "The hourly password manager backup is off. The nightly backup still includes it."
    exit 0 ;;
  --status)
    if launchctl print "gui/$(id -u)/$AGENT" >/dev/null 2>&1; then echo "Hourly password manager backup: on (every hour at :15)"; else echo "Hourly password manager backup: off"; fi
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
  <array><string>/bin/bash</string><string>$REPO/homeserver/backup/vault-backup.sh</string></array>
  <key>StartCalendarInterval</key>
  <dict><key>Minute</key><integer>15</integer></dict>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
PLISTEOF
launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

echo "The password manager is backed up every hour at :15, while you're logged in on this Mac."
echo "History: ${LOG/#$HOME/~}    Check on it: bash homeserver/backup/enable-vault-backup.sh --status"
