#!/bin/bash
# Sets up the Claude agent on this Mac mini: you can text it (iMessage) or use the control panel's "Ask Claude" tab.
# It uses your own Claude subscription (Pro or Max). Run once on the Mac mini, after the watchdog is on:
#   bash scripts/mac/enable-agent.sh
# Other uses:  --token   sign in to Claude again     --status   is it running?     --off   turn it off
# Step by step, with pictures of what to click: docs/CLAUDE-AGENT-SETUP.md

set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
source "$REPO/scripts/mac/apps.sh"
AG="$HUB_DIR/agent"
RUNNER="ca.fehrgrownfarms.apphub.agent"
READER="ca.fehrgrownfarms.apphub.imessage"
RUNNER_PLIST="$HOME/Library/LaunchAgents/$RUNNER.plist"
READER_PLIST="$HOME/Library/LaunchAgents/$READER.plist"
CONF="$AG/agent.conf"
UID_GUI="gui/$(id -u)"

say() { printf "\n\033[1m%s\033[0m\n" "$*"; }
conf_get() { sed -n "s/^$1=//p" "$2" 2>/dev/null | tr -d '"' | head -n 1; }

if [[ "$(uname)" != "Darwin" ]]; then echo "This script is for macOS (the Mac mini)."; exit 1; fi

find_claude() {
  local c
  for c in "$(command -v claude 2>/dev/null || true)" "$HOME/.local/bin/claude" /opt/homebrew/bin/claude /usr/local/bin/claude; do
    [[ -n "$c" && -x "$c" ]] && { echo "$c"; return; }
  done
}

# Signs in with a long-lived token from your Claude subscription, and checks it works.
get_token() {
  local claude="$1" token out
  echo "A browser window opens: sign in to your Claude account and approve."
  echo "Then come back here: Terminal shows a long token starting with sk-ant-."
  read -r -p "Press Return to open the sign-in page… " _
  "$claude" setup-token || true
  echo
  while true; do
    read -r -s -p "Paste the token here (it won't show as you paste), then press Return: " token; echo
    token="$(echo "$token" | tr -d '[:space:]')"
    [[ "$token" == sk-ant-* ]] && break
    echo "That doesn't look like the token. It starts with sk-ant-. Try again."
  done
  mkdir -p "$AG"
  (umask 077; printf '%s\n' "$token" > "$AG/claude-token")
  echo "Checking it works…"
  out="$(CLAUDE_CODE_OAUTH_TOKEN="$token" "$claude" -p "Reply with just the word ready" --output-format json 2>&1 || true)"
  if echo "$out" | grep -q '"is_error": *false'; then echo "Signed in to Claude."
  else echo "Claude didn't accept that token. What it said:"; echo "$out" | head -c 600; echo; echo "Run this again with --token to retry."; exit 1; fi
}

case "${1:-}" in
  --off)
    launchctl bootout "$UID_GUI" "$RUNNER_PLIST" 2>/dev/null || true
    launchctl bootout "$UID_GUI" "$READER_PLIST" 2>/dev/null || true
    rm -f "$RUNNER_PLIST" "$READER_PLIST"
    echo "The Claude agent is off. Your settings are kept in $AG; run this script again to turn it back on."
    exit 0 ;;
  --status)
    launchctl print "$UID_GUI/$RUNNER" >/dev/null 2>&1 && echo "Agent: running" || echo "Agent: not running"
    launchctl print "$UID_GUI/$READER" >/dev/null 2>&1 && echo "Text reader: on" || echo "Text reader: off"
    echo "Recent activity:"; tail -n 12 "$HUB_DIR/logs/agent.log" 2>/dev/null | sed 's/^/  /' || echo "  none yet"
    exit 0 ;;
  --token)
    CLAUDE="$(find_claude)"; [[ -n "$CLAUDE" ]] || { echo "Claude Code isn't installed. Run this script without --token."; exit 1; }
    get_token "$CLAUDE"
    launchctl kickstart -k "$UID_GUI/$RUNNER" 2>/dev/null || true
    exit 0 ;;
esac

[[ -f "$HUB_DIR/notify.conf" ]] || { echo "Turn on the watchdog first (it sets up texting): bash scripts/mac/enable-watchdog.sh"; exit 1; }

say "1/5  Checking this Mac has what the agent needs"
if ! /usr/bin/python3 -c "import json, fcntl, urllib.request" >/dev/null 2>&1; then
  echo "The agent needs Apple's command line developer tools. If a window asked to install them, click Install,"
  echo "wait for it to finish, then run this script again. Otherwise run: xcode-select --install"
  exit 1
fi
echo "Python: OK"
CLAUDE="$(find_claude)"
if [[ -z "$CLAUDE" ]]; then
  echo "Claude Code isn't installed yet. Installing it with Anthropic's official installer…"
  curl -fsSL https://claude.ai/install.sh | bash
  CLAUDE="$(find_claude)"
  [[ -n "$CLAUDE" ]] || { echo "The install didn't finish. See https://docs.claude.com/en/docs/claude-code/setup and run this again."; exit 1; }
fi
echo "Claude Code: $("$CLAUDE" --version 2>/dev/null | head -n 1)"

say "2/5  Sign in with your Claude account (Pro or Max)"
if [[ -s "$AG/claude-token" ]]; then
  read -r -p "Already signed in. Sign in again? [y/N] " A
  [[ "$A" =~ ^[Yy] ]] && get_token "$CLAUDE"
else
  get_token "$CLAUDE"
fi

