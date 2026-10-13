# The container (Docker) services this Mac mini runs, for the watchdog, the agent and update.sh.
# scripts/mac/apps.sh reads this file if it's there. The Farm Log and the shop aren't listed here:
# they run without Docker (see scripts/mac/apps.sh).
#
# One line per service, separated by spaces:
#   name     stack     health URL (checked from this Mac)             Tailscale name   public?
# Example:
#   photos   photos    https://photos.taild086ea.ts.net/api/server/ping   photos         no

CONTAINER_SERVICES="
ntfy          core   https://ntfy.taild086ea.ts.net/v1/health   ntfy     no
uptime-kuma   core   https://status.taild086ea.ts.net/          status   no
scan-notes    scannotes   https://scannotes.taild086ea.ts.net/api/health   scannotes   no
caddy         core   https://apps.taild086ea.ts.net/auth/api/health   apps   yes
immich-server photos https://photos.taild086ea.ts.net/api/server/ping   photos   no
media-tailscale core https://media.taild086ea.ts.net/health   media   no
"

# Stacks that update.sh never updates by itself (update these by hand, after reading the release notes).
NO_AUTO_UPDATE="photos scannotes"   # scannotes: built on this Mac, see its compose.yaml

# Prints one line per service, without the comments and blank lines.
container_services() {
  echo "$CONTAINER_SERVICES" | sed '/^[[:space:]]*$/d; /^[[:space:]]*#/d'
}
