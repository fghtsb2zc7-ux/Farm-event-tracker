#!/bin/bash
# Gets the latest Farm Log from GitHub and restarts it. Your data is not touched.
# Run from the project folder:  bash scripts/mac/update.sh

set -euo pipefail
LABEL="ca.fehrgrownfarms.farmlog"
cd "$(dirname "$0")/../.."

echo "Downloading the latest version…"
git pull --ff-only

echo "Restarting the Farm Log (asks for your Mac password)…"
sudo launchctl kickstart -k "system/$LABEL"

for _ in $(seq 1 30); do
  if curl -fs "http://127.0.0.1:8090/api/health" >/dev/null; then
    echo "Updated and running. Phones pick up the new version the next time the app is opened."
    exit 0
  fi
  sleep 1
done
echo "It didn't come back up. Check ~/FarmLog/logs/farmlog.log"
exit 1
