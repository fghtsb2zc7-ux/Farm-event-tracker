#!/bin/bash
# Gives a friend or family member a login for the apps at https://apps.taild086ea.ts.net (see docs/ACCESS.md).
# Run on the Mac mini:
#   bash homeserver/scripts/add-person.sh                  add someone (or give them a new password)
#   bash homeserver/scripts/add-person.sh --list           who has a login, and their groups
#   bash homeserver/scripts/add-person.sh --remove <user>  take someone's login away
# It shows a temporary password once, on this screen: give it to them yourself (in person or by phone).
# Only a scrambled (hashed) copy is stored. Nothing is sent anywhere.

set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
USERS="${SERVERDATA:-$HOME/ServerData}/authelia/data/users_database.yml"
IMAGE="authelia/authelia:4.39.28"
GROUPS_KNOWN="family friends"

# The people file is plain JSON (which is also valid YAML, the format Authelia reads).
users() { python3 -I - "$USERS" "$@" <<'PY'
import json, os, sys
path, cmd, args = sys.argv[1], sys.argv[2], sys.argv[3:]
try:
    with open(path) as f: db = json.load(f)
except FileNotFoundError:
    db = {"users": {}}
u = db.setdefault("users", {})
if cmd == "list":
    u = {k: v for k, v in u.items() if k != "placeholder"}
    for name, p in sorted(u.items()):
        print(f"  {name:<14} {p.get('displayname',''):<20} {p.get('email',''):<30} {', '.join(p.get('groups', []))}")
    if not u: print("  nobody yet")
    sys.exit(0)
if cmd == "has":
    sys.exit(0 if args[0] in u else 1)
if cmd == "empty":
    sys.exit(0 if not u else 1)
if cmd == "remove":
    if args[0] not in u: sys.exit(f"There's no login called {args[0]}.")
    del u[args[0]]
elif cmd == "placeholder":   # Authelia won't start with nobody in the list: a locked account that can't sign in
    u["placeholder"] = {"disabled": True, "displayname": "Placeholder", "email": "nobody@localhost",
                        "groups": [], "password": os.environ["HASH"]}
elif cmd == "set":
    u.pop("placeholder", None)
    user, name, email, groups = args[0], args[1], args[2], [g for g in args[3].split(",") if g]
    u[user] = {"disabled": False, "displayname": name, "email": email, "groups": groups,
               "password": os.environ["HASH"]}
tmp = path + ".tmp"
with open(os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), "w") as f:
    json.dump(db, f, indent=2)
os.replace(tmp, path)
PY
}

mkdir -p "$(dirname "$USERS")"
case "${1:-}" in
  --list) echo "Logins (username, name, email, groups):"; users list; exit 0 ;;
  --remove)
    [[ -n "${2:-}" ]] || { echo "Usage: bash homeserver/scripts/add-person.sh --remove <username>"; exit 1; }
    users remove "$2"
    if users empty; then
      HASH="$(docker run --rm "$IMAGE" authelia crypto hash generate argon2 --password "$(openssl rand -hex 32)" | sed -n 's/^Digest: //p')"
      HASH="$HASH" users placeholder
    fi
    echo "Removed $2. They're signed out within a minute and can't sign in again."
    exit 0 ;;
  "") ;;
  *) sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac

docker info >/dev/null 2>&1 || { echo "Docker isn't running. Start it with: colima start"; exit 1; }

read -r -p "Their name (e.g. Jane Fehr): " NAME
read -r -p "Their email (setup codes are sent here): " EMAIL
[[ "$EMAIL" == *@*.* ]] || { echo "That doesn't look like an email address."; exit 1; }
DEFAULT_USER="$(echo "${EMAIL%%@*}" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9._-')"
read -r -p "Username [$DEFAULT_USER]: " USERNAME; USERNAME="${USERNAME:-$DEFAULT_USER}"
[[ "$USERNAME" =~ ^[a-z0-9._-]+$ ]] || { echo "Use only small letters, numbers, dots or dashes."; exit 1; }
echo "Groups decide which apps they can open: $GROUPS_KNOWN"
read -r -p "Groups (separate with commas) [family]: " GRP; GRP="$(echo "${GRP:-family}" | tr -d ' ' | tr '[:upper:]' '[:lower:]')"
for g in ${GRP//,/ }; do
  [[ " $GROUPS_KNOWN " == *" $g "* ]] || echo "Note: '$g' isn't one of the usual groups ($GROUPS_KNOWN). Keeping it anyway."
done
if users has "$USERNAME"; then echo "$USERNAME already has a login: this gives them a new temporary password."; fi

PW="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-16)"
HASH="$(docker run --rm "$IMAGE" authelia crypto hash generate argon2 --password "$PW" | sed -n 's/^Digest: //p')"
[[ "$HASH" == \$argon2* ]] || { echo "Couldn't scramble the password. Nothing was changed."; exit 1; }
HASH="$HASH" users set "$USERNAME" "$NAME" "$EMAIL" "$GRP"

echo
echo "Done. Give $NAME these, in person or by phone (not by email or text):"
echo "  Address:   https://apps.taild086ea.ts.net"
echo "  Username:  $USERNAME"
echo "  Password:  $PW"
echo "The first time, they'll set up a second step (an authenticator app or a passkey);"
echo "a code for that is emailed to $EMAIL. This password isn't shown again."
