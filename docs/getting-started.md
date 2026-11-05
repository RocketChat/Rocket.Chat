# Getting Started — Rocket.Chat local development

**Who this is for:** developers new to the monorepo who want to run Rocket.Chat
from source for the first time.

**After reading this you will have:** the app running at
`http://localhost:3000`, logged in as an admin user, ready to edit code with hot
reload.

> Goal: clone → app running in under ~30 min (excluding download time).

---

## 1. Prerequisites

| Tool | Version pinned in | How to get it |
|-----------|--------|-----------|
| Node.js | `package.json` → `volta.node` (`engines.node` is the accepted range) | [Volta](https://volta.sh) picks it automatically, or `fnm`/`nvm install <version>` |
| Yarn | `package.json` → `packageManager` | Ships via Corepack: `corepack enable` |
| Meteor | `apps/meteor/.meteor/release` | the [installer](https://docs.meteor.com/about/install.html) |
| Git | any recent | — |

Building from source needs **16 GB of RAM or more**. **Use exactly the pinned
versions** — mismatches cause obscure build errors.

Check everything at once; the script reads the pins from the repo:

```bash
./scripts/check-deps.sh            # report what is missing or on the wrong version
./scripts/check-deps.sh --install  # install what it can
```

MongoDB is **not required** for the first run: Meteor starts a bundled Mongo,
which already runs as a single-node replica set — enough for the transactions
and change streams the app relies on. You only need an external Mongo to mirror
production or to inspect data with an external client (see section 5).

---

## 2. Clone, install and build

```bash
git clone https://github.com/RocketChat/Rocket.Chat.git
cd Rocket.Chat
./scripts/check-deps.sh --install   # Node, Yarn and Meteor at the pinned versions
yarn                                # installs all workspaces (slow the first time)
yarn build                          # builds the workspace packages that have a build step
```

This is a monorepo (Yarn workspaces + Turborepo). Running `yarn` at the root
installs `apps/*`, `packages/*` and `ee/*` at once. Do not run `yarn` inside
subfolders.

The Meteor app loads the other workspace packages from their `dist` folders, so
`yarn build` must finish before the first start. Run it again after a pull that
changes packages.

---

## 3. Run the app

> **Do not run `yarn dev` from the root.** It starts a `tsc --watch` for every
> package the app depends on, which costs a lot of CPU, and it does not build
> the packages that have no `dev` script — on a fresh clone the app fails to
> start.

Run `yarn dev` inside the workspace you work in. For the Meteor app:

```bash
cd apps/meteor
yarn dev
```

Once you see the server listening, open:

```text
http://localhost:3000
```

On the first run the Setup Wizard asks you to create the **admin** user and the
organization. That's it — you are running.

Hot reload is active: editing files in `apps/meteor` recompiles and reloads.

> The first Meteor compilation is slow (several minutes). Subsequent ones use
> the cache and are much faster.

### Work on a package

`apps/meteor` does not watch `packages/*`. When you edit a package, run
`yarn dev` (`tsc --watch`) in that package, in a separate terminal:

```bash
cd packages/rest-typings
yarn dev
```

Meteor picks up the new `dist` on its next reload. For a one-shot rebuild, or in
a package without a `dev` script (`fuselage`, `ui-kit`, `message-parser` and
others), run `yarn build` in that package instead.

Recommended loop: `yarn dev` in `apps/meteor` in one terminal, and `yarn dev`
only in the package(s) you are editing.

### Vite client (`yarn dev:next`)

`yarn dev:next` serves the client from Vite instead of Meteor. It has two
modes: against a **remote server**, or against a **local Meteor server**.

> The Vite client is a work in progress. Every `meteor/*` import resolves to an
> inert shim, so a feature that still calls a Meteor client API does not work.
> The browser console shows `[vite] <name> is not available outside the Meteor
> build` once for each such API. Use `yarn dev` to get the full client.

#### Against a remote server — client work without a local server

Set `RC_SERVER_URL` to a Rocket.Chat server that already runs. Only Vite
starts: no Meteor compilation and no Mongo. The script builds only the packages
that the client reads from `dist`, so this is the fastest way to start on
client work.

> You log in with an account on the remote server, and every action changes
> the data on that server. Do not point `RC_SERVER_URL` at a production
> workspace.

```bash
cd apps/meteor
RC_SERVER_URL=https://my-server.example.com yarn dev:next
```

Open `http://localhost:3000`. Vite serves the client from your working tree and
sends the server routes (`/api`, `/websocket`, `/sockjs`, `/_oauth`, `/avatar`,
`/file-upload` and others) to the remote server. Vite rewrites the cookies of
the server to the local address, so the login and the file downloads work.

The client runs your code, but the server runs its own version. A client change
that needs a server change from your branch does not work in this mode — use
the local server mode for it.

#### Against a local Meteor server

Without `RC_SERVER_URL`, the script runs the Meteor server too:

```bash
cd apps/meteor
yarn dev:next
```

The script (`apps/meteor/vite/dev.mjs`) does three things:

1. It builds the packages the app depends on (`turbo run build
   --filter=@rocket.chat/meteor^...`). If the build fails, nothing starts.
2. It starts Meteor on `METEOR_PORT` (default `3100`) without a client build.
   `ROOT_URL` defaults to the Vite address, so the links that the server
   builds (emails, OAuth callbacks) point to Vite.
3. It starts Vite on `PORT` (default `3000`). Vite serves the client and sends
   the server routes to Meteor.

Open `http://localhost:3000` as usual. Ctrl+C stops Vite, Meteor and the
bundled Mongo together.

#### Package edits in both modes

The Vite client compiles most workspace packages in `packages/` and
`ee/packages/` from their source. An edit to one of these packages
hot-reloads in the browser, with no `yarn dev` in the package. These rules
apply:

- The client reads a few packages from `dist`, because their build does more
  than compile TypeScript. The list is in `apps/meteor/vite/workspacePackages.mjs`.
  After you edit one of them, run `yarn build` in that package.
- The local Meteor server still loads every package from `dist`. For a change
  that the server uses, run `yarn dev` in the package as usual.
- Set `RC_WORKSPACE_DIST=1` to make the client read every package from `dist`.

---

## 4. Environment variables

Rocket.Chat is configured through environment variables. All are **optional**
for the first run — with none set, the app boots on the bundled Mongo. A var
exported in your shell is picked up on the next start. The most used ones:

| Var | Purpose |
|-----|----------|
| `PORT` | HTTP port (default `3000`) |
| `ROOT_URL` | public URL; must match how you open it in the browser |
| `MONGO_URL` | point at an external Mongo instead of the bundled one (see section 5) |
| `ROCKETCHAT_LICENSE` | enables Enterprise (EE) features |

---

## 5. (Optional) External MongoDB

The bundled Mongo already covers local dev. Set up an external one only to
mirror production or to point external tooling at the data.

Rocket.Chat needs a replica set — not for the oplog (Meteor oplog tailing is
disabled; real-time is handled by the streamer), but because transactions and
change streams require it. A single-node replica set is enough:

```bash
docker run -d --name rc-mongo -p 27017:27017 \
  mongodb/mongodb-community-server:8.0-ubi8 \
  mongod --replSet rs0 --bind_ip_all
until docker exec rc-mongo mongosh --quiet --eval "db.adminCommand('ping')" >/dev/null 2>&1; do sleep 1; done
docker exec rc-mongo mongosh --eval "rs.initiate()"
```

Then point the app at it by **exporting in your shell** before `yarn dev`
(Meteor does not load a `.env` file):

```bash
export MONGO_URL='mongodb://localhost:27017/rocketchat?replicaSet=rs0'
```

---

## 6. Run modes

| Command | What it does | When to use |
|---------|-----------|-------------|
| `yarn dev` (in `apps/meteor`) | Monolithic Meteor app | **default** — day-to-day development |
| `RC_SERVER_URL=<url> yarn dev:next` (in `apps/meteor`) | Vite client against a remote server (work in progress) | client work without a local server |
| `yarn dev:next` (in `apps/meteor`) | Meteor server + Vite client (work in progress) | client work against your own server code |
| `yarn ms` | Microservices mode (transporter, default TCP) | working on services (presence, ddp-streamer, authorization…) |
| `yarn storybook` | Component Storybook on port 6006 | developing UI in isolation |
| `yarn build` | Full monorepo build (Turbo) | validate build / local CI |

---

## 7. Run the tests

| Command (in `apps/meteor`) | Type |
|-----------|------|
| `yarn testunit` | unit (definition + jest + mocha server, with coverage) |
| `yarn testapi` | API tests (mocha, needs a running server) |
| `yarn test:e2e` | end-to-end (Playwright) |
| `yarn lint` | stylelint + oxlint |
| `yarn typecheck` | `meteor lint` + `tsc --noEmit` |

From the root, `yarn testunit` and `yarn lint` run via Turbo across all
workspaces.

---

## 8. Stuck?

See [local-dev/troubleshooting.md](./local-dev/troubleshooting.md) — Watchman,
file watching, processes that won't die, Mongo, ports.

If you get stuck on something **not** documented there: open an issue with the
`docs` label (or a short PR fixing this guide). That's the mechanism — every
new-dev blocker becomes a doc improvement.
