#!/bin/bash
# Nightly automatic update for the Farm Log (installed by enable-auto-update.sh).
#
#  1. Checks GitHub for a newer version of the branch this folder is on.
#  2. If there is one, installs it and restarts the Farm Log.
#  3. Checks the Farm Log answers again. If it doesn't within 90 seconds, puts the previous
#     version back and restarts again, so the farm is never left with a broken app.
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

trap 'rm -f "$0"' EXIT  # tidy up the temporary copy

LABEL="ca.fehrgrownfarms.farmlog"
REPO="${FARMLOG_REPO}"
LOG="${FARMLOG_UPDATE_LOG:-$HOME/FarmLog/logs/update.log}"
HEALTH_URL="${FARMLOG_HEALTH_URL:-http://127.0.0.1:8090/api/health}"
RESTART_CMD="${FARMLOG_RESTART_CMD:-sudo -n /bin/launchctl kickstart -k system/$LABEL}"
WAIT_SECONDS="${FARMLOG_WAIT_SECONDS:-90}"

mkdir -p "$(dirname "$LOG")"
log() { echo "$(date '+%Y-%m-%d %H:%M:%S')  $*" >> "$LOG"; }
healthy() {
  for _ in $(seq 1 "$WAIT_SECONDS"); do
    curl -fs "$HEALTH_URL" >/dev/null 2>&1 && return 0
    sleep 1
  done
  return 1
}
restart() { $RESTART_CMD >> "$LOG" 2>&1; }

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

if ! restart; then
  log "ERROR: couldn't restart the Farm Log. Run: bash scripts/mac/enable-auto-update.sh (it sets up permission to restart)."
  exit 1
fi

if healthy; then
  log "Farm Log restarted and running."
  exit 0
fi

log "PROBLEM: the new version didn't start. Putting back ${OLD:0:7}."
git reset --quiet --hard "$OLD" >> "$LOG" 2>&1
restart
if healthy; then
  log "Previous version restored and running. The failed update will be tried again when a newer version is available."
else
  log "ERROR: the Farm Log isn't answering even on the previous version. Check ~/FarmLog/logs/farmlog.log."
fi
exit 1
