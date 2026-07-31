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
the allowlist — including your Claude Code credentials in `~/.claude` and the
GitHub token and SSH key in `~/.config/gh` and `~/.ssh` — is still reachable. Use
it on repositories you trust.

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

   Run `gh auth login` here too, in the container and not on the host — once for
   all worktrees, key included (see **Your GitHub login is shared** below).
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
| `init-firewall.sh` | Default-deny egress firewall; run from the workspace by `postStartCommand` |
| `turbo-cache/docker-compose.yml` | Standalone [Turborepo remote cache](https://ducktors.github.io/turborepo-remote-cache) shared by every worktree |
| `scripts/initialize.sh` | Host-side; the `initializeCommand` entry point, runs the three below |
| `scripts/init-worktree.sh` | Host-side; exposes the real git dir when the checkout is a linked worktree |
| `scripts/ensure-turbo-cache.sh` | Host-side; brings the cache stack up before the container is created |
| `scripts/ensure-gh-auth.sh` | Host-side; creates the `rc-gh-auth` volume holding the shared `gh` login and SSH key |
| `scripts/stage-skills.sh` | Host-side; copies your user-level Claude Code skills into `.host-skills/`, unless opted out |
| `scripts/on-create.sh` | Container-side; the `onCreateCommand` entry point, fixes volume ownership and git gc |
| `scripts/install-skills.sh` | Container-side; installs the staged skills into the container's `~/.claude/skills`, then clears the staging dir |

## Things worth knowing

**Ports.** `3000` is the app, `3001` is Meteor's bundled mongod. There is no
separate `mongo` service on purpose — `meteor` starts its own mongod, and only
does so while `MONGO_URL` is unset. Don't set it.

**Adding an allowed domain.** Edit the `ALLOWED_DOMAINS` array in
`init-firewall.sh`, then **restart the container** — the script runs from the
bind-mounted `.devcontainer` folder, so no rebuild is needed, but the firewall is
only re-applied by `postStartCommand`. Confirm the change with
`sudo ipset list allowed-domains`. Anthropic's
[network access requirements](https://code.claude.com/docs/en/network-config#network-access-requirements)
list the domains Claude Code itself needs.

**Persistence.** Claude Code's auth, settings, and history live in a named volume
scoped by `${devcontainerId}`, so they survive rebuilds but aren't shared across
projects. `node_modules` and `apps/meteor/.meteor/local` are also named volumes —
they shadow the bind mount, so your host copies are untouched (and Meteor's
absolute paths don't leak between host and container).

**Your GitHub login is shared across worktrees.** Run `gh auth login` **inside a
container** once — pick SSH when it offers to generate a key — and every worktree
is authenticated, for both `gh` and `git` over SSH. Do it in here rather than on
the host: `~/.config/gh` and `~/.ssh` are two subdirectories of the shared
`rc-gh-auth` volume mounted at exactly the paths `gh` and `ssh` read by default,
so the login and the key it generates land in the volume with **nothing to
configure and nothing to copy** — including on the next rebuild.

```bash
gh auth login   # GitHub.com › SSH › generate a new key › browser
```

- One volume, two subpath mounts (`gh/` → `~/.config/gh`, `ssh/` → `~/.ssh`).
  Canonical paths are the point: pointing `ssh` elsewhere is a one-line
  `IdentityFile`, but `gh`'s key generation is hardcoded to `$HOME/.ssh` with no
  flag or env var to move it, so anything else means re-linking a key by hand
  after every login.
- The volume is declared `external` with a **fixed name**, which is the trick that
  makes it shared: each worktree runs its own compose project, so an ordinary
  volume gets namespaced per worktree (`<worktree>_devcontainer_<name>` — exactly
  what the `${devcontainerId}` scoping of the `~/.claude` volume relies on) and
  each copy would start empty. External also keeps it out of reach of
  `compose down -v`.
- For the same reason it can't be a `mounts` entry in `devcontainer.json`: those
  become ordinary volumes in a generated compose override and get prefixed too.
- `scripts/ensure-gh-auth.sh` creates it from `initializeCommand`, with both
  subdirectories `0700` and owned by uid 1000. Both parts have to happen on the
  host before create: compose fails the create on a missing external volume, and
  a subpath mount fails if that path isn't already in the volume. It also seeds
  `known_hosts` with github.com's keys from `api.github.com/meta` (HTTPS-verified,
  rather than trusting ssh-keyscan on first use), so `git push` doesn't open with
  a host-key prompt.
- Needs Compose ≥ 2.26 / Engine ≥ 25 for `subpath`.
- To log out everywhere: `gh auth logout`, or `docker volume rm rc-gh-auth` with
  no devcontainer running.
- Both the token and the private key are only as protected as the container is —
  see the warning at the top about what `--dangerously-skip-permissions` reaches.

**Turborepo remote cache.** `turbo` in here writes to a self-hosted
[remote cache](https://ducktors.github.io/turborepo-remote-cache) running as its own
compose project on the host, so a package built in one worktree replays as a cache
hit in all the others (`>>> FULL TURBO`). It starts automatically via
`initializeCommand`; if Docker is unavailable the script warns and builds simply run
uncached.

- Reached at `http://turbo-cache:3000` over the shared external `turbo-cache`
  network (`TURBO_API`/`TURBO_TEAM`/`TURBO_TOKEN` in `devcontainer.json`), and at
  `http://127.0.0.1:3399` from the host for `yarn build` outside the container.
- The network is pinned to `172.30.0.0/24` because the egress firewall allowlists
  that CIDR — the automatic host-network rule only covers the devcontainer's own
  bridge. Change one, change both.
- Artifacts live in the `turbo-cache_turbo-cache-data` volume, keyed by team, and
  survive rebuilds of every devcontainer. To wipe:
  `docker compose -f .devcontainer/turbo-cache/docker-compose.yml down -v`.
- `TURBO_TOKEN` is a fixed local-dev value, not a secret; if you change it, change
  it in both `devcontainer.json` and the cache's compose file, or every request
  401s.
- `TURBO_CACHE_DIR=.turbo/cache` is **required in a worktree**, not cosmetic. turbo
  2.9 is worktree-aware and otherwise writes the local cache into the *main*
  worktree — a host path whose parent exists in here only as a root-owned
  auto-created mount parent, so `yarn build` fails with
  `failed to create directory .../main/.turbo/cache: Permission denied`. Cross-worktree
  sharing is the remote cache's job in the container.
- **No `turbo login` / `turbo link` step is needed, and none is possible.** Those
  three env vars are the hookup — the env equivalent of what login/link persist to
  disk. Both commands are TTY-only prompts with no non-interactive flag, so they
  fail with `IO error: not a terminal` from any lifecycle hook (even under a pty
  wrapper), and `turbo` isn't installed until `updateContentCommand` anyway. To
  confirm the cache is live, run a cacheable task twice with `.turbo/cache` removed
  in between: turbo prints `Remote caching enabled` and then `cache hit, replaying
  logs`.

**Your skills come along.** Every container start copies your user-level Claude
Code skills from the host into the container, so `/my-skill` works in here too.
The source is `$CLAUDE_CONFIG_DIR/skills`, falling back to `~/.claude/skills`,
and it lands at the same path (same env var) inside the container.

- **To turn it off**, create `.devcontainer/.skip-skills` (gitignored) and
  restart — or set `DEVCONTAINER_SKIP_SKILLS=1` for the process that launches the
  container, if you drive it from the CLI. Skills copied in by an earlier start
  are removed on the next one; skills you wrote *inside* the container are not.
- Two scripts, because the container's `~/.claude` is a named volume that shares
  nothing with the host: `scripts/stage-skills.sh` copies the skills into the
  gitignored `.devcontainer/.host-skills/` on the host (via `initializeCommand`),
  and `scripts/install-skills.sh` installs them from there (via
  `postStartCommand`) and then deletes the staging directory, so nothing is left
  sitting in your checkout.
- Symlinked skills are **dereferenced on the host**, which is the reason for the
  staging step. If a skill points at another checkout (`~/.agents/skills/…`),
  that target isn't mounted into the container and the link would dangle.
- Editing or adding a skill on the host only needs a container **restart**, no
  rebuild. Deleting one on the host removes the container copy too — pruning is
  driven by `~/.claude/.host-skills.manifest`, so a skill you write *inside* the
  container is left alone.
- Copies, not mounts: nothing Claude does in here can write back to your host
  skills. The flip side is that changes made in the container are overwritten on
  the next start.
- Project-level skills (`.claude/skills/` in the repo) need none of this — the
  workspace bind mount already carries them.

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
