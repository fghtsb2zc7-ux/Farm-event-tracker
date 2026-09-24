#!/bin/bash
# Gives the Farm Log a secure web address with Tailscale Funnel, so phones can reach it anywhere.
# Needs the Tailscale app installed and signed in on this Mac first (see docs/MAC-MINI-SETUP.md).
#
# Run:  bash scripts/mac/share-online.sh
# Stop sharing any time with:  tailscale funnel --https=443 off

set -euo pipefail
PORT="8090"

TS="$(command -v tailscale || true)"
[[ -z "$TS" && -x "/Applications/Tailscale.app/Contents/MacOS/Tailscale" ]] && TS="/Applications/Tailscale.app/Contents/MacOS/Tailscale"
if [[ -z "$TS" ]]; then
  echo "Tailscale isn't installed. Install it from https://tailscale.com/download/mac, sign in, then run this again."
  exit 1
fi
if ! curl -fs "http://127.0.0.1:$PORT/api/health" >/dev/null; then
  echo "The Farm Log isn't running on this Mac yet. Run: bash scripts/mac/setup.sh"
  exit 1
fi

echo "Turning on Tailscale Funnel for the Farm Log…"
echo "If this is the first time, Tailscale prints a link to approve HTTPS and Funnel for your account."
echo "Open it, approve, then run this script again."
echo
"$TS" funnel --bg "$PORT"
echo
"$TS" funnel status
echo
echo "The https://….ts.net address above is the Farm Log's address. Share it with the team."
