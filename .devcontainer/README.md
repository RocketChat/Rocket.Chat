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
| Outbound traffic is default-deny, IPv4 allowlist only, IPv6 fully blocked | `scripts/claude-code/init-firewall.sh`, applied via `postStartCommand` |

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

   Run `gh auth login` here too, in the container and not on the host. Both
   logins are once for **all** worktrees, SSH key included — see **Your logins
   are shared across worktrees** below.
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

Three lifecycle hooks, one entry point each, and everything below them is either
unconditional or owned by a devcontainer feature:

| File | Purpose |
| --- | --- |
| `devcontainer.json` | User, mounts, features, lifecycle hooks |
| `docker-compose.yml` | Service definition and the volumes no feature owns |
| `docker-compose.overrides.yml` | **Generated, gitignored**; the worktree git-dir mounts plus whatever the declared features contribute |
| `Dockerfile` | Base image and toolchain, pinned from `package.json`, `.tool-versions`, `.meteor/release` |
| `turbo-cache/docker-compose.yml` | Standalone [Turborepo remote cache](https://ducktors.github.io/turborepo-remote-cache) shared by every worktree |
| `scripts/initialize.sh` | Host-side; the `initializeCommand` entry point. Stages the compose fragments, merges them at the end |
| `scripts/on-create.sh` | Container-side; the `onCreateCommand` entry point, fixes volume ownership and git gc |
| `scripts/post-start.sh` | Container-side; the `postStartCommand` entry point |
| `scripts/lib/features.sh` | Which `scripts/<feature>/` directories run, read off `devcontainer.json`'s `features` |
| `scripts/lib/overrides.sh` | How `docker-compose.overrides.yml` gets built |
| `scripts/init-worktree.sh` | Host-side; exposes the real git dir when the checkout is a linked worktree |
| `scripts/ensure-turbo-cache.sh` | Host-side; brings the cache stack up before the container is created |
| `scripts/ensure-yarn-cache.sh` | Host-side; creates the `rc-yarn-cache` volume holding the shared Yarn package cache (`~/.yarn/berry`) |

### Feature-owned scripts

A directory under `scripts/` that ships a `feature.id` file belongs to the
devcontainer feature named in it, and **nothing inside it runs unless
`devcontainer.json` declares that feature**. Comment the feature out and its
lifecycle steps, shared volume, mounts and capabilities all disappear with it —
no other file needs editing. The hook names match the top-level ones
(`initialize.sh`, `on-create.sh`, `post-start.sh`) and are called from them.

| File | Purpose |
| --- | --- |
| `scripts/claude-code/` | Feature `ghcr.io/anthropics/devcontainer-features/claude-code` |
| `scripts/claude-code/initialize.sh` | Host-side; contributes the `~/.claude` mount and `NET_ADMIN`/`NET_RAW`, then runs the two below |
| `scripts/claude-code/ensure-claude-config.sh` | Host-side; creates the `rc-claude-config` volume holding the shared `~/.claude` (auth, settings, history) |
| `scripts/claude-code/stage-skills.sh` | Host-side; copies your user-level Claude Code skills into `.host-skills/`, unless opted out |
| `scripts/claude-code/on-create.sh` | Container-side; claims `~/.claude` |
| `scripts/claude-code/post-start.sh` | Container-side; applies the firewall and installs the staged skills |
| `scripts/claude-code/init-firewall.sh` | Default-deny egress firewall; run from the workspace on every start |
| `scripts/claude-code/install-skills.sh` | Container-side; installs the staged skills into the container's `~/.claude/skills`, then clears the staging dir |
| `scripts/gh/` | Feature `ghcr.io/devcontainers/features/github-cli` |
| `scripts/gh/initialize.sh` | Host-side; contributes the `~/.config/gh` and `~/.ssh` mounts, then runs the one below |
| `scripts/gh/ensure-gh-auth.sh` | Host-side; creates the `rc-gh-auth` volume holding the shared `gh` login and SSH key |
| `scripts/gh/on-create.sh` | Container-side; claims `~/.config/gh` and `~/.ssh` |

**Why the compose file is generated.** Compose is static and
`devcontainer.json`'s `dockerComposeFile` list can't be computed, but a feature's
volume is declared `external` — and compose refuses to create the container at
all when an external volume doesn't exist. Leaving those mounts checked into
`docker-compose.yml` would mean commenting a feature out breaks the container
instead of shrinking it. So each feature contributes a fragment on the host, and
`scripts/initialize.sh` merges them into one file. It is written in a single pass
at the end of `initializeCommand`, and is a valid empty stub when nothing
contributes.

**Adding a feature with setup of its own.** Create `scripts/<name>/`, put the
feature id in `scripts/<name>/feature.id`, and add whichever of the three hook
scripts you need. Contribute compose bits with `overrides_add <name> <bucket>`
(buckets: `service`, `service-volumes`, `volumes` — see `lib/overrides.sh`). Then
declare the feature in `devcontainer.json`. Nothing else wires it up.

## Things worth knowing

**Ports.** `3000` is the app, `3001` is Meteor's bundled mongod. There is no
separate `mongo` service on purpose — `meteor` starts its own mongod, and only
does so while `MONGO_URL` is unset. Don't set it.

**Adding an allowed domain.** Edit the `ALLOWED_DOMAINS` array in
`scripts/claude-code/init-firewall.sh`, then **restart the container** — the script runs from the
bind-mounted `.devcontainer` folder, so no rebuild is needed, but the firewall is
only re-applied by `postStartCommand`. Confirm the change with
`sudo ipset list allowed-domains`. Anthropic's
[network access requirements](https://code.claude.com/docs/en/network-config#network-access-requirements)
list the domains Claude Code itself needs.

**Persistence.** `node_modules` and `apps/meteor/.meteor/local` are named volumes
— they shadow the bind mount, so your host copies are untouched (and Meteor's
absolute paths don't leak between host and container). Both are namespaced per
worktree. The two auth volumes and the Yarn cache below deliberately are not.

**Your logins are shared across worktrees.** Sign in **inside a container** once
— `claude`, and `gh auth login` picking SSH when it offers to generate a key —
and every worktree of this repo is authenticated: Claude Code, `gh`, and `git`
over SSH. Do it in here rather than on the host, because what carries the state
is two shared volumes mounted at exactly the paths the tools read by default,
so a login lands in the volume with **nothing to configure and nothing to copy**
— including on the next rebuild.

```bash
claude          # browser auth prompt
gh auth login   # GitHub.com › SSH › generate a new key › browser
```

| Volume | Subpath | Mounted at | Holds |
| --- | --- | --- | --- |
| `rc-claude-config` | `claude/` | `~/.claude` | Claude Code credentials, settings, history, installed skills |
| `rc-gh-auth` | `gh/` | `~/.config/gh` | `hosts.yml`, i.e. the GitHub OAuth token |
| `rc-gh-auth` | `ssh/` | `~/.ssh` | The SSH key `gh auth login` generates, plus `known_hosts` |

- Canonical paths are the point, and for `gh` there is no alternative: pointing
  `ssh` elsewhere is a one-line `IdentityFile`, but `gh`'s key generation is
  hardcoded to `$HOME/.ssh` with no flag or env var to move it, so anything else
  means re-linking a key by hand after every login.
- Both volumes are declared `external` with a **fixed name**, which is the trick
  that makes them shared: each worktree runs its own compose project, so an
  ordinary volume gets namespaced per worktree (`<worktree>_devcontainer_<name>`
  in `docker volume ls`) and each copy would start empty — one login per
  checkout, forever. External also keeps them out of reach of `compose down -v`.
- For the same reason neither can be a `mounts` entry in `devcontainer.json`:
  those become ordinary volumes in a generated compose override and get prefixed
  too. `~/.claude` used to be exactly that, scoped by `${devcontainerId}`; if you
  ran this setup before the switch, those volumes are now unused
  (`docker volume ls | grep claude-code-config`) and you sign in once more to
  populate the shared one.
- Each belongs to the feature that needs it, so both the volume and its mount come
  from `scripts/gh/` and `scripts/claude-code/` — drop the feature from
  `devcontainer.json` and neither is created or mounted. See **Feature-owned
  scripts** above.
- `scripts/gh/ensure-gh-auth.sh` and `scripts/claude-code/ensure-claude-config.sh`
  create them from `initializeCommand`, with every subdirectory `0700` and owned by
  the host uid (which is the container user's, since devcontainers matches them).
  Both parts have to happen on the host before create: compose fails the create
  on a missing external volume, and a subpath mount fails if that path isn't
  already in the volume. The gh one also seeds `known_hosts` with github.com's
  keys from `api.github.com/meta` (HTTPS-verified, rather than trusting
  ssh-keyscan on first use), so `git push` doesn't open with a host-key prompt.
- Needs Compose ≥ 2.26 / Engine ≥ 25 for `subpath`.
- The subpaths are what let one volume carry two mounts (`gh/`, `ssh/`), and
  `rc-claude-config` follows the same shape with a single `claude/` entry so a
  sibling can be added later without moving what's already stored.
- **`~/.claude` is shared state, not just credentials.** Every worktree mounts at
  `/workspaces/rocket.chat`, so they all resolve to the *same* entry under
  `~/.claude/projects/` — `claude --resume` in one worktree lists sessions started
  in another. Settings, todos and installed skills are shared the same way.
- To log out everywhere: `claude /logout` and `gh auth logout`, or
  `docker volume rm rc-claude-config rc-gh-auth` with no devcontainer running.
- Credentials, token and private key are only as protected as the container is —
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

**Yarn cache.** `yarn install` in here downloads into the shared `rc-yarn-cache`
volume instead of the checkout, so the first install fills it (~650MB) and every
later one — in this worktree or any other, before or after a rebuild — installs
from disk. Same shape as the two auth volumes: external, fixed name, mounted
through a subpath created on the host by `initializeCommand`.

| Volume | Subpath | Mounted at | Holds |
| --- | --- | --- | --- |
| `rc-yarn-cache` | `berry/` | `~/.yarn/berry` | Yarn's package cache (the registry zips) and metadata index |

- Canonical path again: `globalFolder` already defaults to `~/.yarn/berry`
  (`yarn config get globalFolder`), so the mount alone is the hookup.
- `YARN_ENABLE_GLOBAL_CACHE=true` (`devcontainer.json`) is the other half. The
  repo's `.yarnrc.yml` sets `enableGlobalCache: false` — the cache belongs to the
  project — which is right on a host and wrong in here, because the project cache
  lives in the bind mount: ~350MB of zips written through it per worktree, shared
  with no one. Env beats `.yarnrc.yml`, so this applies to the container only and
  the checked-in config and CI are untouched. Check it with
  `yarn config get cacheFolder`: `/home/vscode/.yarn/berry/cache`, not a path
  under `/workspaces`.
- The mount is not redundant with yarn's mirror. With the global cache off, yarn
  keeps a copy in `~/.yarn/berry` anyway (`enableMirror`, default on) and would
  populate the project cache from it without hitting the network — so the volume
  would already help. Enabling the global cache is what removes the second copy.
- Pure cache, nothing secret, no 0700: `docker volume rm rc-yarn-cache` (with no
  devcontainer running) costs one slow install and nothing else. Deps themselves
  live in the per-worktree `node_modules` volume, not here.
- Two worktrees installing at once is fine — the cache is content-addressed and
  yarn writes each entry atomically.

**Your skills come along.** Every container start copies your user-level Claude
Code skills from the host into the container, so `/my-skill` works in here too.
The source is `$CLAUDE_CONFIG_DIR/skills`, falling back to `~/.claude/skills`,
and it lands at the same path (same env var) inside the container.

- **To turn it off**, create `.devcontainer/.skip-skills` (gitignored) and
  restart — or set `DEVCONTAINER_SKIP_SKILLS=1` for the process that launches the
  container, if you drive it from the CLI. Skills copied in by an earlier start
  are removed on the next one; skills you wrote *inside* the container are not.
- Two scripts, because the container's `~/.claude` is a named volume that shares
  nothing with the host: `scripts/claude-code/stage-skills.sh` copies the skills
  into the gitignored `.devcontainer/.host-skills/` on the host (via
  `initializeCommand`), and `scripts/claude-code/install-skills.sh` installs them
  from there (via `postStartCommand`) and then deletes the staging directory, so
  nothing is left sitting in your checkout.
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
