#!/bin/bash
# Hourly backup of the password manager (Vaultwarden) to the ServerBackup drive (see docs/VAULT.md).
#  1. Asks Vaultwarden for a safe copy of its database (never copies the live file).
#  2. Backs up that copy plus attachments, sends, keys and settings with restic (tag "vault").
#  3. Keeps 48 hourly, 30 daily and 12 monthly copies; frees space once a day.
# Alerts you (notify.sh) if anything fails. Also runs before the nightly backup (backup.sh).
#   bash homeserver/backup/vault-backup.sh            run it now
#   bash homeserver/backup/vault-backup.sh --copy-only  only refresh the database copy

set -uo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
source "$REPO/scripts/mac/apps.sh"
SERVER_DATA="${SERVER_DATA:-$HOME/ServerData}"
VAULT="$SERVER_DATA/vault"
COPY="$VAULT/backups/db.sqlite3"
export RESTIC_REPOSITORY="${RESTIC_REPOSITORY:-/Volumes/ServerBackup/restic}"
export RESTIC_PASSWORD_FILE="${RESTIC_PASSWORD_FILE:-$SERVER_DATA/secrets/restic-password}"
LOG="$HUB_DIR/logs/vault-backup.log"
PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
CONTAINER=vault-vaultwarden-1

mkdir -p "$(dirname "$LOG")" "$VAULT/backups"
log() { echo "$(date '+%Y-%m-%d %H:%M:%S')  $*" >> "$LOG"; }
alert() {
  log "Problem: $1"
  bash "$REPO/scripts/mac/notify.sh" "⚠️ Password manager backup: $1" >> "$LOG" 2>&1 || log "Couldn't send an alert about it."
}

# 1. A safe copy of the database, made by Vaultwarden itself (db_<date>.sqlite3 in its data folder).
docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTAINER" || { alert "the password manager isn't running, so no backup was made."; exit 1; }
if ! OUT="$(docker exec "$CONTAINER" /vaultwarden backup 2>&1)"; then
  echo "$OUT" >> "$LOG"; alert "Vaultwarden couldn't make a copy of its database. See ~/AppHub/logs/vault-backup.log"; exit 1
fi
NEW="$(ls -t "$VAULT"/data/db_*.sqlite3 2>/dev/null | head -n 1)"
[[ -n "$NEW" && -s "$NEW" ]] || { alert "the database copy is missing."; exit 1; }
if [[ "$(sqlite3 "$NEW" 'PRAGMA integrity_check;' 2>&1)" != ok ]]; then
  alert "the database copy failed its check; the previous good copy was kept."; rm -f "$NEW"; exit 1
fi
chmod 600 "$NEW"; mv "$NEW" "$COPY"
rm -f "$VAULT"/data/db_*.sqlite3   # leftovers from interrupted runs
[[ "${1:-}" == --copy-only ]] && exit 0

# 2. Back up (not the live database files: the checked copy is the one to restore).
[[ -d "$RESTIC_REPOSITORY" ]] || { alert "the ServerBackup drive isn't plugged in, so this hour's backup was skipped."; exit 1; }
if ! OUT="$(restic backup --retry-lock 10m --tag vault --no-scan \
      --exclude "$VAULT/data/db.sqlite3" --exclude "$VAULT/data/db.sqlite3-wal" --exclude "$VAULT/data/db.sqlite3-shm" \
      --exclude "$VAULT/data/icon_cache" --exclude "$VAULT/data/tmp" --exclude "$VAULT/tailscale" \
      "$VAULT" 2>&1)"; then
  echo "$OUT" >> "$LOG"; alert "this hour's backup failed. See ~/AppHub/logs/vault-backup.log"; exit 1
fi
log "Backed up: $(echo "$OUT" | grep -E '^snapshot' | head -n 1)"

# 3. Thin out old copies, once a day (the first run after 3 am).
STAMP="$HUB_DIR/state/vault-backup.forget"
if [[ "$(cat "$STAMP" 2>/dev/null)" != "$(date +%F)" && "$(date +%H)" -ge 3 ]]; then
  if OUT="$(restic forget --retry-lock 10m --tag vault --keep-hourly 48 --keep-daily 30 --keep-monthly 12 --prune 2>&1)"; then
    mkdir -p "$(dirname "$STAMP")"; date +%F > "$STAMP"; log "Cleared out old hourly copies."
  else
    echo "$OUT" >> "$LOG"; alert "clearing out old hourly copies failed. See ~/AppHub/logs/vault-backup.log"
  fi
fi
