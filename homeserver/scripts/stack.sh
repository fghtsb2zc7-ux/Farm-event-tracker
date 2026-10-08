#!/bin/bash
# Starts, stops and checks the Docker stacks in homeserver/stacks/ (one folder per stack).
#   bash homeserver/scripts/stack.sh up <stack>        start it (or restart with new settings)
#   bash homeserver/scripts/stack.sh down <stack>      stop it (its data in ~/ServerData stays)
#   bash homeserver/scripts/stack.sh status [<stack>]  what's running
#   bash homeserver/scripts/stack.sh logs <stack>      its recent log
#   bash homeserver/scripts/stack.sh update <stack>    newer images, with automatic roll back (update.sh)
# <stack> can be "all". "boot" starts Colima and then every stack (the login job runs this).

set -euo pipefail

HS="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export SERVERDATA="${SERVERDATA:-$HOME/ServerData}"
TS_KEY_FILE="$SERVERDATA/secrets/ts-authkey"

usage() { sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }

all_stacks() {
  local d
  for d in "$HS"/stacks/*/; do [[ -f "$d/compose.yaml" ]] && basename "$d"; done
  return 0
}

# Runs docker compose for one stack. Its optional .env (settings) sits next to its compose.yaml.
compose() {
  local s="$1"; shift
  docker compose --project-directory "$HS/stacks/$s" -f "$HS/stacks/$s/compose.yaml" -p "$s" "$@"
}

# The Docker machine only sees ~/ServerData, so each stack's config/ folder is copied there first.
# The Tailscale key is read from its file into memory, never written into the repo.
prepare() {
  local s="$1"
  [[ -f "$HS/stacks/$s/compose.yaml" ]] || { echo "There's no stack called '$s'. Stacks: $(all_stacks | xargs)"; exit 1; }
  export STACK_CONFIG="$SERVERDATA/stacks/$s/config"
  mkdir -p "$STACK_CONFIG"
  if [[ -d "$HS/stacks/$s/config" ]]; then cp -R "$HS/stacks/$s/config/." "$STACK_CONFIG/"; fi
  if grep -q 'TS_AUTHKEY' "$HS/stacks/$s/compose.yaml"; then
    [[ -s "$TS_KEY_FILE" ]] || { echo "The Tailscale key is missing: ${TS_KEY_FILE/#$HOME/~}. See homeserver/README.md."; exit 1; }
    TS_AUTHKEY="$(tr -d '[:space:]' < "$TS_KEY_FILE")"; export TS_AUTHKEY
  fi
}

docker_ready() { docker info >/dev/null 2>&1; }

need_docker() {
  docker_ready || { echo "Docker isn't running. Start it with: colima start"; exit 1; }
}

# "all" or one stack name -> the list to work on
targets() { if [[ "$1" == all ]]; then all_stacks; else echo "$1"; fi; }

CMD="${1:-}"; STACK="${2:-}"
case "$CMD" in
  up)
    [[ -n "$STACK" ]] || usage; need_docker
    for s in $(targets "$STACK"); do
      echo "Starting $s..."; prepare "$s"; compose "$s" up -d --remove-orphans
    done ;;
  down)
    [[ -n "$STACK" ]] || usage; need_docker
    for s in $(targets "$STACK"); do
      echo "Stopping $s (its data stays in ~/ServerData)..."; prepare "$s"; compose "$s" down
    done ;;
  status)
    if ! docker_ready; then echo "Docker: not running (colima status: $(colima status 2>&1 | tail -n 1))"; exit 1; fi
    echo "Docker: running"
    for s in $(targets "${STACK:-all}"); do
      echo; echo "== $s"; prepare "$s" >/dev/null; compose "$s" ps --format 'table {{.Service}}\t{{.Status}}\t{{.Image}}'
    done ;;
  logs)
    [[ -n "$STACK" ]] || usage; need_docker; prepare "$STACK"; shift 2
    compose "$STACK" logs --tail 200 "$@" ;;
  update)
    [[ -n "$STACK" ]] || usage
    exec bash "$HS/scripts/update.sh" "$STACK" ;;
  boot)
    echo "$(date '+%Y-%m-%d %H:%M:%S')  Starting Docker (Colima)..."
    docker_ready || colima start
    for _ in $(seq 1 60); do docker_ready && break; sleep 2; done
    need_docker
    for s in $(all_stacks); do
      echo "$(date '+%Y-%m-%d %H:%M:%S')  Starting $s"
      ( prepare "$s" && compose "$s" up -d --remove-orphans ) || echo "$(date '+%Y-%m-%d %H:%M:%S')  Problem: $s didn't start"
    done
    echo "$(date '+%Y-%m-%d %H:%M:%S')  Done." ;;
  *) usage ;;
esac
