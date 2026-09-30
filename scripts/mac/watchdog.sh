#!/bin/bash
# The App Hub watchdog. launchd runs it every minute (turned on by enable-watchdog.sh). For each app on this Mac:
#   - checks it answers. If it misses two checks in a row, restarts it.
#   - texts you if it's still down after the restart, again every 2 hours while it stays down, and when it's back.
#   - every 5 minutes, checks phones can still reach it over the internet (Tailscale Funnel), and re-applies
#     the sharing setting if they can't. Apps that were never shared online are left alone.
#   - every 6 hours, checks the nightly backups ran and the Mac has storage left.
# It writes to ~/AppHub/logs/watchdog.log only when something changes.
#
# By hand:
#   bash scripts/mac/watchdog.sh --status          what's running, and recent events
#   bash scripts/mac/watchdog.sh --pause shop      stop watching an app (for example while you work on it)
#   bash scripts/mac/watchdog.sh --resume shop

set -uo pipefail
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
source "$REPO/scripts/mac/apps.sh"

STATE="$HUB_DIR/state"
LOG="$HUB_DIR/logs/watchdog.log"
REMIND_SECONDS="${HUB_REMIND_SECONDS:-7200}"
PUBLIC_EVERY="${HUB_PUBLIC_EVERY:-300}"
DAILY_EVERY="${HUB_DAILY_EVERY:-21600}"
MIN_FREE_GB="${HUB_MIN_FREE_GB:-5}"
APPS="${HUB_APPS:-$(installed_apps)}"
NOW="$(date +%s)"
mkdir -p "$STATE" "$(dirname "$LOG")"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S')  $*" >> "$LOG"; }
text() { log "Text: $1"; bash "$REPO/scripts/mac/notify.sh" "$1" >> "$LOG" 2>&1 || log "Couldn't send that text."; }
get() { cat "$STATE/$1" 2>/dev/null || echo "${2-0}"; }
put() { echo "$2" > "$STATE/$1"; }
ago() { local m=$(( $1 / 60 )); if (( m < 60 )); then echo "$m min"; else echo "$(( m / 60 )) h $(( m % 60 )) min"; fi; }

# problem KEY MESSAGE [REMIND_SECONDS]: texts once, then a reminder every so often while it lasts.
problem() {
  local key="$1" msg="$2" remind="${3:-$REMIND_SECONDS}" last
  [[ -f "$STATE/$key.since" ]] || put "$key.since" "$NOW"
  last="$(get "$key.alerted" "")"
  if [[ -z "$last" ]]; then
    text "⚠️ $msg"; put "$key.alerted" "$NOW"
  elif (( NOW - last >= remind )); then
    text "⚠️ Still a problem after $(ago $(( NOW - $(get "$key.since") )) ): $msg"; put "$key.alerted" "$NOW"
  fi
}
# resolved KEY MESSAGE: clears a problem, and texts that it's fixed if you were told about it.
resolved() {
  local key="$1" took
  [[ -f "$STATE/$key.since" ]] || { rm -f "$STATE/$key".*; return 0; }
  took="$(ago $(( NOW - $(get "$key.since") )) )"
  log "Fixed: $2 (after $took)."
  [[ -f "$STATE/$key.alerted" ]] && text "✅ $2 (after $took)."
  rm -f "$STATE/$key".*
}

# Hands a problem a restart didn't fix to the Claude agent, when it's set up (enable-agent.sh). Once per problem.
AGENT_ON=""; [[ -f "$HUB_DIR/agent/agent.conf" ]] && AGENT_ON=1
escalate() {  # KEY DESCRIPTION
  [[ -n "$AGENT_ON" && ! -f "$STATE/$1.escalated" ]] || return 0
  touch "$STATE/$1.escalated"
  mkdir -p "$HUB_DIR/agent/escalations"
  printf '{"app":"%s","name":"%s","text":"%s","log":"%s"}\n' "$APP" "$APP_NAME" "$2" "$HOME_DIR/logs/$LOG_NAME" > "$HUB_DIR/agent/escalations/$1.json"
  log "Asked the Claude agent to look into it."
}

