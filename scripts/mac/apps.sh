# Settings for each app this Mac mini runs, shared by the scripts in this folder.
#   farm: Fehr Grown Farm Log         (port 8090, public at https://<mac>.ts.net)
#   shop: Rough Cut Dezigns Orders    (port 8091, public at https://<mac>.ts.net:8443)
# Adding another app later: add a block below plus its own folder like server/ or shop/.

ALL_APPS="farm shop"

app_config() {
  case "${1:-farm}" in
    farm) APP=farm; APP_NAME="Farm Log"; LABEL="ca.fehrgrownfarms.farmlog"; PORT=8090; FUNNEL_PORT=443
          HOME_DIR="$HOME/FarmLog"; SRC_DIR=server; LOG_NAME=farmlog.log ;;
    shop) APP=shop; APP_NAME="Rough Cut Dezigns Orders"; LABEL="ca.roughcutdezigns.orders"; PORT=8091; FUNNEL_PORT=8443
          HOME_DIR="$HOME/ShopLog"; SRC_DIR=shop; LOG_NAME=shop.log ;;
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
