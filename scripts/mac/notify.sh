#!/bin/bash
# Sends a text to your iPhone with iMessage, through the Messages app on this Mac.
# The phone number (or Apple ID email) is set by enable-watchdog.sh and kept in ~/AppHub/notify.conf.
#   bash scripts/mac/notify.sh "The Farm Log is down"

set -uo pipefail
source "$(cd "$(dirname "$0")" && pwd)/apps.sh"

MSG="$*"
[[ -n "$MSG" ]] || { echo "Usage: bash scripts/mac/notify.sh \"message\""; exit 1; }

# For testing: send somewhere else instead of Messages.
if [[ -n "${HUB_NOTIFY_CMD:-}" ]]; then $HUB_NOTIFY_CMD "$MSG"; exit $?; fi

CONF="$HUB_DIR/notify.conf"
TO="$(sed -n 's/^PHONE=//p' "$CONF" 2>/dev/null | tr -d '"' | head -n 1)"
[[ -n "$TO" ]] || { echo "No phone number set up for alerts. Run: bash scripts/mac/enable-watchdog.sh"; exit 1; }

# Newer macOS calls them "account" and "participant"; older versions "service" and "buddy".
osascript - "$TO" "$MSG" 2>/dev/null <<'OSA' && exit 0
on run argv
  tell application "Messages"
    set acct to 1st account whose service type = iMessage
    send (item 2 of argv) to participant (item 1 of argv) of acct
  end tell
end run
OSA
osascript - "$TO" "$MSG" <<'OSA'
on run argv
  tell application "Messages"
    set svc to 1st service whose service type = iMessage
    send (item 2 of argv) to buddy (item 1 of argv) of svc
  end tell
end run
OSA