restart_app() {
  if [[ -n "${HUB_RESTART_CMD:-}" ]]; then $HUB_RESTART_CMD "$LABEL"; else sudo -n /bin/launchctl kickstart -k "system/$LABEL"; fi
}
# Runs a command, giving up after 20 seconds so one stuck command can't stop the watchdog.
with_timeout() {
  "$@" & local pid=$!
  ( sleep 20; kill "$pid" 2>/dev/null ) & local timer=$!
  wait "$pid"; local rc=$?
  kill "$timer" 2>/dev/null; wait "$timer" 2>/dev/null
  return $rc
}

# ---- Commands run by hand ----
case "${1:-}" in
  --status)
    for a in $APPS; do
      app_config "$a"
      if [[ -f "$STATE/$a.paused" ]]; then echo "$APP_NAME: paused (not watched)"
      elif curl -fs --max-time 5 "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then echo "$APP_NAME: running"
      else echo "$APP_NAME: NOT ANSWERING"; fi
    done
    echo; echo "Recent events (all in $LOG):"
    tail -n 15 "$LOG" 2>/dev/null | sed 's/^/  /' || echo "  none yet"
    exit 0 ;;
  --pause|--resume)
    app_config "${2:-}" || exit 1
    if [[ "$1" == --pause ]]; then touch "$STATE/$APP.paused"; log "Paused watching the $APP_NAME."; echo "The watchdog is ignoring the $APP_NAME until: bash scripts/mac/watchdog.sh --resume $APP"
    else rm -f "$STATE/$APP.paused"; log "Resumed watching the $APP_NAME."; echo "The watchdog is watching the $APP_NAME again."; fi
    exit 0 ;;
esac

# ---- Every minute ----
[[ -f "$LOG" ]] && (( $(wc -c < "$LOG") > 1000000 )) && mv "$LOG" "$LOG.1"

if [[ -f "$STATE/send-test" ]]; then
  rm -f "$STATE/send-test"
  text "✅ App Hub alerts are working. You'll get a text here if one of the apps on the Mac mini goes down."
fi

# The nightly update restarts apps on purpose; leave them alone while it runs (unless it's been stuck 15 min).
if [[ -f "$STATE/updating" ]]; then
  (( NOW - $(get updating) < 900 )) && exit 0
  rm -f "$STATE/updating"
fi

RUNNING=""
check_app() {
  local a="$APP" n
  if curl -fs --max-time 5 "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
    resolved "$a-down" "$APP_NAME is back up"
    RUNNING="$RUNNING $a"
    return 0
  fi
  [[ -f "$STATE/$a-down.since" ]] || put "$a-down.since" "$NOW"
  n=$(( $(get "$a-down.count") + 1 )); put "$a-down.count" "$n"
  if (( n == 1 )); then log "$APP_NAME didn't answer. Checking again in a minute."; return 0; fi
  if (( n == 2 || n == 5 || n == 15 || n % 30 == 0 )); then
    if restart_app >> "$LOG" 2>&1; then log "Restarted the $APP_NAME (not answering for $n checks)."
    else log "Couldn't restart the $APP_NAME (reason above). If it says a password is required, run: bash scripts/mac/enable-watchdog.sh"; fi
  fi
  if (( n >= 3 )); then
    problem "$a-down" "$APP_NAME is down. I restarted it, but it still isn't answering. ${AGENT_ON:+Claude is looking into it. }I'll keep trying and text you when it's back."
    escalate "$a-down" "$APP_NAME is down: it isn't answering, even after the watchdog restarted it."
  fi
}

for a in $APPS; do
  app_config "$a" || continue
  [[ -f "$STATE/$a.seen" ]] || put "$a.seen" "$NOW"
  [[ -f "$STATE/$a.paused" ]] && continue
  check_app
done

