#!/bin/bash
# Adds a login for the app itself (the admin account only works in the admin dashboard at /_/).
# Run on the Mac mini:
#   bash scripts/mac/add-user.sh shop     (Rough Cut Dezigns Orders)
#   bash scripts/mac/add-user.sh          (Farm Log)
# Running it again with the same email resets that person's password.

set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/apps.sh"
app_config "${1:-farm}" || exit 1
API="${APP_API:-http://127.0.0.1:$PORT}/api"

if ! curl -fs "$API/health" >/dev/null; then
  echo "The $APP_NAME isn't running on this Mac. Run: bash scripts/mac/setup.sh $APP"; exit 1
fi
json() { local s="${1//\\/\\\\}"; s="${s//\"/\\\"}"; printf '"%s"' "$s"; }
field() { sed -nE "s/.*\"$1\": *\"([^\"]*)\".*/\\1/p" | head -n 1; }

echo "First, the $APP_NAME admin account (the one you made with setup.sh):"
read -r -p "  Admin email: " ADMIN_EMAIL
read -r -s -p "  Admin password: " ADMIN_PASS; echo
TOKEN="$(curl -s -X POST "$API/collections/_superusers/auth-with-password" -H 'Content-Type: application/json' \
  -d "{\"identity\":$(json "$ADMIN_EMAIL"),\"password\":$(json "$ADMIN_PASS")}" | field token)"
if [[ -z "$TOKEN" ]]; then
  echo "That admin email and password didn't work for the $APP_NAME."
  echo "To reset them: bash scripts/mac/setup.sh $APP --new-admin"; exit 1
fi

echo
echo "Now the login to add (this is what you type on the phone):"
read -r -p "  Their name: " NAME
read -r -p "  Their email: " EMAIL
while true; do
  read -r -s -p "  Password for them (at least 8 characters): " PASS; echo
  read -r -s -p "  Type it again: " PASS2; echo
  [[ "$PASS" == "$PASS2" && ${#PASS} -ge 8 ]] && break
  echo "  Those didn't match or were too short. Try again."
done

BODY="{\"email\":$(json "$EMAIL"),\"name\":$(json "$NAME"),\"password\":$(json "$PASS"),\"passwordConfirm\":$(json "$PASS"),\"verified\":true}"
EXISTING="$(curl -s -G "$API/collections/users/records" -H "Authorization: $TOKEN" \
  --data-urlencode "filter=email=$(json "$EMAIL")" | field id)"
if [[ -n "$EXISTING" ]]; then
  OUT="$(curl -s -w '\n%{http_code}' -X PATCH "$API/collections/users/records/$EXISTING" -H "Authorization: $TOKEN" -H 'Content-Type: application/json' -d "$BODY")"
  WHAT="updated (new password set)"
else
  OUT="$(curl -s -w '\n%{http_code}' -X POST "$API/collections/users/records" -H "Authorization: $TOKEN" -H 'Content-Type: application/json' -d "$BODY")"
  WHAT="added"
fi
if [[ "$(tail -n 1 <<< "$OUT")" == 200 ]]; then
  echo
  echo "Login $WHAT for $EMAIL. Sign in to the $APP_NAME with that email and password."
else
  echo "Couldn't save the login. The server said:"; head -n 1 <<< "$OUT"; exit 1
fi
