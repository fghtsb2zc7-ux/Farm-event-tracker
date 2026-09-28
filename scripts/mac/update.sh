#!/bin/bash
# Gets the latest version from GitHub and restarts every app installed on this Mac. Your data is not touched.
# Run from the project folder:  bash scripts/mac/update.sh

set -euo pipefail
cd "$(dirname "$0")/../.."
source scripts/mac/apps.sh

echo "Downloading the latest version…"
git pull --ff-only

STATUS=0
for a in $(installed_apps); do
  app_config "$a"
  echo "Restarting the $APP_NAME (may ask for your Mac password)…"
  sudo launchctl kickstart -k "system/$LABEL"
  ok=""
  for _ in $(seq 1 30); do
    if curl -fs "http://127.0.0.1:$PORT/api/health" >/dev/null; then ok=1; break; fi
    sleep 1
  done
  if [[ -n "$ok" ]]; then echo "  running."; else echo "  It didn't come back up. Check $HOME_DIR/logs/$LOG_NAME"; STATUS=1; fi
done
[[ $STATUS == 0 ]] && echo "Updated. Phones pick up the new version the next time the app is opened."
exit $STATUS
