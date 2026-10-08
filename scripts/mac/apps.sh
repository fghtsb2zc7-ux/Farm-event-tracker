# Settings for each app this Mac mini runs, shared by the scripts in this folder.
#   farm: Fehr Grown Farm Log         (port 8090, public at https://<mac>.<tailnet>.ts.net/)
#   shop: Rough Cut Dezigns Orders    (port 8091, public at https://<mac>.<tailnet>.ts.net/shop/)
#   hub:  App Hub control panel       (port 8092, public at https://<mac>.<tailnet>.ts.net/hub/)
# All share the one standard https address (other ports such as :8443 are blocked on some networks);
# Tailscale Funnel sends /shop/… to the shop with the /shop part removed (and /hub/… to the hub).
# Adding another app later: add a block below plus its own folder like server/ or shop/.

ALL_APPS="farm shop hub"

app_config() {
  case "${1:-farm}" in
    farm) APP=farm; APP_NAME="Farm Log"; LABEL="ca.fehrgrownfarms.farmlog"; PORT=8090; FUNNEL_PATH=/
          HOME_DIR="$HOME/FarmLog"; SRC_DIR=server; LOG_NAME=farmlog.log ;;
    shop) APP=shop; APP_NAME="Rough Cut Dezigns Orders"; LABEL="ca.roughcutdezigns.orders"; PORT=8091; FUNNEL_PATH=/shop
          HOME_DIR="$HOME/ShopLog"; SRC_DIR=shop; LOG_NAME=shop.log ;;
    hub)  APP=hub; APP_NAME="App Hub"; LABEL="ca.fehrgrownfarms.apphub"; PORT=8092; FUNNEL_PATH=/hub
          HOME_DIR="$HOME/AppHub"; SRC_DIR=hub; LOG_NAME=hub.log ;;
    *) echo "Unknown app '$1'. Choose one of: $ALL_APPS"; return 1 ;;
  esac
}

# Apps whose background service is installed on this Mac.
installed_apps() {
  local a out=""
  for a in $ALL_APPS; do
    app_config "$a"
    [[ -f "/Library/LaunchDaemons/$LABEL.plist" ]] && out="$out $a"
  done
  echo $out
}

# Lets this user restart the apps' services (and nothing else) without a password, for nightly updates.
write_restart_permission() (  # subshell: leaves the caller's app settings alone
  local a tmp; tmp="$(mktemp)"
  for a in $ALL_APPS; do
    app_config "$a"
    echo "$(id -un) ALL=(root) NOPASSWD: /bin/launchctl kickstart -k system/$LABEL" >> "$tmp"
  done
  if ! sudo visudo -cf "$tmp" >/dev/null; then
    echo "Couldn't create the restart permission. Nothing was changed."; rm -f "$tmp"; return 1
  fi
  sudo install -m 440 -o root -g wheel "$tmp" /etc/sudoers.d/farmlog-restart
  rm -f "$tmp"
)

# Where the App Hub keeps its settings, state and logs (watchdog, alerts).
HUB_DIR="${HUB_DIR:-$HOME/AppHub}"

# Tailscale's command-line tool (the one inside the app, so it matches the running version).
ts_bin() {
  local ts="/Applications/Tailscale.app/Contents/MacOS/Tailscale"
  [[ -x "$ts" ]] || ts="$(command -v tailscale || true)"
  echo "$ts"
}

# This Mac's public Tailscale name, e.g. fehr-farm.tail1234.ts.net (empty if Tailscale isn't signed in).
ts_host() {
  local ts; ts="$(ts_bin)"; [[ -n "$ts" ]] || return 0
  "$ts" status --json 2>/dev/null | grep -o '"DNSName": *"[^"]*"' | head -n 1 | sed -E 's/.*"([^"]*)"$/\1/; s/\.$//'
}

# The address other devices look up for a name (asks public DNS servers, not Tailscale's private one).
public_ip() {
  local dns ip=""
  for dns in 1.1.1.1 8.8.8.8; do
    ip="$(dig +short +time=3 +tries=1 @"$dns" "$1" A 2>/dev/null | grep -E '^[0-9]+(\.[0-9]+){3}$' | head -n 1)"
    [[ -n "$ip" ]] && break
  done
  echo "$ip"
}

# The Docker services, if any (homeserver/services.sh).
if [[ -f "$(dirname "${BASH_SOURCE[0]}")/../../homeserver/services.sh" ]]; then source "$(dirname "${BASH_SOURCE[0]}")/../../homeserver/services.sh"; fi
