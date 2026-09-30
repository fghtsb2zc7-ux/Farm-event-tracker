#!/bin/bash
# Nightly automatic update for the apps on this Mac (installed by enable-auto-update.sh):
# the Farm Log, plus Rough Cut Dezigns Orders once it's set up.
#
#  1. Checks GitHub for a newer version of the branch this folder is on.
#  2. If there is one, installs it and restarts every installed app.
#  3. Checks each app answers again. If any doesn't within 90 seconds, puts the previous
#     version back and restarts again, so nobody is left with a broken app.
#
# Everything is written to ~/FarmLog/logs/update.log. Safe to run by hand any time:
#   bash scripts/mac/auto-update.sh

set -uo pipefail

# Run from a temporary copy: the update may replace this very file while it's running.
if [[ -z "${FARMLOG_UPDATE_COPY:-}" ]]; then
  COPY="$(mktemp -t farmlog-update.XXXXXX)"
  cp "$0" "$COPY"
  FARMLOG_UPDATE_COPY=1 FARMLOG_REPO="$(cd "$(dirname "$0")/../.." && pwd)" exec /bin/bash "$COPY" "$@"
fi

REPO="${FARMLOG_REPO}"
LOG="${FARMLOG_UPDATE_LOG:-$HOME/FarmLog/logs/update.log}"
WAIT_SECONDS="${FARMLOG_WAIT_SECONDS:-90}"
HUB="${HUB_DIR:-$HOME/AppHub}"
UPDATING="$HUB/state/updating"  # tells the watchdog the restarts are on purpose

trap 'rm -f "$0" "$UPDATING"' EXIT  # tidy up the temporary copy

mkdir -p "$(dirname "$LOG")"
log() { echo "$(date '+%Y-%m-%d %H:%M:%S')  $*" >> "$LOG"; }
# Texts your iPhone, once the watchdog's alerts are set up (enable-watchdog.sh).
alert() {
  [[ -f "$HUB/notify.conf" && -f "$REPO/scripts/mac/notify.sh" ]] || return 0
  bash "$REPO/scripts/mac/notify.sh" "$1" >> "$LOG" 2>&1 || log "Couldn't send a text about it."
}
# Which apps to restart (FARMLOG_APPS overrides, for testing) and how.
load_apps() { source "$REPO/scripts/mac/apps.sh"; APPS="${FARMLOG_APPS:-$(installed_apps)}"; APPS="${APPS:-farm}"; }
restart_one() {
  if [[ -n "${FARMLOG_RESTART_CMD:-}" ]]; then $FARMLOG_RESTART_CMD "$LABEL"; else sudo -n /bin/launchctl kickstart -k "system/$LABEL"; fi
}
healthy_one() {
  for _ in $(seq 1 "$WAIT_SECONDS"); do
    curl -fs "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1 && return 0
    sleep 1
  done
  return 1
}
restart() {  # restart every app; fails if any can't be restarted
  local a
  for a in $APPS; do app_config "$a" >> "$LOG"; restart_one >> "$LOG" 2>&1 || { log "Couldn't restart the $APP_NAME."; return 1; }; done
}
healthy() {  # every app answers; logs which one doesn't
  local a ok=0
  for a in $APPS; do app_config "$a" >> "$LOG"; healthy_one || { log "The $APP_NAME isn't answering (see $HOME_DIR/logs/$LOG_NAME)."; ok=1; }; done
  return $ok
}

cd "$REPO" || { log "ERROR: project folder $REPO not found"; exit 1; }
BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if ! GIT_TERMINAL_PROMPT=0 git fetch --quiet origin "$BRANCH" >> "$LOG" 2>&1; then
  log "Couldn't reach GitHub (no internet, or GitHub needs signing in again). Will try again tomorrow."
  exit 0
fi

OLD="$(git rev-parse HEAD)"
NEW="$(git rev-parse "origin/$BRANCH")"
if [[ "$OLD" == "$NEW" ]]; then
  log "Up to date ($BRANCH at ${OLD:0:7})."
  exit 0
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  log "Skipped: files in $REPO were changed by hand. Undo those changes (git checkout .) so updates can install."
  exit 0
fi

if ! git merge --ff-only --quiet "origin/$BRANCH" >> "$LOG" 2>&1; then
  log "Skipped: the new version can't be applied as a simple update. Run scripts/mac/update.sh by hand to see why."
  exit 0
fi
log "Installed ${NEW:0:7} ($(git log -1 --format=%s "$NEW"))."
load_apps
[[ -d "$HUB/state" ]] && date +%s > "$UPDATING"

if ! restart; then
  log "ERROR: couldn't restart ($APPS). Run: bash scripts/mac/enable-auto-update.sh (it sets up permission to restart)."
  alert "⚠️ Tonight's app update couldn't restart the apps (missing permission). On the Mac mini, run: bash scripts/mac/enable-auto-update.sh"
  exit 1
fi

if healthy; then
  log "Restarted and running: $APPS."
  exit 0
fi

log "PROBLEM: the new version didn't start. Putting back ${OLD:0:7}."
git reset --quiet --hard "$OLD" >> "$LOG" 2>&1
restart
if healthy; then
  log "Previous version restored and running. The failed update will be tried again when a newer version is available."
  alert "⚠️ Tonight's app update didn't start properly, so I put the previous version back. Everything is running as before."
else
  log "ERROR: still not answering even on the previous version. Check the log files named above."
  alert "⚠️ Tonight's app update failed, and the apps still aren't answering after putting the previous version back. The watchdog will keep trying to restart them."
fi
exit 1
