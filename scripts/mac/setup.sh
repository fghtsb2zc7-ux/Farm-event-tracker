#!/bin/bash
# Fehr Grown Farm Log: one-time setup on the Mac mini.
#
# What it does:
#   1. Downloads PocketBase (the open-source server) into ~/FarmLog/bin
#   2. Creates your admin (owner) account
#   3. Installs a background service that starts the Farm Log at boot and restarts it if it stops
#   4. Optionally keeps the Mac awake and restarts it after a power cut
#
# Run it from the project folder:   bash scripts/mac/setup.sh
# It's safe to run again (for example to update PocketBase): it replaces the program, never your data.

set -euo pipefail

PB_VERSION="0.40.4"
LABEL="ca.fehrgrownfarms.farmlog"
PORT="8090"

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
HOME_DIR="$HOME/FarmLog"
BIN="$HOME_DIR/bin/pocketbase"
DATA_DIR="$HOME_DIR/pb_data"
LOG_DIR="$HOME_DIR/logs"
PLIST="/Library/LaunchDaemons/$LABEL.plist"

say() { printf "\n\033[1m%s\033[0m\n" "$*"; }

if [[ "$(uname)" != "Darwin" ]]; then echo "This script is for macOS (the Mac mini)."; exit 1; fi
case "$REPO_DIR" in
  "$HOME/Documents"*|"$HOME/Desktop"*|"$HOME/Downloads"*|"$HOME/Library/Mobile Documents"*)
    echo "macOS doesn't let background services read the Documents, Desktop, Downloads or iCloud folders."
    echo "Move the project folder to your home folder (for example $HOME/Farm-event-tracker) and run this again."
    exit 1 ;;
esac

case "$(uname -m)" in
  arm64) ARCH="arm64" ;;
  x86_64) ARCH="amd64" ;;
  *) echo "Unsupported Mac processor: $(uname -m)"; exit 1 ;;
esac

say "1/4  Downloading PocketBase $PB_VERSION for this Mac ($ARCH)"
mkdir -p "$HOME_DIR/bin" "$DATA_DIR" "$LOG_DIR"
TMP="$(mktemp -d)"
ZIP="pocketbase_${PB_VERSION}_darwin_${ARCH}.zip"
BASE_URL="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}"
curl -fL --progress-bar -o "$TMP/$ZIP" "$BASE_URL/$ZIP"
curl -fsSL -o "$TMP/checksums.txt" "$BASE_URL/checksums.txt"
EXPECTED="$(grep " $ZIP\$" "$TMP/checksums.txt" | awk '{print $1}')"
ACTUAL="$(shasum -a 256 "$TMP/$ZIP" | awk '{print $1}')"
if [[ -z "$EXPECTED" || "$EXPECTED" != "$ACTUAL" ]]; then
  echo "The download didn't match PocketBase's published checksum. Stopping to be safe."; exit 1
fi
unzip -oq "$TMP/$ZIP" pocketbase -d "$TMP"
install -m 755 "$TMP/pocketbase" "$BIN"
rm -rf "$TMP"
echo "Installed $("$BIN" --version)"

say "2/4  Admin account"
echo "This is the owner login for the admin dashboard (adding people, resetting passwords, backups)."
echo "It is separate from the logins your team uses in the app."
if [[ -f "$DATA_DIR/data.db" ]] && [[ "${1:-}" != "--new-admin" ]]; then
  echo "An existing Farm Log database was found, so the admin account is left as it is."
  echo "(Run with --new-admin to add or reset one.)"
else
  read -r -p "Admin email: " ADMIN_EMAIL
  while true; do
    read -r -s -p "Admin password (at least 10 characters): " ADMIN_PASS; echo
    read -r -s -p "Type it again: " ADMIN_PASS2; echo
    [[ "$ADMIN_PASS" == "$ADMIN_PASS2" && ${#ADMIN_PASS} -ge 10 ]] && break
    echo "Those didn't match or were too short. Try again."
  done
  "$BIN" superuser upsert "$ADMIN_EMAIL" "$ADMIN_PASS" --dir="$DATA_DIR" >/dev/null
  echo "Admin account saved."
fi

say "3/4  Installing the background service (asks for your Mac password)"
TMP_PLIST="$(mktemp)"
cat > "$TMP_PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>UserName</key><string>$(id -un)</string>
  <key>ProgramArguments</key>
  <array>
    <string>$BIN</string>
    <string>serve</string>
    <string>--http=127.0.0.1:$PORT</string>
    <string>--dir=$DATA_DIR</string>
    <string>--hooksDir=$REPO_DIR/server/pb_hooks</string>
    <string>--migrationsDir=$REPO_DIR/server/pb_migrations</string>
    <string>--publicDir=$REPO_DIR/server/pb_public</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict><key>TZ</key><string>America/Toronto</string></dict>
  <key>WorkingDirectory</key><string>$HOME_DIR</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$LOG_DIR/farmlog.log</string>
  <key>StandardErrorPath</key><string>$LOG_DIR/farmlog.log</string>
</dict>
</plist>
PLIST
sudo launchctl bootout system "$PLIST" 2>/dev/null || true
sudo install -m 644 -o root -g wheel "$TMP_PLIST" "$PLIST"
rm -f "$TMP_PLIST"
sudo launchctl bootstrap system "$PLIST"

printf "Starting"
for _ in $(seq 1 30); do
  if curl -fs "http://127.0.0.1:$PORT/api/health" >/dev/null; then echo " … running."; break; fi
  printf "."; sleep 1
done
curl -fs "http://127.0.0.1:$PORT/api/health" >/dev/null || { echo; echo "It didn't start. The log is at $LOG_DIR/farmlog.log"; exit 1; }

say "4/4  Keep the Mac mini available"
read -r -p "Stop this Mac from sleeping and restart it automatically after a power cut? [Y/n] " ANSWER
if [[ ! "$ANSWER" =~ ^[Nn] ]]; then
  sudo pmset -a sleep 0 disksleep 0 autorestart 1
  echo "Done. (The display can still turn off.)"
fi

say "The Farm Log is running on this Mac."
cat <<DONE
  App:              http://127.0.0.1:$PORT
  Admin dashboard:  http://127.0.0.1:$PORT/_/
  Your data:        $DATA_DIR   (nightly backups in $DATA_DIR/backups)
  Log file:         $LOG_DIR/farmlog.log

Next: put it online for the team with Tailscale Funnel:
  bash scripts/mac/share-online.sh
DONE
