#!/bin/bash
# Nightly encrypted backup of the apps' data to the ServerBackup drive, with restic (installed by enable-backup.sh).
#
#  1. Skips (and texts you) if the ServerBackup drive isn't plugged in.
#  2. Copies the photo library's database out of Docker into ~/ServerData/dumps.
#  3. Backs up the Farm Log, the shop, the App Hub (once set up), ~/ServerData and Jellyfin's settings.
#     Not the movies, shows and music in ~/ServerData/media (too big; you can get them again), nor the
#     photo library's thumbnails and converted videos (Immich makes them again from the originals).
#  4. Keeps 14 daily, 8 weekly and 12 monthly copies and frees the space of older ones.
#  5. On Sundays, checks that a sample of the backup can still be read back.
#  6. Texts you if anything fails or the drive is over 80% full.
#
# Everything is written to ~/AppHub/logs/backup.log. Safe to run by hand any time:
#   bash homeserver/backup/backup.sh
# The backup is encrypted. Its password is in ~/ServerData/secrets/restic-password: keep a copy off this Mac.

set -uo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
source "$REPO/scripts/mac/apps.sh"

DRIVE="${BACKUP_DRIVE:-/Volumes/ServerBackup}"
SERVER_DATA="${SERVER_DATA:-$HOME/ServerData}"
export RESTIC_REPOSITORY="${RESTIC_REPOSITORY:-$DRIVE/restic}"
export RESTIC_PASSWORD_FILE="${RESTIC_PASSWORD_FILE:-$SERVER_DATA/secrets/restic-password}"
LOG="${BACKUP_LOG:-$HUB_DIR/logs/backup.log}"
FULL_PERCENT=80
PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

mkdir -p "$(dirname "$LOG")"
log() { echo "$(date '+%Y-%m-%d %H:%M:%S')  $*" >> "$LOG"; }
# Texts your iPhone, once the watchdog's alerts are set up (enable-watchdog.sh).
alert() {
  log "Problem: $1"
  [[ -f "$HUB_DIR/notify.conf" ]] || return 0
  bash "$REPO/scripts/mac/notify.sh" "Backup: $1" >> "$LOG" 2>&1 || log "Couldn't send a text about it."
}

if ! command -v restic >/dev/null; then alert "restic isn't installed. Run: brew install restic"; exit 1; fi
if [[ ! -d "$RESTIC_REPOSITORY" ]]; then
  alert "the ServerBackup drive isn't plugged in (or has no backup folder), so tonight's backup was skipped."
  exit 1
fi
if [[ ! -f "$RESTIC_PASSWORD_FILE" ]]; then alert "the backup password file is missing: $RESTIC_PASSWORD_FILE"; exit 1; fi

# ---- Before backup -------------------------------------------------------------------------------
# Services whose live files can't be copied safely write a dump into ~/ServerData/dumps here first.
DUMPS="$SERVER_DATA/dumps"; mkdir -p "$DUMPS"
DOCKER=/opt/homebrew/bin/docker

# The photo library's (Immich's) database. It lives inside Docker, so copy it out. Immich also keeps its own
# nightly copies in ~/ServerData/photos/library/backups.
if [[ -x "$DOCKER" ]] && "$DOCKER" ps --format '{{.Names}}' 2>/dev/null | grep -qx photos-database-1; then
  if "$DOCKER" exec photos-database-1 pg_dumpall --clean --if-exists --username=postgres 2>>"$LOG" | gzip > "$DUMPS/immich.sql.gz.tmp" \
     && [[ -s "$DUMPS/immich.sql.gz.tmp" ]]; then
    chmod 600 "$DUMPS/immich.sql.gz.tmp"; mv "$DUMPS/immich.sql.gz.tmp" "$DUMPS/immich.sql.gz"
    log "Copied the photo library's database ($(du -h "$DUMPS/immich.sql.gz" | cut -f1))."
  else
    rm -f "$DUMPS/immich.sql.gz.tmp"
    alert "couldn't copy the photo library's database before the backup. Last night's copy (if any) is still in the backup."
  fi
fi

# The password manager: a fresh, checked copy of its database (it's also backed up every hour).
if [[ -d "$SERVER_DATA/vault/data" ]]; then
  bash "$REPO/homeserver/backup/vault-backup.sh" --copy-only || alert "couldn't copy the password manager's database. Its hourly backups still have recent copies."
fi

# ---- What to back up -----------------------------------------------------------------------------
# Each app's pb_data includes PocketBase's own nightly backup zips (3:00 farm, 3:15 shop), which are
# always consistent, so this runs after them at 3:45.
SOURCES=()
for a in $ALL_APPS; do
  app_config "$a"
  [[ -d "$HOME_DIR/pb_data" ]] && SOURCES+=("$HOME_DIR/pb_data")
done
[[ -d "$SERVER_DATA" ]] && SOURCES+=("$SERVER_DATA")
JELLYFIN="$HOME/Library/Application Support/jellyfin"   # Jellyfin's settings, users and watch history
[[ -d "$JELLYFIN" ]] && SOURCES+=("$JELLYFIN")

log "Backing up: ${SOURCES[*]/#$HOME/~}"
if ! OUT="$(restic backup --retry-lock 10m --no-scan --tag nightly \
      --exclude '*.tmp' --exclude '.DS_Store' --exclude "$SERVER_DATA/cache" \
      --exclude "$SERVER_DATA/media" \
      --exclude "$SERVER_DATA/photos/library/thumbs" --exclude "$SERVER_DATA/photos/library/encoded-video" \
      --exclude "$JELLYFIN/metadata" --exclude "$JELLYFIN/log" \
      --exclude "$SERVER_DATA/vault/data/db.sqlite3" --exclude "$SERVER_DATA/vault/data/db.sqlite3-wal" \
      --exclude "$SERVER_DATA/vault/data/db.sqlite3-shm" --exclude "$SERVER_DATA/vault/data/icon_cache" \
      "${SOURCES[@]}" 2>&1)"; then
  echo "$OUT" >> "$LOG"
  alert "tonight's backup failed. See ~/AppHub/logs/backup.log"
  exit 1
fi
echo "$OUT" | grep -E '^(Added to the repository|processed|snapshot)' | sed 's/^/    /' >> "$LOG"

# ---- Keep 14 daily, 8 weekly, 12 monthly ---------------------------------------------------------
if ! OUT="$(restic forget --tag nightly --keep-daily 14 --keep-weekly 8 --keep-monthly 12 --prune 2>&1)"; then
  echo "$OUT" >> "$LOG"
  alert "clearing out old backups failed. See ~/AppHub/logs/backup.log"
fi

# ---- Sundays: read back a sample to make sure the backup is healthy -----------------------------
if [[ "$(date +%u)" == 7 || "${BACKUP_CHECK:-}" == 1 ]]; then
  if OUT="$(restic check --read-data-subset=5% 2>&1)"; then
    log "Weekly check: OK"
  else
    echo "$OUT" >> "$LOG"
    alert "the weekly backup check found a problem. See ~/AppHub/logs/backup.log"
  fi
fi

# ---- Drive space ---------------------------------------------------------------------------------
USED="$(df -P "$DRIVE" | awk 'NR==2 {gsub("%","",$5); print $5}')"
if [[ -n "$USED" ]] && (( USED > FULL_PERCENT )); then
  alert "the ServerBackup drive is ${USED}% full. Time to get a bigger drive (see docs/BACKUPS.md)."
fi

log "Done. ServerBackup drive is ${USED:-?}% full."
