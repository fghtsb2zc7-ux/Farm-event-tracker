#!/bin/bash
# Starts Docker (Colima) and every stack in homeserver/stacks/ each time you log in on the Mac mini
# (the Mac logs in by itself after a restart). Run once:
#   bash homeserver/scripts/enable-docker.sh
# See whether it's on and what's running:  --status
# Turn it off again:                       --off   (Docker and the stacks keep running until a restart)

set -euo pipefail

AGENT="ca.fehrgrownfarms.colima"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/$AGENT.plist"
source "$REPO/scripts/mac/apps.sh"
LOG="$HUB_DIR/logs/docker.log"

case "${1:-}" in
  --off)
    launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
    rm -f "$PLIST"
    echo "Docker won't start by itself any more. Start it by hand with: colima start"
    exit 0 ;;
  --status)
    if launchctl print "gui/$(id -u)/$AGENT" >/dev/null 2>&1; then echo "Start at login: on"; else echo "Start at login: off"; fi
    bash "$REPO/homeserver/scripts/stack.sh" status || true
    echo
    echo "Recent activity (all in ${LOG/#$HOME/~}):"
    tail -n 8 "$LOG" 2>/dev/null | sed 's/^/  /' || echo "  none yet"
    exit 0 ;;
esac

if [[ ! -x /opt/homebrew/bin/colima || ! -x /opt/homebrew/bin/docker ]]; then
  echo "Docker isn't installed. Install it with: brew install colima docker docker-compose"; exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents" "$HUB_DIR/logs"
# AbandonProcessGroup: the Docker machine keeps running after the start-up script finishes.
cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$AGENT</string>
  <key>ProgramArguments</key>
  <array><string>/bin/bash</string><string>$REPO/homeserver/scripts/stack.sh</string><string>boot</string></array>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string></dict>
  <key>RunAtLoad</key><true/>
  <key>AbandonProcessGroup</key><true/>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
PLISTEOF
launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

echo "Docker is on: it starts by itself (with every stack) each time this Mac logs in."
echo "History: ${LOG/#$HOME/~}    Check on it: bash homeserver/scripts/enable-docker.sh --status"
