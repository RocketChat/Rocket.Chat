# Rocket.Chat dev container

A self-contained development environment for this repo: the pinned toolchain
(Meteor, Node/Yarn via Volta, Deno) in a container, with caches and logins
shared across every git worktree of the repo.

## Quick start

Prerequisites: Docker, and either VS Code with the
[Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
or the [`devcontainer` CLI](https://github.com/devcontainers/cli).

1. Open the repo in VS Code → **Dev Containers: Reopen in Container**
   (or `devcontainer up`).
   The first build takes a while — it downloads the pinned Meteor distribution.
   Create then runs `yarn install && yarn build` for you (plus each declared
   feature's own install step — Playwright's browsers, by default).
2. Open a terminal in the container and start the app:

   ```bash
   yarn dev        # http://localhost:3000
   ```

That's it. Everything below is either opt-in or explanation.

## What this container gives you

**The pinned toolchain, matching CI.** The image reads its versions straight out
of the repo — `apps/meteor/.meteor/release` for Meteor, `.tool-versions` for
Deno, `package.json` (`volta.node`, `volta.yarn`) for Node and Yarn — so there is
no second place to bump. Meteor's warehouse is baked in at the pinned release, so
the first in-project command doesn't re-download it.

**Git worktrees work in here, and can't be damaged from in here.** A linked
worktree's `.git` is a file pointing at an absolute host path, which normally
means "not a git repository" inside a container. Instead of rewriting anything:

- The real git dir is bind-mounted at the *same absolute path* it has on the
  host, so the pointer resolves unchanged.
- The shared `worktrees/` admin directory is mounted **read-only**, with a
  writable hole for this worktree's own admin dir. Every *other* worktree looks
  prunable from in here (their host paths aren't mounted), and read-only makes
  unregistering one fail at the kernel — no git command can do it, however it's
  invoked.
- `gc.worktreePruneExpire never` is set as a second belt for `git gc --auto`.
  (It does not cover an explicit `git worktree prune`, which ignores the config.
  Don't run that in here.)

**Caches shared by every worktree, per-worktree state kept separate.** Each
worktree runs its own compose project, so the shared things are deliberately
`external` volumes with fixed names, and the rest are ordinary volumes that get
namespaced per worktree:

| Shared across worktrees | Per worktree |
| --- | --- |
| Yarn package cache (`rc-devcontainer-yarn-cache`) | `node_modules` |
| Turborepo remote cache (own compose project) | `apps/meteor/.meteor/local` |
| Playwright browsers (`rc-devcontainer-playwright-browsers`) | Claude Code sessions under `~/.claude/projects/` |
| `gh` + SSH and Claude Code logins, with those features enabled | |

So a package built in one worktree replays as `>>> FULL TURBO` in the others, a
package downloaded once is never downloaded again, and you log in once for all
of them — while Meteor's absolute paths and each checkout's `node_modules` stay
where they belong.

The last row is the one thing that isn't a volume. It falls out of the workspace
path instead — see **The workspace path** below.

**Ports.** `3000` is the app, `3001` is Meteor's bundled mongod. There is no
separate `mongo` service on purpose: `meteor` starts its own mongod, and only
does so while `MONGO_URL` is unset — don't set it. Both host ports can be
remapped with `PORT`/`DB_PORT` in `.devcontainer/.env`.

## Features

Optional DX is opt-in through the `features` block in `devcontainer.json`.
Comment one out and everything it brings — lifecycle steps, volumes, mounts,
capabilities — disappears with it; no other file needs editing.

| Feature | Gives you |
| --- | --- |
| `devcontainers-extra/features/npm-packages` | `rc-apps`, the Rocket.Chat Apps CLI (enabled by default) |
| `postfinance/devcontainer-features/playwright-deps` | A working `yarn test:e2e`: headless-Chromium OS libraries, plus the browser build and a cache volume shared across worktrees (enabled by default) |
| `devcontainers/features/github-cli` | `gh`, plus a shared login and SSH key across worktrees |
| `anthropics/devcontainer-features/claude-code` | The Claude Code CLI, an egress firewall, your host skills, a shared login |

### Playwright and `yarn test:e2e`

Nothing to do — with the feature enabled, create leaves you able to run the e2e
suite. Start the app in one terminal and the tests in another:

```bash
yarn dev                        # http://localhost:3000
cd apps/meteor && yarn test:e2e
```

The split is deliberate, and worth knowing about when something breaks:

- **The feature installs the OS libraries only, never Playwright.** A browser build
  only works with the Playwright version that downloaded it, and the version that
  matters is the one pinned in `apps/meteor/package.json`. So the browsers are
  fetched by *that* CLI from `scripts/playwright/update-content.sh`, and there is no
  second version to bump — same principle as the Dockerfile's pins. The features
  that do install browsers themselves all depend on
  `devcontainers/features/node`, which would shadow the Volta-managed Node.
- **Chromium only**, since `playwright.config.ts` runs `channel: 'chromium'`. The
  engine list appears twice — the feature's `install*Deps` options in
  `devcontainer.json`, and `browsers=(...)` in
  `scripts/playwright/update-content.sh`. Change both together.
- **After a Playwright version bump**, `yarn install` alone isn't enough — run
  `yarn workspace @rocket.chat/meteor playwright install chromium` to fetch the
  matching build. Old builds stay in the volume, so you can move between branches
  that pin different versions without re-downloading.
- **Don't reach for `--with-deps`.** It shells out to `apt`, which the egress
  firewall blocks once the `claude-code` feature is enabled — and it's unnecessary
  either way, since those packages are already in the image. The download host
  `cdn.playwright.dev` *is* allowlisted, so a plain `playwright install` works from
  a running container.
- **`show-report` and `--ui`** need to bind outside the container, which is why the
  feature sets `PLAYWRIGHT_HTML_HOST=0.0.0.0`. Their ports aren't in
  `docker-compose.yml`; VS Code forwards them on demand, and with the CLI use
  `--ui-host 0.0.0.0` and forward the port yourself.

### Enabling Claude Code

Uncomment the `claude-code` feature in `devcontainer.json` and rebuild. Then, in
a container terminal:

```bash
claude          # follow the browser auth prompt
```

If the browser callback never reaches the container, paste the code shown in the
browser at the `Paste code here if prompted` prompt. Do this **inside** the
container, not on the host — the login lands in a volume shared by every
worktree. Same for `gh auth login` (pick SSH and let it generate a key) with the
`github-cli` feature.

What the feature wires up beyond the CLI itself:

- **A default-deny egress firewall**, re-applied on every start because iptables
  state doesn't persist. IPv4 allowlist only, IPv6 fully blocked. This is what
  makes `claude --dangerously-skip-permissions` a bounded risk here: no
  permission prompt reviews a tool call, but the call runs in the container
  rather than on your machine, as the non-root `vscode` user (the CLI *refuses*
  the flag as root), and can only reach the allowlist.
  Watch the `postStartCommand` output for
  `verified: https://example.com is blocked as expected` — no line, no firewall.
- **Your user-level skills**, copied in on every start so `/my-skill` works in
  here too.

The firewall bounds egress, not the workspace: it is a bind mount, so anything
Claude writes lands in your host checkout, and your credentials, GitHub token and
SSH key are reachable from inside. Use it on repositories you trust. See
Anthropic's [permission modes](https://code.claude.com/docs/en/permission-modes)
for `auto` mode if you want fewer prompts without disabling the checks.

#### With the devcontainer CLI

Start the devcontainer:

```bash
npx @devcontainer/cli up
```

Run claude:

```bash
npx @devcontainer/cli exec claude --dangerously-skip-permissions
```

If you need to shell into the container:

```bash
npx @devcontainer/cli exec bash # zsh is also available
```

Tip for herdr users: prepend `HERDR_AGENT=claude` to your command so herdr can watch the agent:

```bash
HERDR_AGENT=claude npx @devcontainer/cli exec claude --dangerously-skip-permissions
```

## Structure

Four lifecycle hooks, one entry point each. Everything below them is either
unconditional or owned by a feature.

| File | Purpose |
| --- | --- |
| `devcontainer.json` | User, features, env, lifecycle hooks, workspace path and the mounts that track it |
| `docker-compose.yml` | Service definition and the volumes neither a feature nor the workspace path owns |
| `docker-compose.overrides.yml` | **Generated, gitignored** — worktree git-dir mounts plus whatever the declared features contribute |
| `Dockerfile` | Base image and toolchain, pinned from the repo |
| `.env` | Compose variables (`PORT`, `DB_PORT`) |
| `turbo-cache/docker-compose.yml` | Standalone [Turborepo remote cache](https://ducktors.github.io/turborepo-remote-cache), its own project so one cache serves all worktrees |
| `scripts/initialize.sh` | Host-side `initializeCommand`; runs the ensure-scripts, then merges the compose fragments |
| `scripts/on-create.sh` | Container-side `onCreateCommand`; claims volume mount points, configures git |
| `scripts/update-content.sh` | Container-side `updateContentCommand`; `yarn install`, the features' install steps, `yarn build` |
| `scripts/post-start.sh` | Container-side `postStartCommand`; nothing unconditional yet |
| `scripts/init-worktree.sh` | Host-side; exposes the real git dir when the checkout is a linked worktree |
| `scripts/init-git-identity.sh` | Host-side; passes your git author identity through to the container |
| `scripts/ensure-turbo-cache.sh` | Host-side; brings the cache stack up before create |
| `scripts/ensure-yarn-cache.sh` | Host-side; creates the `rc-devcontainer-yarn-cache` volume |
| `scripts/lib/features.sh` | Which `scripts/<feature>/` directories run, read off `devcontainer.json` |
| `scripts/lib/overrides.sh` | How `docker-compose.overrides.yml` gets built |

The `ensure-*` scripts are host-side and pre-create rather than lazy for one
recurring reason: compose refuses to create the container when an `external`
volume or network is missing, and a `subpath` mount fails if that path isn't
already inside the volume.

### The Docker image

Layers are ordered cheapest-to-invalidate **last**, and each version pin is
`COPY`ed immediately before the step that consumes it. Meteor (~1GB, pin changes
maybe twice a year) comes first; `package.json` (churns constantly) comes last.
A single `COPY` block up front would mean every dependency bump re-downloads
Meteor. Adding to the apt layer still invalidates everything — unavoidable, since
every step below it needs curl.

The firewall script is deliberately *not* copied into the image: `.devcontainer`
is part of the bind mount, so `postStartCommand` runs it from there and edits to
the allowlist take effect on a **restart**, no rebuild.

### Feature-owned scripts

A directory under `scripts/` that ships a `feature.id` file belongs to the
feature named in it, and **nothing inside it runs unless `devcontainer.json`
declares that feature**. Hook names match the top-level ones
(`initialize.sh`, `on-create.sh`, `update-content.sh`, `post-start.sh`) and are
called from them. Directory names aren't derived from feature ids — `gh` owns
`devcontainers/features/github-cli` — the file is the mapping.

| Directory | Contents |
| --- | --- |
| `scripts/claude-code/` | Contributes the `~/.claude` mount and `NET_ADMIN`/`NET_RAW`; creates `rc-devcontainer-claude-config`; stages and installs host skills; applies `init-firewall.sh` on every start |
| `scripts/gh/` | Contributes the `~/.config/gh` and `~/.ssh` mounts; creates `rc-devcontainer-gh-auth`, seeding `known_hosts` from `api.github.com/meta` so `git push` doesn't open with a host-key prompt |
| `scripts/playwright/` | Contributes the `~/.cache/ms-playwright` mount; creates `rc-devcontainer-playwright-browsers`; downloads the browser build with the repo's pinned Playwright once dependencies are installed |

**Why the compose file is generated.** Compose is static and
`devcontainer.json`'s `dockerComposeFile` list can't be computed, yet two things
are only knowable on the host at `initializeCommand` time: whether this checkout
is a linked worktree, and which features are declared. A feature's volume is
`external`, and compose refuses to create the container at all when an external
volume doesn't exist — so checking those mounts into `docker-compose.yml` would
mean commenting a feature out *breaks* the container instead of shrinking it.
Each contributor stages a fragment on the host and `scripts/initialize.sh` merges
them in one pass at the end. With nothing to contribute it's a valid empty stub.

**Adding a feature with setup of its own.** Create `scripts/<name>/`, put the
feature id in `scripts/<name>/feature.id`, add whichever of the three hook
scripts you need, and contribute compose bits with `overrides_add <name>
<bucket>` (buckets: `service`, `service-volumes`, `volumes` — see
`lib/overrides.sh`). Then declare the feature in `devcontainer.json`. Nothing
else wires it up.

## Details

**The workspace path.** `/workspaces/${localWorkspaceFolderBasename}/rocket.chat`
— so `/workspaces/main/rocket.chat` for a checkout in `worktrees/main`, not the
`/workspaces/rocket.chat` every worktree used to share.

- The point is tools that key state by absolute path. Chief among them Claude
  Code, whose `~/.claude/projects/<flattened-path>` would otherwise be one shared
  entry for every checkout, since they all mount the one config volume.
- `rocket.chat` stays the leaf, so the directory name shows up in neither the VS
  Code window title nor the shell prompt. `pwd` is where you'll see it.
- Two checkouts whose directories share a name would collide — but that's the
  same bet the compose project name already makes, so it's not a new failure mode.
- **Not `${devcontainerId}`**, which is what you'd reach for first and is broken
  for this: `devcontainer up` substitutes it, but `devcontainer exec` resolves the
  config with *no* id labels, so the literal `${devcontainerId}` survives into the
  exec cwd and every command fails with `chdir to cwd (…) no such file or
  directory`. Nothing on the command line fixes it, `--id-label` included. (The id
  itself is well behaved — a base32 SHA-256 of the checkout path plus the config
  file path, stable across rebuilds. It's the substitution coverage that isn't.)
- The workspace bind mount and the two volumes nested inside it therefore live in
  `devcontainer.json`'s `mounts` rather than `docker-compose.yml`: their targets
  have to track this path, and no compose file can resolve these variables. The
  CLI writes them into a generated override, where the named ones come out
  project-prefixed exactly as the compose file would have made them —
  `<project>_rc-node-modules` — so no volume is orphaned by the move.
- One consequence: `docker compose -f .devcontainer/docker-compose.yml up` by
  hand now yields a container with no source in it. Use the devcontainer CLI or
  VS Code.
- Never hardcode the path in a container-side script. Derive it — the scripts
  under `scripts/` walk up from `${BASH_SOURCE[0]}`, and lifecycle hooks run with
  it as their cwd (`${containerWorkspaceFolder}` also expands in
  `devcontainer.json`).

**Git identity.** Your `user.name` and `user.email` are read on the host at
`initializeCommand` and written into the container's global git config at create,
so commits made in here are authored by you instead of failing with "Please tell
me who you are".

- Read from the repo root, not `--global`, so the **effective** identity wins — a
  repo-local address on a work checkout is what the host would commit with, and
  what should apply in here. Check what will be picked up with
  `git config --get user.email` at the repo root.
- Travels as `RC_GIT_USER_NAME`/`RC_GIT_USER_EMAIL` on the service, which
  `scripts/on-create.sh` converts into real config. Deliberately not
  `GIT_AUTHOR_*`/`GIT_COMMITTER_*`: those override even a repo-local identity set
  inside the container, and leave `git config user.email` answering nothing.
- Applied at **create**, so changing your host identity needs a rebuild to take
  effect — or just run `git config --global user.email ...` in the container.
- Under VS Code this overlaps with `dev.containers.copyGitConfig` (on by
  default), which copies the whole host `.gitconfig`. Both write `~/.gitconfig`;
  this script is what makes the `devcontainer` CLI behave the same way.
- Nothing is contributed when the host has no identity configured, and no git on
  the host is a warning rather than a failed create.

**Shared volumes.** Each is mounted at exactly the path its tool reads by
default, so a login or a download lands in the volume with nothing to configure
and nothing to copy — including after a rebuild. Subpaths let one volume carry
several mounts, and need Compose ≥ 2.26 / Engine ≥ 25.

| Volume | Subpath | Mounted at | Holds |
| --- | --- | --- | --- |
| `rc-devcontainer-yarn-cache` | `berry/` | `~/.yarn/berry` | Yarn's package cache (~650MB warm) and metadata index |
| `rc-devcontainer-playwright-browsers` | `ms-playwright/` | `~/.cache/ms-playwright` | Playwright's browser builds, one directory per version |
| `rc-devcontainer-claude-config` | — | `~/.claude` | Claude Code credentials, settings, history, skills |
| `rc-devcontainer-gh-auth` | `gh/` | `~/.config/gh` | `hosts.yml`, i.e. the GitHub OAuth token |
| `rc-devcontainer-gh-auth` | `ssh/` | `~/.ssh` | The SSH key `gh auth login` generates, plus `known_hosts` |

- Being `external` with a **fixed** name is what makes them shared, and also
  keeps them out of reach of `compose down -v`. For the same reason none can be a
  `mounts` entry in `devcontainer.json`: those become ordinary volumes in a
  generated override and get the project prefix too.
- Canonical paths are the point, and for `gh` there's no alternative — its key
  generation is hardcoded to `$HOME/.ssh` with no flag to move it.
- The auth volumes are created `0700` and owned by the host uid (which is the
  container user's, since devcontainers matches them). The Yarn and Playwright ones
  are pure cache: `docker volume rm rc-devcontainer-yarn-cache` costs one slow
  install and `rc-devcontainer-playwright-browsers` one re-download, nothing more.
- `~/.claude` is shared *state*, not just credentials — the login, settings,
  skills and history all come from the one volume. Per-project state does not
  cross over, though: `workspaceFolder` is per-worktree, so each checkout
  resolves to its own entry under `~/.claude/projects/` and
  `claude --resume` only lists that worktree's sessions.
- To log out everywhere: `claude /logout` and `gh auth logout`, or
  `docker volume rm rc-devcontainer-claude-config rc-devcontainer-gh-auth` with no devcontainer running.

**Turborepo remote cache.** Reached at `http://turbo-cache:3000` over the shared
external `turbo-cache` network (`TURBO_API`/`TURBO_TEAM`/`TURBO_TOKEN` in
`devcontainer.json`), and at `http://127.0.0.1:3399` from the host for builds
outside the container. It starts via `initializeCommand`; if Docker is
unavailable the script warns and builds simply run uncached.

- The network is pinned to `172.30.0.0/24` because the egress firewall allowlists
  that CIDR — the automatic host-network rule only covers the devcontainer's own
  bridge. Change one, change both.
- `TURBO_TOKEN` is a fixed local-dev value, not a secret. Change it in both
  places or every request 401s. To wipe artifacts:
  `docker compose -f .devcontainer/turbo-cache/docker-compose.yml down -v`.
- `TURBO_CACHE_DIR=.turbo/cache` is **required in a worktree**. turbo 2.9 is
  worktree-aware and otherwise writes the local cache into the *main* worktree —
  a host path that exists in here only as a root-owned mount parent, so builds
  fail with `Permission denied`.
- **No `turbo login`/`turbo link` is needed, or possible.** Those three env vars
  *are* the hookup. Both commands are TTY-only and fail with `IO error: not a
  terminal` from any lifecycle hook. To confirm the cache is live, run a
  cacheable task twice with `.turbo/cache` removed in between.

**Yarn's global cache.** `YARN_ENABLE_GLOBAL_CACHE=true` (`devcontainer.json`) is
the other half of the volume above. The repo's `.yarnrc.yml` sets
`enableGlobalCache: false` — the cache belongs to the project — which is right on
a host and wrong in here, where the project cache would live in the bind mount:
~350MB of zips per worktree, shared with no one. Env beats `.yarnrc.yml`, so the
checked-in config and CI are untouched. Verify with `yarn config get cacheFolder`
— it should be under `/home/vscode/.yarn/berry`, not `/workspaces`. Two worktrees
installing at once is fine; the cache is content-addressed and written
atomically.

**Skills staging.** The container's `~/.claude` is a volume that shares nothing
with the host, so `stage-skills.sh` copies `$CLAUDE_CONFIG_DIR/skills` (falling
back to `~/.claude/skills`) into the gitignored `.host-skills/` on the host, and
`install-skills.sh` installs from there on start and deletes the staging dir.

- Symlinks are dereferenced on the host — the reason for the staging step. A
  skill pointing at another checkout isn't mounted into the container and the
  link would dangle.
- Copies, not mounts: nothing Claude does in here can write back to your host
  skills, and changes made inside are overwritten on the next start.
- Editing, adding or deleting a skill on the host only needs a **restart**.
  Pruning is driven by `~/.claude/.host-skills.manifest`, so a skill you wrote
  *inside* the container is left alone.
- **To turn it off**, create `.devcontainer/.skip-skills` (gitignored), or set
  `DEVCONTAINER_SKIP_SKILLS=1` for the process launching the container.
- Project-level skills (`.claude/skills/`) need none of this — the workspace bind
  mount already carries them.

**Adding an allowed domain.** Edit `ALLOWED_DOMAINS` in
`scripts/claude-code/init-firewall.sh` and **restart the container** — no rebuild
needed, but the firewall is only re-applied by `postStartCommand`. Confirm with
`sudo ipset list allowed-domains`. Anthropic's
[network access requirements](https://code.claude.com/docs/en/network-config#network-access-requirements)
list the domains Claude Code itself needs.

## Anthropic's documentation

- [Development containers](https://code.claude.com/docs/en/devcontainer) — the reference implementation this setup is adapted from
- [Permission modes](https://code.claude.com/docs/en/permission-modes) and the [CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Security model](https://code.claude.com/docs/en/security) and [sandbox environments](https://code.claude.com/docs/en/sandbox-environments)
- [The `.claude` directory](https://code.claude.com/docs/en/claude-directory) — what the persisted volume actually holds
