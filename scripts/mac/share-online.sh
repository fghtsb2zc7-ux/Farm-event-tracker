#!/bin/bash
# Gives an app a secure web address with Tailscale Funnel, so phones can reach it anywhere.
# Needs the Tailscale app installed and signed in on this Mac first (see docs/MAC-MINI-SETUP.md).
#
# Run:  bash scripts/mac/share-online.sh          (Farm Log:  https://<mac>.ts.net)
#       bash scripts/mac/share-online.sh shop     (Rough Cut Dezigns Orders:  https://<mac>.ts.net:8443)
# Stop sharing any time with:  tailscale funnel --https=443 off   (or --https=8443 off for the shop)

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
"$TS" funnel --bg --https="$FUNNEL_PORT" "$PORT"
echo
"$TS" funnel status
echo
# This Mac's full Tailscale name, e.g. kierans-mini.tail1234.ts.net (the first DNSName in the status is this Mac's).
HOST="$("$TS" status --json 2>/dev/null | grep -o '"DNSName": *"[^"]*"' | head -n 1 | sed -E 's/.*"([^"]*)"$/\1/; s/\.$//')"
URL="https://$HOST"; [[ "$FUNNEL_PORT" != "443" ]] && URL="$URL:$FUNNEL_PORT"
if [[ -n "$HOST" ]]; then
  echo "Checking it answers from the internet…"
  if curl -fsS --max-time 20 "$URL/api/health" >/dev/null 2>&1; then echo "  yes, it's online."
  else echo "  not yet. The first time can take a minute or two while the security certificate is made; run this script again then."; fi
  echo
  printf "\033[1mThe %s's address:  %s\033[0m\n" "$APP_NAME" "$URL"
  echo "Type or paste it exactly, including https:// and the whole name$([[ "$FUNNEL_PORT" != "443" ]] && echo " and the :$FUNNEL_PORT on the end")."
else
  echo "Couldn't read this Mac's Tailscale name. The address is the https://….ts.net one above$([[ "$FUNNEL_PORT" != "443" ]] && echo ", with :$FUNNEL_PORT on the end")."
fi
