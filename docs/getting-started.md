# Getting Started — Rocket.Chat local development

**Who this is for:** developers new to the monorepo who want to run Rocket.Chat
from source for the first time.

**After reading this you will have:** the app running at
`http://localhost:3000`, logged in as an admin user, ready to edit code with hot
reload.

> Goal: clone → app running in under ~30 min (excluding download time).

---

## 1. Prerequisites

| Tool | Version | How to get it |
|-----------|--------|-----------|
| Node.js | **22.22.3** | `nvm use` (reads `.node-version`) or [Volta](https://volta.sh) (automatic) |
| Yarn | **4.12.0** | Ships via Corepack: `corepack enable` |
| Meteor | **3.4.1** | `npx meteor@3.4.1` or the [installer](https://docs.meteor.com/about/install.html) |
| Git | any recent | — |

Node/Yarn versions are pinned in `package.json` (`engines` + `volta`) and in
`.node-version`. **Use exactly these versions** — mismatches cause obscure build
errors.

MongoDB is **not required** for the first run: Meteor starts a bundled Mongo.
For full real-time features you will want an external Mongo with a replica set —
see section 5.

---

## 2. Clone and install

```bash
git clone https://github.com/RocketChat/Rocket.Chat.git
cd Rocket.Chat
corepack enable          # ensures Yarn 4
nvm use                  # or let Volta resolve automatically
yarn                     # installs all workspaces (slow the first time)
```

This is a monorepo (Yarn workspaces + Turborepo). Running `yarn` at the root
installs `apps/*`, `packages/*` and `ee/*` at once. Do not run `yarn` inside
subfolders.

---

## 3. Run the app

From the **root** of the repository:

```bash
yarn dev
```

This runs `turbo run dev`, which builds the required packages and starts the
Meteor app in `apps/meteor`. Once you see the server listening, open:

```
http://localhost:3000
```

On the first run the Setup Wizard asks you to create the **admin** user and the
organization. That's it — you are running.

Hot reload is active: editing files in `apps/meteor` recompiles and reloads.

> The first Meteor compilation is slow (several minutes). Subsequent ones use
> the cache and are much faster.

### Lighter alternative: run Meteor alone

The root `yarn dev` runs `turbo run dev --parallel --filter=@rocket.chat/meteor...`,
which **builds and watches every workspace package** the app depends on. That's
correct but heavy — lots of `tsc --watch` processes and CPU.

If you are only touching `apps/meteor` and your packages are already built, run
Meteor directly without the package watchers:

```bash
# once, to build all dependency packages (or run root `yarn dev` once and Ctrl+C)
yarn build

# then run only the Meteor app — no package watching
cd apps/meteor
yarn dev
```

Trade-off: changes inside `packages/*` won't recompile automatically. When you
edit a package, rebuild just that one (see below) — Meteor picks up the new
`dist` on its next reload.

### Build or watch a single package

Use Yarn workspaces to act on one package without touching the rest:

```bash
# build a single package once
yarn workspace @rocket.chat/core-typings run build

# OR watch just that package (tsc --watch) in a separate terminal
yarn workspace @rocket.chat/rest-typings run dev
```

Pattern: `yarn workspace <package-name> run <script>`. The package name is the
`"name"` field in that package's `package.json` (e.g. `@rocket.chat/models`,
`@rocket.chat/ui-client`). Most packages expose `build` (one-shot) and `dev`
(`tsc --watch`).

Recommended light loop: `cd apps/meteor && yarn dev` in one terminal, and
`yarn workspace <pkg> run dev` only for the package(s) you are editing.

---

## 4. Environment variables

Copy the example and adjust if needed:

```bash
cp apps/meteor/.env.example apps/meteor/.env
```

All vars are **optional** for the first run. The most used ones:

| Var | Purpose |
|-----|----------|
| `PORT` | HTTP port (default `3000`) |
| `ROOT_URL` | public URL; must match how you open it in the browser |
| `MONGO_URL` / `MONGO_OPLOG_URL` | external Mongo (replica set) instead of the bundled one |
| `MAIL_URL` | SMTP; without it, emails go to the console |
| `ROCKETCHAT_LICENSE` | enables Enterprise (EE) features |

Full commented list: [`apps/meteor/.env.example`](../apps/meteor/.env.example).

---

## 5. (Optional) External MongoDB with a replica set

Some real-time features depend on the **oplog**, which requires a replica set.
The quickest way to get such a Mongo is via Docker:

```bash
docker run -d --name rc-mongo -p 27017:27017 \
  mongodb/mongodb-community-server:8.0-ubi8 \
  mongod --replSet rs0 --bind_ip_all
docker exec rc-mongo mongosh --eval "rs.initiate()"
```

Then point the app at it in `apps/meteor/.env`:

```bash
MONGO_URL=mongodb://localhost:27017/rocketchat?replicaSet=rs0
MONGO_OPLOG_URL=mongodb://localhost:27017/local?replicaSet=rs0
```

---

## 6. Run modes

| Command | What it does | When to use |
|---------|-----------|-------------|
| `yarn dev` | Monolithic Meteor app | **default** — day-to-day development |
| `yarn ms` | Microservices mode (transporter, default TCP) | working on services (presence, ddp-streamer, authorization…) |
| `yarn storybook` | Component Storybook on port 6006 | developing UI in isolation |
| `yarn build` | Full monorepo build (Turbo) | validate build / local CI |

To bring up the **full microservices stack from prebuilt images** (not from your
source), use `docker-compose-local.yml` + the root [`.env.example`](../.env.example):

```bash
cp .env.example .env
docker compose -f docker-compose-local.yml up
```

---

## 7. Run the tests

| Command (in `apps/meteor`) | Type |
|-----------|------|
| `yarn testunit` | unit (definition + jest + mocha server, with coverage) |
| `yarn testapi` | API tests (mocha, needs a running server) |
| `yarn test:e2e` | end-to-end (Playwright) |
| `yarn lint` | stylelint + meteor lint + eslint |
| `yarn typecheck` | TypeScript `--noEmit` |

From the root, `yarn testunit` and `yarn lint` run via Turbo across all
workspaces.

---

## 8. Stuck?

See [local-dev/troubleshooting.md](./local-dev/troubleshooting.md) — Watchman,
file watching, processes that won't die, Mongo, ports.

If you get stuck on something **not** documented there: open an issue with the
`docs` label (or a short PR fixing this guide). That's the mechanism — every
new-dev blocker becomes a doc improvement.
