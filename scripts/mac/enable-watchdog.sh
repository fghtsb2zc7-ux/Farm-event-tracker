#!/bin/bash
# Turns on the App Hub watchdog: it checks every app on this Mac each minute, restarts any that stop,
# and texts your iPhone (iMessage) about problems it can't fix. Run once on the Mac mini:
#   bash scripts/mac/enable-watchdog.sh
# Change the phone number: run it again.  Send another test text:  --test.  Turn it off:  --off
# Before you start, sign in to the Messages app on this Mac (see docs/APP-HUB-SETUP.md).

set -euo pipefail

AGENT="ca.fehrgrownfarms.apphub.watchdog"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/$AGENT.plist"
source "$REPO/scripts/mac/apps.sh"
CONF="$HUB_DIR/notify.conf"

say() { printf "\n\033[1m%s\033[0m\n" "$*"; }

if [[ "$(uname)" != "Darwin" ]]; then echo "This script is for macOS (the Mac mini)."; exit 1; fi

send_test() {  # sent by the watchdog itself, so macOS asks for the Messages permission the watchdog needs
  mkdir -p "$HUB_DIR/state"; touch "$HUB_DIR/state/send-test"
  launchctl kickstart "gui/$(id -u)/$AGENT" 2>/dev/null || true   # otherwise it's sent on the next minute's check
  echo "Sending a test text (can take up to a minute)…"
  echo "If the Mac asks to let \"bash\" or \"osascript\" control Messages, click OK (or Allow)."
  sleep 15
  read -r -p "Did the test text arrive on your iPhone? [Y/n] " ANSWER
  if [[ "$ANSWER" =~ ^[Nn] ]]; then
    echo
    echo "Things to check:"
    echo "  - Open Messages on this Mac. It must be signed in (Messages → Settings → iMessage)."
    echo "  - System Settings → Privacy & Security → Automation: allow bash/osascript to control Messages."
    echo "  - What happened: tail $HUB_DIR/logs/watchdog.log"
    echo "Then try again with: bash scripts/mac/enable-watchdog.sh --test"
  fi
}

case "${1:-}" in
  --off)
    launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
    rm -f "$PLIST"
    echo "The watchdog is off. Your apps keep running; you just won't get texts about them."
    exit 0 ;;
  --test)
    [[ -f "$PLIST" ]] || { echo "The watchdog isn't on yet. Run: bash scripts/mac/enable-watchdog.sh"; exit 1; }
    send_test; exit 0 ;;
esac

say "1/3  Where should alerts go?"
echo "Type the iPhone number (like 519-555-1234) or the Apple ID email that gets your iMessages."
OLD_TO="$(sed -n 's/^PHONE=//p' "$CONF" 2>/dev/null | tr -d '"' | head -n 1)"
while true; do
  if [[ -n "$OLD_TO" ]]; then read -r -p "Send texts to [$OLD_TO]: " TO; TO="${TO:-$OLD_TO}"
  else read -r -p "Send texts to: " TO; fi
  if [[ "$TO" == *@* ]]; then break; fi
  DIGITS="$(echo "$TO" | tr -cd '0-9')"
  if [[ ${#DIGITS} == 10 ]]; then TO="+1$DIGITS"; break; fi       # North American number without the 1
  if [[ ${#DIGITS} -ge 11 ]]; then TO="+$DIGITS"; break; fi
  echo "That doesn't look like a phone number or email. Try again."
done
echo
echo "Optional: a free outside check that texts or emails you if the whole Mac mini goes offline"
echo "(power cut, frozen). Paste a healthchecks.io ping URL, or just press Return to skip."
OLD_HB="$(sed -n 's/^HEARTBEAT_URL=//p' "$CONF" 2>/dev/null | tr -d '"' | head -n 1)"
read -r -p "Ping URL${OLD_HB:+ [$OLD_HB]}: " HB; HB="${HB:-$OLD_HB}"

mkdir -p "$HUB_DIR/state" "$HUB_DIR/logs"
{ echo "# App Hub alert settings. Change them by running: bash scripts/mac/enable-watchdog.sh"
  echo "PHONE=\"$TO\""
  echo "HEARTBEAT_URL=\"$HB\""; } > "$CONF"
echo "Saved. Alerts go to $TO."

say "2/3  Permission to restart the apps (asks for your Mac password)"
write_restart_permission
echo "Done. The watchdog can restart the apps, and nothing else."

say "3/3  Starting the watchdog"
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$AGENT</string>
  <key>ProgramArguments</key>
  <array><string>/bin/bash</string><string>$REPO/scripts/mac/watchdog.sh</string></array>
  <key>StartInterval</key><integer>60</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>$HUB_DIR/logs/watchdog.log</string>
  <key>StandardErrorPath</key><string>$HUB_DIR/logs/watchdog.log</string>
</dict>
</plist>
PLISTEOF
launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
send_test

echo
echo "The watchdog is on. It checks every app each minute while you're logged in on this Mac."
echo "  See what it's doing:   bash scripts/mac/watchdog.sh --status"
echo "  Pause it for an app:   bash scripts/mac/watchdog.sh --pause shop   (and --resume shop)"
