# Rocket.Chat dev container

A self-contained development environment for this repo, built specifically so that
Claude Code can be run with `--dangerously-skip-permissions` without handing an
unattended agent your whole machine.

The container ships the pinned toolchain (Node/Yarn via Volta, Deno, Meteor,
Neovim), the Claude Code CLI, and a **default-deny egress firewall** that is
re-applied on every container start.

## What makes `--dangerously-skip-permissions` reasonable here

That flag skips every permission prompt, so nothing reviews a tool call before it
runs. Three properties of this container bound the blast radius:

| Property | Where |
| --- | --- |
| Commands execute in the container, not on the host | `docker-compose.yml` (only this repo is bind-mounted) |
| Runs as the non-root `vscode` user — the CLI **refuses** the flag as root | `devcontainer.json` → `remoteUser` |
| Outbound traffic is default-deny, IPv4 allowlist only, IPv6 fully blocked | `init-firewall.sh`, applied via `postStartCommand` |

What it does **not** protect: the workspace itself is a bind mount, so any file
Claude writes lands directly in your host checkout. And anything reachable through
the allowlist — including your Claude Code credentials in `~/.claude` — is still
reachable. Use it on repositories you trust.

## Getting started

Prerequisites: Docker, and either VS Code with the
[Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
or the [`devcontainer` CLI](https://github.com/devcontainers/cli).

1. Open the repo in VS Code → **Dev Containers: Reopen in Container**
   (or `devcontainer up --workspace-folder .`).
   The first build takes a while: it downloads the pinned Meteor distribution.
2. Open a terminal in the container and sign in:

   ```bash
   claude          # follow the browser auth prompt
   ```

   If the browser callback never reaches the container, paste the code shown in
   the browser at the `Paste code here if prompted` prompt.
3. Install dependencies and start the app:

   ```bash
   yarn install
   yarn dev        # http://localhost:3000
   ```
4. From then on, launch the agent with prompts disabled:

   ```bash
   claude --dangerously-skip-permissions
   ```

Watch the `postStartCommand` output on each start — the firewall script verifies
itself and logs `verified: https://example.com is blocked as expected`. If you
don't see that line, the container is not firewalled.

## Layout

| File | Purpose |
| --- | --- |
| `devcontainer.json` | User, mounts, features, post-create/post-start hooks |
| `docker-compose.yml` | Service definition, volumes, `NET_ADMIN`/`NET_RAW` capabilities |
| `Dockerfile` | Base image and toolchain, pinned from `package.json`, `.tool-versions`, `.meteor/release` |
| `init-firewall.sh` | Default-deny egress firewall; installed as `/usr/local/bin/rc-init-firewall.sh` |

## Things worth knowing

**Ports.** `3000` is the app, `3001` is Meteor's bundled mongod. There is no
separate `mongo` service on purpose — `meteor` starts its own mongod, and only
does so while `MONGO_URL` is unset. Don't set it.

**Adding an allowed domain.** Edit the `ALLOWED_DOMAINS` array in
`init-firewall.sh`, then **rebuild** — the script is baked into the image, so
editing it alone does nothing until the image is rebuilt. Confirm the change with
`sudo ipset list allowed-domains`. Anthropic's
[network access requirements](https://code.claude.com/docs/en/network-config#network-access-requirements)
list the domains Claude Code itself needs.

**Persistence.** Claude Code's auth, settings, and history live in a named volume
scoped by `${devcontainerId}`, so they survive rebuilds but aren't shared across
projects. `node_modules` and `apps/meteor/.meteor/local` are also named volumes —
they shadow the bind mount, so your host copies are untouched (and Meteor's
absolute paths don't leak between host and container).

**Neovim.** Your host `~/.config/nvim` is bind-mounted read-only; plugins and
treesitter parsers stay container-side in a volume. If you don't have that
directory on the host, either create it or drop the mount from
`devcontainer.json`.

## Anthropic's documentation

- [Development containers](https://code.claude.com/docs/en/devcontainer) — the reference implementation this setup is adapted from
- [Permission modes](https://code.claude.com/docs/en/permission-modes) — including `auto` mode, if you want fewer prompts without disabling the checks
- [CLI reference](https://code.claude.com/docs/en/cli-reference) — the full flag list
- [Security model](https://code.claude.com/docs/en/security)
- [Sandbox environments](https://code.claude.com/docs/en/sandbox-environments) — how dev containers compare to the built-in Bash sandbox
- [The `.claude` directory](https://code.claude.com/docs/en/claude-directory) — what the persisted volume actually holds
