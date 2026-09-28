#!/bin/bash
# Gives an app a secure web address with Tailscale Funnel, so phones can reach it anywhere.
# Needs the Tailscale app installed and signed in on this Mac first (see docs/MAC-MINI-SETUP.md).
#
# Run:  bash scripts/mac/share-online.sh          (Farm Log:  https://<mac>.<tailnet>.ts.net/)
#       bash scripts/mac/share-online.sh shop     (Rough Cut Dezigns Orders:  https://<mac>.<tailnet>.ts.net/shop/)
# Stop sharing an app with:  tailscale funnel --https=443 --set-path=/shop off   (or without --set-path for the farm)

set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/apps.sh"
app_config "${1:-farm}" || exit 1

# Prefer the command-line tool inside the Tailscale app, so it always matches the running app's version.
# (An older separate copy, e.g. from Homebrew, triggers "client version != tailscaled server version" warnings.)
TS="/Applications/Tailscale.app/Contents/MacOS/Tailscale"
[[ -x "$TS" ]] || TS="$(command -v tailscale || true)"
if [[ -z "$TS" ]]; then
  echo "Tailscale isn't installed. Install it from https://tailscale.com/download/mac, sign in, then run this again."
  exit 1
fi
if ! curl -fs "http://127.0.0.1:$PORT/api/health" >/dev/null; then
  echo "The $APP_NAME isn't running on this Mac yet. Run: bash scripts/mac/setup.sh $APP"
  exit 1
fi

echo "Turning on Tailscale Funnel for the $APP_NAME…"
echo "If this is the first time, Tailscale prints a link to approve HTTPS and Funnel for your account."
echo "Open it, approve, then run this script again."
echo
"$TS" funnel --bg --https=443 --set-path="$FUNNEL_PATH" "http://127.0.0.1:$PORT"
if [[ "$APP" == shop ]]; then
  # The shop used to be shared on :8443, which some networks block. That's replaced by /shop.
  "$TS" funnel --https=8443 off >/dev/null 2>&1 || true
fi
echo
echo "Checking it from the internet, the way other phones and computers reach it…"
echo "(The first time, the security certificate can take a minute or two. If it says NO, wait and run this again.)"
echo
bash "$(cd "$(dirname "$0")" && pwd)/check-online.sh"
