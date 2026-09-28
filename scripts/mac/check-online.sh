#!/bin/bash
# Checks each app the way other phones and computers reach it: over the public internet through
# Tailscale Funnel, not through this Mac's own private Tailscale connection.
# Run on the Mac mini:  bash scripts/mac/check-online.sh

set -uo pipefail
source "$(cd "$(dirname "$0")" && pwd)/apps.sh"

TS="/Applications/Tailscale.app/Contents/MacOS/Tailscale"
[[ -x "$TS" ]] || TS="$(command -v tailscale || true)"
[[ -n "$TS" ]] || { echo "Tailscale isn't installed on this Mac."; exit 1; }

HOST="$("$TS" status --json 2>/dev/null | grep -o '"DNSName": *"[^"]*"' | head -n 1 | sed -E 's/.*"([^"]*)"$/\1/; s/\.$//')"
[[ -n "$HOST" ]] || { echo "Tailscale isn't signed in or running on this Mac. Open the Tailscale app and sign in."; exit 1; }
echo "This Mac's Tailscale name: $HOST"
echo
echo "Tailscale Funnel settings (what's shared publicly):"
FUNNEL="$("$TS" funnel status 2>&1)"
echo "$FUNNEL" | sed 's/^/  /'
echo

# The public address other devices look up (asks public DNS servers, not Tailscale's private one).
PUBLIC_IP=""
for dns in 1.1.1.1 8.8.8.8; do
  PUBLIC_IP="$(dig +short +time=3 +tries=1 @"$dns" "$HOST" A 2>/dev/null | grep -E '^[0-9]+(\.[0-9]+){3}$' | head -n 1)"
  [[ -n "$PUBLIC_IP" ]] && break
done

PROBLEM=0
APPS="$(installed_apps)"; APPS="${APPS:-farm}"
for a in $APPS; do
  app_config "$a"
  URL="https://$HOST${FUNNEL_PATH%/}/"
  printf "\033[1m%s\033[0m  %s\n" "$APP_NAME" "$URL"
  if curl -fs --max-time 5 "http://127.0.0.1:$PORT/api/health" >/dev/null; then echo "  running on this Mac: yes"
  else echo "  running on this Mac: NO. Restart it: sudo launchctl kickstart -k system/$LABEL"; PROBLEM=1; echo; continue; fi
  # Tailscale lists the address as "https://<name> (Funnel on)" or "(tailnet only)", then one
  # "|-- <path> proxy http://127.0.0.1:<port>" line per app.
  SHARED="$(echo "$FUNNEL" | grep -F "https://$HOST (" | head -n 1)"
  if [[ -z "$SHARED" ]] || ! echo "$FUNNEL" | grep -Eq -- "-- $FUNNEL_PATH +proxy http://(127\.0\.0\.1|localhost):$PORT"; then
    echo "  shared publicly: NO (it isn't in the Funnel settings above)"; PROBLEM=1; echo; continue
  elif [[ "$SHARED" != *"Funnel on"* ]]; then
    echo "  shared publicly: NO (it's shared with your own Tailscale devices only, which is why it works on this Mac)"; PROBLEM=1; echo; continue
  fi
  echo "  shared publicly: yes"
  if [[ -z "$PUBLIC_IP" ]]; then
    echo "  reachable from the internet: NO (public DNS doesn't know $HOST, so Funnel isn't on for this Mac)"
    PROBLEM=1; echo; continue
  fi
  if curl -fsS --max-time 20 --resolve "$HOST:443:$PUBLIC_IP" "${URL}api/health" >/dev/null 2>&1; then
    echo "  reachable from the internet: yes"
  else
    echo "  reachable from the internet: NO"
    PROBLEM=1
  fi
  echo
done

if [[ $PROBLEM == 0 ]]; then
  echo "Everything answers from the internet. If a phone still can't open it:"
  echo "  - check the address letter by letter, including https:// and /shop/ for the shop"
  echo "  - on that phone, open the address in a private tab (an old saved copy can get in the way)"
else
  echo "To fix: bash scripts/mac/share-online.sh <app>   (farm or shop), then run this check again."
fi
exit $PROBLEM
