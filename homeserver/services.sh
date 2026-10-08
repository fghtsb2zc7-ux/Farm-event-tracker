# The container (Docker) services this Mac mini runs, for the watchdog, the agent and update.sh.
# scripts/mac/apps.sh reads this file if it's there. The Farm Log and the shop aren't listed here:
# they run without Docker (see scripts/mac/apps.sh).
#
# One line per service, separated by spaces:
#   name     stack     health URL (checked from this Mac)             Tailscale name   public?
# Example:
#   photos   photos    https://photos.taild086ea.ts.net/api/server/ping   photos         no

CONTAINER_SERVICES="
"

# Stacks that update.sh never updates by itself (update these by hand, after reading the release notes).
NO_AUTO_UPDATE="photos"

# Prints one line per service, without the comments and blank lines.
container_services() {
  echo "$CONTAINER_SERVICES" | sed '/^[[:space:]]*$/d; /^[[:space:]]*#/d'
}
