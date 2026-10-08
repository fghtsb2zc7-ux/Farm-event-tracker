#!/bin/bash
# Updates a stack to the newest build of the image versions written in its compose.yaml,
# checks it's healthy, and goes back to the images it had before if it isn't.
#   bash homeserver/scripts/update.sh <stack>
#   bash homeserver/scripts/update.sh all      every stack except those in NO_AUTO_UPDATE (services.sh)
# Moving to a new version (for example v1.2 -> v1.3) is done by editing the tag in compose.yaml,
# then running this script.

set -euo pipefail

HS="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$HS/.." && pwd)"
STACK_SH="$HS/scripts/stack.sh"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
source "$HS/services.sh"

[[ -n "${1:-}" ]] || { sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }
say() { echo "$(date '+%Y-%m-%d %H:%M:%S')  $*"; }
alert() { say "Problem: $*"; bash "$REPO/scripts/mac/notify.sh" "Mac mini: $*" >/dev/null 2>&1 || true; }

compose() {
  local s="$1"; shift
  docker compose --project-directory "$HS/stacks/$s" -f "$HS/stacks/$s/compose.yaml" -p "$s" "$@"
}

# True when every container in the stack is running (and healthy, if it has a health check),
# and every health URL listed for the stack in services.sh answers.
healthy() {
  local s="$1" line name stack url
  local bad
  bad="$(docker ps -a --filter "label=com.docker.compose.project=$s" --format '{{.Status}}' | grep -vE '^Up' || true)"
  [[ -z "$bad" ]] || return 1
  docker ps --filter "label=com.docker.compose.project=$s" --format '{{.Status}}' | grep -qE '\((health: starting|unhealthy)\)' && return 1
  while read -r name stack url _; do
    [[ "$stack" == "$s" && -n "$url" ]] || continue
    curl -fsS -o /dev/null --max-time 10 "$url" || return 1
  done < <(container_services)
  return 0
}

update_stack() {
  local s="$1" img old new changed=0
  local -a imgs=() olds=()
  say "Updating $s"
  bash "$STACK_SH" up "$s" >/dev/null      # makes sure the config and key are in place
  while read -r img; do
    [[ -n "$img" ]] || continue
    imgs+=("$img"); olds+=("$(docker image inspect -f '{{.Id}}' "$img" 2>/dev/null || true)")
  done < <(compose "$s" config --images)
  compose "$s" pull --quiet
  for i in "${!imgs[@]}"; do
    new="$(docker image inspect -f '{{.Id}}' "${imgs[$i]}" 2>/dev/null || true)"
    [[ "$new" != "${olds[$i]}" ]] && changed=1
  done
  if [[ $changed == 0 ]]; then say "$s is already up to date."; return 0; fi

  bash "$STACK_SH" up "$s" >/dev/null
  for _ in $(seq 1 24); do sleep 5; healthy "$s" && { say "$s updated and healthy."; return 0; }; done

  # Not healthy after 2 minutes: put the previous images back under the same names and restart.
  for i in "${!imgs[@]}"; do
    [[ -n "${olds[$i]}" ]] && docker tag "${olds[$i]}" "${imgs[$i]}"
  done
  bash "$STACK_SH" up "$s" >/dev/null
  alert "$s wasn't healthy after its update, so it was put back to the previous version."
  return 1
}

if [[ "$1" == all ]]; then
  rc=0
  for d in "$HS"/stacks/*/; do
    s="$(basename "$d")"; [[ -f "$d/compose.yaml" ]] || continue
    if [[ " $NO_AUTO_UPDATE " == *" $s "* ]]; then say "Skipping $s (updated by hand only)."; continue; fi
    update_stack "$s" || rc=1
  done
  exit $rc
fi
update_stack "$1"
