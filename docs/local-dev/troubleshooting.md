# Troubleshooting — local development

**Who this is for:** a developer running Rocket.Chat locally who hit a
build/run problem. **After reading:** you resolve the most common friction
points without needing to ask a senior.

Didn't find your problem here? Open an issue with the `docs` label — so the next
dev doesn't get stuck the same way.

---

## Build fails or file watching doesn't work (Watchman)

Meteor's modern stack uses [`@parcel/watcher`](https://github.com/parcel-bundler/watcher),
which picks the available watch backend. When **Watchman** is installed (common
for anyone who has built the ReactNative app) it
[conflicts with Meteor's file structure](https://forums.meteor.com/t/modern-watcher-had-failed-to-start-watcher-for-error-message/63830)
and the build may fail or miss changes — especially outside macOS.

Options:

1. Uninstall Watchman, **or**
2. Disable Meteor's modern watcher in `apps/meteor/package.json`:

   ```json
   "meteor": {
     "modern": {
       "watcher": false
     }
   }
   ```

Details: [`docs/meteor-modern-stack.md`](../meteor-modern-stack.md).

---

## I have to press Ctrl+C twice / processes won't die

TurboRepo sometimes doesn't terminate its subprocesses along with the parent.
You notice this when stopping the server. With Watchman as the backend this gets
worse: you may need to kill `watchman` and `node` manually:

```bash
pkill -f watchman
pkill -f node
```

(Reference: `docs/meteor-modern-stack.md`.)

---

## First compilation very slow

Expected. Meteor 3.4.1 compiles everything the first time (several minutes).
Subsequent compilations use the cache and are fast. Don't cancel midway — a
partial cache causes strange errors later.

---

## Wrong Node/Yarn version

Obscure build errors are usually a version mismatch. The project pins
**Node 22.22.3** and **Yarn 4.12.0** (`package.json` → `engines`/`volta`, and
`.node-version`).

```bash
node -v        # should be v22.22.3
yarn -v        # should be 4.12.0
nvm use        # aligns Node with .node-version
corepack enable
```

Volta aligns automatically if installed.

---

## Mongo: real-time doesn't work / oplog errors

Meteor's bundled Mongo works for the first run, but some real-time features need
a **replica set** (oplog). Run an external Mongo with a replica set and set
`MONGO_URL`/`MONGO_OPLOG_URL` — see section 5 of
[getting-started](../getting-started.md).

Check that the replica set was initiated:

```bash
docker exec rc-mongo mongosh --eval "rs.status().ok"   # should print 1
```

---

## Port 3000 already in use

```bash
lsof -i :3000          # find the PID
```

Kill the process or run on another port: `PORT=3001 yarn dev` (also adjust
`ROOT_URL`).

---

## `yarn` complains about workspace / installs wrong

Run `yarn` **at the root** of the repository, never inside `apps/` or
`packages/`. The monorepo is Yarn workspaces — installing in a subfolder breaks
resolution.

---

## Microservices mode (`yarn ms`) won't connect to services

`yarn ms` uses `TRANSPORTER` (default `TCP`). For the real stack with NATS, start
NATS and the services and set `TRANSPORTER=nats://localhost:4222`. The simplest
path to the full stack is `docker-compose-local.yml` (see section 6 of
getting-started).