say "3/5  Who can text the agent"
PHONE="$(conf_get PHONE "$HUB_DIR/notify.conf")"
OLD_EXTRA="$(conf_get HANDLES "$CONF" | tr ',' '\n' | grep -vxF "$PHONE" | paste -sd, - || true)"
echo "Texts from $PHONE (your alerts number) are accepted. Texts from anyone else are ignored."
echo "If your iPhone sometimes sends iMessages from your Apple ID email instead, add it here (or press Return)."
read -r -p "Other address${OLD_EXTRA:+ [$OLD_EXTRA]}: " EXTRA; EXTRA="${EXTRA:-$OLD_EXTRA}"
HANDLES="$(printf '%s\n' "$PHONE" $(echo "$EXTRA" | tr ',' ' ') | tr '[:upper:]' '[:lower:]' | { grep -E '^(\+[0-9]{8,15}|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})$' || true; } | awk '!seen[$0]++' | paste -sd, -)"
[[ -n "$HANDLES" ]] || { echo "The alerts address in $HUB_DIR/notify.conf doesn't look right. Run: bash scripts/mac/enable-watchdog.sh"; exit 1; }
LIMIT="$(conf_get DAILY_LIMIT "$CONF")"; LIMIT="${LIMIT:-25}"
mkdir -p "$AG/escalations" "$HUB_DIR/logs"
{ echo "# Claude agent settings. Change them by running: bash scripts/mac/enable-agent.sh"
  echo "HANDLES=\"$HANDLES\""
  echo "# Most Claude runs per day, so a busy day can't use up your plan. Questions and changes count as one each."
  echo "DAILY_LIMIT=\"$LIMIT\""
  echo "CLAUDE_BIN=\"$CLAUDE\""
  echo "MODEL=\"\""; } > "$CONF"
echo "Accepting texts from: $HANDLES"

say "4/5  Let the Mac read texts sent to it"
echo "macOS keeps Messages private, so you allow one small built-in tool (sqlite3) to read them:"
echo "  1. System Settings opens at Privacy & Security → Full Disk Access."
echo "  2. Click + at the bottom of the list (enter your Mac password if asked)."
echo "  3. Press Command-Shift-G, type  /usr/bin/sqlite3  and press Return, then click Open."
echo "  4. Make sure the switch next to sqlite3 is on."
echo "It can only read; the agent ignores every conversation except texts from the addresses above."
read -r -p "Press Return to open System Settings… " _
open "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles" || true

# The helper job: every 10 seconds, the last half hour of texts from you, as JSON (agent.py takes it from there).
IN_LIST="$(echo "$HANDLES" | tr ',' '\n' | sed "s/.*/'&'/" | paste -sd, -)"
QUERY="SELECT m.ROWID AS id, m.text AS text, hex(m.attributedBody) AS body, lower(h.id) AS sender FROM message m JOIN handle h ON h.ROWID = m.handle_id WHERE m.is_from_me = 0 AND lower(h.id) IN ($IN_LIST) AND m.date > (strftime('%s','now') - 978307200 - 1800) * 1000000000 ORDER BY m.ROWID;"
xml() { sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' <<<"$1"; }
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$READER_PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$READER</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/sqlite3</string><string>-readonly</string><string>-json</string>
    <string>$HOME/Library/Messages/chat.db</string>
    <string>$(xml "$QUERY")</string>
  </array>
  <key>StartInterval</key><integer>10</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>$AG/imessage.out</string>
  <key>StandardErrorPath</key><string>$HUB_DIR/logs/imessage-reader.log</string>
</dict>
</plist>
PLISTEOF
while true; do
  read -r -p "When sqlite3 is switched on in Full Disk Access, press Return… " _
  : > "$HUB_DIR/logs/imessage-reader.log"
  launchctl bootout "$UID_GUI" "$READER_PLIST" 2>/dev/null || true
  launchctl bootstrap "$UID_GUI" "$READER_PLIST"
  sleep 4
  if grep -qiE "authoriz|unable to open|not permitted|denied" "$HUB_DIR/logs/imessage-reader.log"; then
    echo "It can't read Messages yet: $(head -n 1 "$HUB_DIR/logs/imessage-reader.log")"
    echo "Check sqlite3 is in the Full Disk Access list and switched on."
    read -r -p "Try again? [Y/n] " A
    if [[ "$A" =~ ^[Nn] ]]; then
      echo "Skipped. Texting the agent won't work until this is done, but the control panel's Ask Claude tab will."
      launchctl bootout "$UID_GUI" "$READER_PLIST" 2>/dev/null || true
      break
    fi
  else
    echo "Reading texts: OK"; break
  fi
done

say "5/5  Starting the agent"
cat > "$RUNNER_PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$RUNNER</string>
  <key>ProgramArguments</key>
  <array><string>/usr/bin/python3</string><string>$REPO/scripts/mac/agent.py</string></array>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string></dict>
  <key>WorkingDirectory</key><string>$REPO</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>15</integer>
  <key>StandardOutPath</key><string>$HUB_DIR/logs/agent.log</string>
  <key>StandardErrorPath</key><string>$HUB_DIR/logs/agent.log</string>
</dict>
</plist>
PLISTEOF
launchctl bootout "$UID_GUI" "$RUNNER_PLIST" 2>/dev/null || true
launchctl bootstrap "$UID_GUI" "$RUNNER_PLIST"
bash "$REPO/scripts/mac/notify.sh" "✅ Claude is set up on the Mac mini. Text me here any time: ask a question about the apps, or describe a change you'd like." || true

cat <<DONE

The Claude agent is on. You should get a text from the Mac mini now.
Try it: reply to that text with "Are the apps OK?" (the answer takes a moment).

  Is it running?          bash scripts/mac/enable-agent.sh --status
  What it's been doing:   ~/AppHub/logs/agent.log
  Daily limit:            $LIMIT Claude runs (change DAILY_LIMIT in $CONF)
  Turn it off:            bash scripts/mac/enable-agent.sh --off
DONE
