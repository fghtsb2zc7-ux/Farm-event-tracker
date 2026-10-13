# Home server: Docker services

The Farm Log and the shop run straight on the Mac mini (see `scripts/mac/`). Everything newer runs in
Docker, in a small Linux machine called **Colima** that lives inside the Mac and starts by itself when
the Mac logs in. Everything here is free and open source.

## What's where

| Where | What |
|---|---|
| `stacks/<stack>/compose.yaml` | One folder per group of services ("stack"): `core`, `photos`, `vault`, `webapps`. |
| `stacks/<stack>/config/` | Settings files for that stack (for example `serve.json`). Copied into `~/ServerData` when it starts. |
| `stacks/<stack>/.env` | Optional settings that stay on the Mac. Never in GitHub (see `.env.example`). |
| `services.sh` | The list of services, so the watchdog and the agent know about them. |
| `templates/service-with-tailscale/` | The starting point for a new service. |
| `scripts/stack.sh` | Start, stop, check, and read the log of a stack. |
| `scripts/update.sh` | Update a stack, and put it back as it was if the update breaks it. |
| `scripts/enable-docker.sh` | Turns on "start Docker and every stack at login". |
| `~/ServerData/<service>/` | Each service's files (on the Mac, not in GitHub). Backed up every night at 3:45 am. |
| `~/ServerData/secrets/` | Passwords and keys, one per file. Never in GitHub. |

Docker can only see `~/ServerData`, not the rest of your home folder.

## Everyday commands

```bash
bash homeserver/scripts/stack.sh status            # what's running
bash homeserver/scripts/stack.sh up vault          # start (or restart) a stack
bash homeserver/scripts/stack.sh down vault        # stop it; its files stay in ~/ServerData
bash homeserver/scripts/stack.sh logs vault        # its recent log
bash homeserver/scripts/stack.sh update vault      # newer images, rolls back if it breaks
bash homeserver/scripts/enable-docker.sh --status  # is start-at-login on?
```

## How to add a service

1. Copy `templates/service-with-tailscale/` into the right stack folder, for example `stacks/vault/`.
2. In `compose.yaml`, replace `myapp` with the service's name, set its image with a version
   number (never `latest`), and point the port in `config/serve.json` at the port the app listens on.
3. Keep its files under `${SERVERDATA}/<name>/` so they're backed up. Put any password in
   `~/ServerData/secrets/<name>-...` (one per file, `chmod 600`), never in the compose file.
4. Add a line for it to `services.sh`.
5. Start it: `bash homeserver/scripts/stack.sh up <stack>`. A minute later it's at
   `https://<name>.taild086ea.ts.net` on any of your devices with Tailscale on.

## Tailscale (one-time setup)

Each service gets its own Tailscale name through a small "sidecar" container. It signs in with a key
saved at `~/ServerData/secrets/ts-authkey`:

1. Tailscale admin console > **Access controls**: add `"tagOwners": {"tag:container": ["autogroup:admin"]},`
   just inside the first `{`, then Save.
2. **Settings > Keys > Generate auth key**: Reusable on, Ephemeral off, Tags: `tag:container`.
3. On the Mac mini, run this, paste the key (nothing shows while you paste) and press Return:
   `(umask 077; read -rs KEY && printf '%s' "$KEY" > ~/ServerData/secrets/ts-authkey) && echo saved`

Services are only reachable from your own devices (`"AllowFunnel": false` in `serve.json`). The one exception
is the public front door, `apps` in the core stack, which makes everyone sign in first (below).

## How to host a new web app (for friends and family)

Web apps go behind the front door at `https://apps.taild086ea.ts.net/<name>`, where everyone signs in with
their own login and a second step (see `docs/ACCESS.md`).

1. In `stacks/webapps/compose.yaml`, copy the commented example: the app's image with a version number,
   `container_name: <name>`, its files under `${SERVERDATA}/<name>/`, and `networks: [web]`.
2. In `stacks/core/config/caddy/Caddyfile`, copy the example `handle` block: change the path to `/<name>*`
   and `reverse_proxy` to `<name>:<port>`. (The app has to work under a path like `/<name>`; most have a
   "base URL" or "sub path" setting for it.)
3. In `stacks/core/config/authelia/configuration.yml`, add a rule for who may open it, for example
   `resources: ['^/<name>([/?].*)?$']` with `subject: ['group:family', 'group:friends']`.
4. Start it: `bash homeserver/scripts/stack.sh up webapps`, then `bash homeserver/scripts/stack.sh up core`.
5. Add a line for it to `services.sh` (health URL `https://apps.taild086ea.ts.net/<name>/...` won't work
   because of the sign-in: use the app's own health page through `docker exec`, or leave the URL out), and a
   monitor on the status page.

An app that can't run under a path can get its own address instead: give it its own Tailscale sidecar
(`templates/service-with-tailscale/`). It's then private to your devices unless you share it (docs/ACCESS.md).