# ---- Every 5 minutes: can phones reach the running apps over the internet? ----
check_public() {
  local ts host ip a url n hint
  ts="$(ts_bin)"; [[ -n "$ts" ]] || return 0   # Tailscale not installed: apps aren't shared publicly
  if ! curl -fs --max-time 10 -o /dev/null https://www.apple.com/library/test/success.html; then
    [[ -f "$STATE/internet.since" ]] || { put internet.since "$NOW"; log "This Mac's internet connection is down."; }
    return 0
  fi
  if [[ -f "$STATE/internet.since" ]]; then
    n=$(( NOW - $(get internet.since) )); rm -f "$STATE/internet.since"
    log "Internet connection back after $(ago "$n")."
    (( n >= 600 )) && text "ℹ️ The Mac mini's internet was down for about $(ago "$n"), so phones couldn't reach the apps. It's back now."
  fi

  host="$(ts_host)"
  if [[ -z "$host" ]]; then
    problem tailscale "Tailscale isn't running or signed in on the Mac mini, so phones can't reach the apps. Open the Tailscale app on the Mac mini and sign in."
    return 0
  fi
  resolved tailscale "Tailscale is running again on the Mac mini"
  ip="$(public_ip "$host")"

  for a in $RUNNING; do
    app_config "$a"
    url="https://$host${FUNNEL_PATH%/}/api/health"
    if [[ -n "$ip" ]] && curl -fs --max-time 20 --resolve "$host:443:$ip" -o /dev/null "$url"; then
      [[ -f "$STATE/$a.shared" ]] || { touch "$STATE/$a.shared"; log "$APP_NAME is reachable from the internet at https://$host${FUNNEL_PATH%/}/"; }
      resolved "$a-public" "Phones can reach $APP_NAME again"
      continue
    fi
    [[ -f "$STATE/$a.shared" ]] || continue   # never shared online (yet): nothing to repair
    [[ -f "$STATE/$a-public.since" ]] || put "$a-public.since" "$NOW"
    n=$(( $(get "$a-public.count") + 1 )); put "$a-public.count" "$n"
    if (( n == 1 )); then
      log "Phones can't reach $APP_NAME at $url. Re-applying its sharing setting."
      with_timeout "$ts" funnel --bg --https=443 --set-path="$FUNNEL_PATH" "http://127.0.0.1:$PORT" >> "$LOG" 2>&1
    else
      hint="On the Mac mini, run: bash scripts/mac/check-online.sh"; [[ -n "$AGENT_ON" ]] && hint="Claude is looking into it."
      problem "$a-public" "$APP_NAME is running on the Mac mini, but phones can't reach it over the internet. I re-applied its sharing setting and that didn't fix it. $hint"
      escalate "$a-public" "$APP_NAME is running on the Mac mini, but phones can't reach it over the internet (Tailscale Funnel). Re-applying its sharing setting didn't help."
    fi
  done
}
if (( NOW - $(get public.last) >= PUBLIC_EVERY )); then
  put public.last "$NOW"
  check_public
fi

# ---- Every 6 hours: storage and backups ----
check_daily() {
  local free_gb a
  free_gb="$(df -Pk "$HOME" | awk 'NR==2 {print int($4 / 1048576)}')"
  if (( free_gb < MIN_FREE_GB )); then
    problem disk "The Mac mini is almost out of storage (${free_gb} GB free). The apps can stop saving when it's full." 86400
  else
    resolved disk "The Mac mini has enough storage again (${free_gb} GB free)"
  fi
  for a in $APPS; do
    app_config "$a"
    [[ -f "$STATE/$a.paused" ]] && continue
    (( NOW - $(get "$a.seen" "$NOW") < 172800 )) && continue   # give a newly set up app two nights first
    if [[ -n "$(find "$HOME_DIR/pb_data/backups" -name '*.zip' -mtime -2 2>/dev/null | head -n 1)" ]]; then
      resolved "$a-backup" "$APP_NAME is making nightly backups again"
    else
      problem "$a-backup" "$APP_NAME hasn't made a backup in over 2 days. Its data is fine, but there's no recent safety copy." 86400
    fi
  done
}
if (( NOW - $(get daily.last) >= DAILY_EVERY )); then
  put daily.last "$NOW"
  check_daily
fi

# ---- Optional: tell an outside service the Mac is alive, so you hear about it if the whole Mac goes down ----
HEARTBEAT_URL="$(sed -n 's/^HEARTBEAT_URL=//p' "$HUB_DIR/notify.conf" 2>/dev/null | tr -d '"' | head -n 1)"
[[ -n "$HEARTBEAT_URL" ]] && curl -fs --max-time 10 -o /dev/null "$HEARTBEAT_URL"
exit 0
