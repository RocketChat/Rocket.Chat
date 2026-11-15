# Troubleshooting — local development

**Who this is for:** a developer running Rocket.Chat locally who hit a
build/run problem. **After reading:** you resolve the most common friction
points without needing to ask a senior.

Didn't find your problem here? Open an issue with the `docs` label — so the next
dev doesn't get stuck the same way.

---

## Build fails, file watching misses changes, or Ctrl+C doesn't stop everything

Usually **Watchman**: outside macOS, Meteor's file watcher picks it when it is
installed, and it breaks Meteor's watching and makes stuck processes worse.
`scripts/check-deps.sh` warns when this applies. Causes and fixes:
[Meteor's modern build stack](../meteor-modern-stack.md#issues-with-file-watching).

---

## First compilation very slow

Expected. Meteor compiles everything the first time (several minutes).
Subsequent compilations use the cache and are fast. Don't cancel midway — a
partial cache causes strange errors later.

---

## Wrong Node/Yarn version

Obscure build errors are usually a version mismatch. The pins live in
`package.json` (`volta`, `engines`, `packageManager`) and
`apps/meteor/.meteor/release`; the script compares your tools against them:

```bash
./scripts/check-deps.sh            # what is wrong
./scripts/check-deps.sh --install  # fix what it can
```

Volta aligns Node automatically if installed.

---

## Mongo: real-time doesn't work / replica-set errors

Rocket.Chat needs Mongo running as a **replica set** — for change streams, not
the Meteor oplog (oplog tailing is disabled; real-time goes through the
streamer). The bundled dev Mongo already runs as a single-node replica set; if
you use an external Mongo, initiate a replica set and export `MONGO_URL` — see
section 5 of [getting-started](../getting-started.md).

With the Docker Mongo from that section, check that the replica set was initiated:

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

Install dependencies (`yarn` / `yarn install`) **at the root** of the
repository, never inside `apps/` or `packages/`. The monorepo is Yarn
workspaces — installing in a subfolder breaks resolution. Running scripts such
as `yarn dev` inside a workspace is fine.

---

## Microservices mode (`yarn ms`) won't connect to services

`yarn ms` uses `TRANSPORTER` (default `TCP`). For the real stack with NATS, start
NATS and the services and set `TRANSPORTER=nats://localhost:4222`.
