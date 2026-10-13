#!/bin/bash
# Sends an alert to you: a phone notification (ntfy), an email, and/or an iMessage.
# Which ones is set in ~/AppHub/notify.conf (see docs/ALERTS.md):
#   NOTIFY_NTFY="yes"       phone notification through ntfy (topic in ~/ServerData/secrets/ntfy-topic)
#   NOTIFY_EMAIL="yes"      email through Gmail (EMAIL_FROM, EMAIL_TO; app password in ~/ServerData/secrets/msmtp-password)
#   NOTIFY_IMESSAGE="yes"   text to PHONE through the Messages app on this Mac
# A channel that isn't set up yet is skipped. It works if at least one channel gets the message through.
#   bash scripts/mac/notify.sh "The Farm Log is down"

set -uo pipefail
source "$(cd "$(dirname "$0")" && pwd)/apps.sh"

MSG="$*"
[[ -n "$MSG" ]] || { echo "Usage: bash scripts/mac/notify.sh \"message\""; exit 1; }

# For testing: send somewhere else instead.
if [[ -n "${HUB_NOTIFY_CMD:-}" ]]; then $HUB_NOTIFY_CMD "$MSG"; exit $?; fi

CONF="$HUB_DIR/notify.conf"
SECRETS="${SERVER_DATA:-$HOME/ServerData}/secrets"
setting() { sed -n "s/^$1=//p" "$CONF" 2>/dev/null | tr -d '"' | head -n 1 || true; }

TO="$(setting PHONE)"
NTFY_URL="$(setting NTFY_URL)"; NTFY_URL="${NTFY_URL:-https://ntfy.taild086ea.ts.net}"
EMAIL_FROM="$(setting EMAIL_FROM)"; EMAIL_TO="$(setting EMAIL_TO)"; EMAIL_TO="${EMAIL_TO:-$EMAIL_FROM}"
# Older settings files have only PHONE: then iMessage stays on, as before.
WANT_IMESSAGE="$(setting NOTIFY_IMESSAGE)"; [[ -z "$WANT_IMESSAGE" && -n "$TO" ]] && WANT_IMESSAGE=yes
WANT_NTFY="$(setting NOTIFY_NTFY)"; WANT_NTFY="${WANT_NTFY:-yes}"
WANT_EMAIL="$(setting NOTIFY_EMAIL)"; WANT_EMAIL="${WANT_EMAIL:-yes}"

# The first line is the title; "⚠️" alerts are marked urgent so the phone makes a sound even when quiet.
TITLE="Mac mini"; PRIORITY=default
[[ "$MSG" == ⚠️* ]] && PRIORITY=high

SENT=0; TRIED=0

send_ntfy() {
  local topic; topic="$(cat "$SECRETS/ntfy-topic" 2>/dev/null)" || return 2
  [[ -n "$topic" ]] || return 2
  curl -fsS --max-time 15 -o /dev/null -H "Title: $TITLE" -H "Priority: $PRIORITY" -H "Tags: computer" \
    --data-binary "$MSG" "$NTFY_URL/$topic"
}

send_email() {
  [[ -n "$EMAIL_FROM" && -s "$SECRETS/msmtp-password" ]] || return 2
  local msmtp; msmtp="$(command -v msmtp || echo /opt/homebrew/bin/msmtp)"
  [[ -x "$msmtp" ]] || return 2
  local subject; subject="$TITLE: $(echo "$MSG" | head -n 1 | cut -c1-80)"
  printf 'From: Mac mini <%s>\nTo: %s\nSubject: %s\nContent-Type: text/plain; charset=UTF-8\n\n%s\n' \
    "$EMAIL_FROM" "$EMAIL_TO" "$subject" "$MSG" |
  "$msmtp" --host=smtp.gmail.com --port=587 --tls=on --auth=on --user="$EMAIL_FROM" --from="$EMAIL_FROM" \
    --passwordeval="cat '$SECRETS/msmtp-password'" "$EMAIL_TO"
}

send_imessage() {
  [[ -n "$TO" ]] || return 2
  # Newer macOS calls them "account" and "participant"; older versions "service" and "buddy".
  osascript - "$TO" "$MSG" 2>/dev/null <<'OSA' && return 0
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
}

# Gives up on a channel after 30 seconds, so one stuck channel can't hold up the others.
limit() {
  "$@" & local pid=$!
  ( sleep 30; kill "$pid" 2>/dev/null ) & local timer=$!
  wait "$pid"; local rc=$?
  kill "$timer" 2>/dev/null; wait "$timer" 2>/dev/null
  return $rc
}

try() {  # NAME WANTED FUNCTION
  [[ "$2" == yes ]] || return 0
  limit "$3"; local rc=$?
  if (( rc == 2 )); then return 0; fi           # not set up yet
  TRIED=$((TRIED + 1))
  if (( rc == 0 )); then SENT=$((SENT + 1)); else echo "Couldn't send the alert by $1."; fi
}

try "phone notification (ntfy)" "$WANT_NTFY" send_ntfy
try "email" "$WANT_EMAIL" send_email
try "iMessage" "$WANT_IMESSAGE" send_imessage

if (( TRIED == 0 )); then echo "No alert channel is set up yet. See docs/ALERTS.md."; exit 1; fi
(( SENT > 0 ))
