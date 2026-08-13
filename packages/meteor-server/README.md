# @rocket.chat/meteor-server

Node TypeScript port of the Meteor **server** runtime, consumed by the vite
server build in place of the `meteor/*` packages — the backend counterpart of
`@rocket.chat/meteor-client`.

The vite server config aliases `meteor` → `packages/meteor-server/src`, so
`import { Meteor } from 'meteor/meteor'` resolves to [src/meteor.ts](src/meteor.ts).
Packages with a `:` in their Meteor name get an explicit per-specifier alias
(`meteor/ostrio:cookies` → `ostrio-cookies.ts`, `meteor/meteorhacks:inject-initial`
→ `inject-initial.ts`).

## Module status

| Module | Status | Notes |
| --- | --- | --- |
| `meteor` | ✅ functional | `EnvironmentVariable`/`bindEnvironment` over `AsyncLocalStorage` (port of `dynamics_nodejs.js`), method registry with invocation context (`userId`, `runAsUser`), startup queue (`runStartupCallbacks()` must be called by the entrypoint), settings from `METEOR_SETTINGS`, `absoluteUrl` from `ROOT_URL` |
| `check` | ✅ vendored | Port of `packages/check/match.js` @ METEOR@3.4.1 |
| `webapp` | ✅ functional | Express-backed (`rawHandlers` before `handlers`, matching Meteor 3); entrypoint calls `startWebApp()`; `WebAppInternals.generateBoilerplate` is a no-op (vite serves the client) |
| `mongo` | ✅ functional | `MongoInternals.defaultRemoteCollectionDriver().mongo` over a direct `MongoClient` from `MONGO_URL`; `Mongo.Collection` intentionally throws (models use the raw driver); no oplog handle |
| `npm-mongo` | ✅ | Re-exports the `mongodb` driver |
| `rate-limit` / `ddp-rate-limiter` | ✅ vendored | Ports @ METEOR@3.4.1 |
| `ejson`, `ddp-common`, `url`, `tracker`, `random` | ✅ | Re-exported from `@rocket.chat/meteor-client` (environment-agnostic) |
| `ddp` | ✅ minimal | `_CurrentMethodInvocation` / `_CurrentPublicationInvocation` environment variables |
| `service-configuration` | ✅ functional | Raw-driver adapter over `meteor_accounts_loginServiceConfiguration` |
| `routepolicy`, `facts-base`, `reactive-dict`, `ostrio:cookies` | ✅ minimal | Small functional ports of the used surface |
| `http` | ✅ minimal | fetch-based port of the deprecated HTTP package |
| `meteorhacks:inject-initial` | ⚠️ partial | Registry works; whatever serves the client HTML must call `applyHtmlInjections()` |
| `email` | ⚠️ partial | Transport must be installed via `setEmailSender()` |
| `oauth` / `google-oauth` | ⚠️ partial | Pending-credential store functional; login-response templates throw until vendored |
| `accounts-base` | ✅ functional | Token hashing/stamping (**session-compatible**: SHA-256→base64), login-handler registry and hooks, `_attemptLogin`/`_loginUser`, and the `login`/`logout`/`logoutAllClients` methods. Email flows (`sendVerificationEmail`, `sendResetPasswordEmail`, `sendEnrollmentEmail`) still throw |
| `accounts-password` | ✅ functional | Port of the password login handler + `_checkPasswordAsync`/`setPasswordAsync` @ METEOR@3.4.1. **Hash-compatible**: plaintext is SHA256'd then bcrypt'd, and `{digest, algorithm:'sha-256'}` is accepted as-is. Argon2 hashes are rejected loudly rather than silently failing |
| `autoupdate` | ✅ functional | `ClientVersions` + the `meteor_autoupdate_clientVersions` publication that `MeteorService.started()` calls. Version comes from `AUTOUPDATE_VERSION` or the build's commit |
| `assets` | ✅ functional | Meteor's `Assets` global, reading `apps/meteor/private/` (`METEOR_ASSETS_DIR` overrides) |
| `client` | ✅ functional | Serves the vite-built client + `/meteor_runtime_config.js`, applying Rocket.Chat's HTML injections. Not a Meteor package — it replaces what `webapp` did with the client program |

Also installed as bare globals (Meteor exposes these without an import):
`__meteor_runtime_config__` (by `meteor.ts`) and `Assets` (by `assets.ts`).

## Verified state

`yarn build:server` in `apps/meteor` produces `dist-server/main.mjs` with **no
`meteor/*` import left in the output** — every one is bundled from this package.

Run against a Mongo replica set, the server **boots completely and serves
traffic**, verified end to end:

| Check | Result |
| --- | --- |
| `GET /health`, `/livez`, `/readyz` | `200` |
| `GET /api/info` | `200`, real version/workspace payload |
| `GET /api/v1/settings.public` | `200`, settings read from Mongo |
| `GET /api/v1/me` unauthenticated | `401` |
| `POST /api/v1/login` correct password | `200` + `authToken` |
| `POST /api/v1/login` wrong password | `401` |
| `GET /api/v1/me` with token | `200` |
| `GET /api/v1/rooms.adminRooms` with token | `200` (permissions resolve) |
| `POST /api/v1/logout`, then reuse token | `200`, then `401` |
| `GET /` | `200`, the client app; login through the UI succeeds |

Admin seeding via `ADMIN_USERNAME`/`ADMIN_PASS`/`ADMIN_EMAIL` also works.

## Known constraints

1. **`apps/meteor` must be `"type": "module"`.** With `"type": "commonjs"` the
   bundler wraps every module in a CommonJS initializer, which turns
   `server/main.ts`'s top-level await into a detached async body — the entrypoint
   then listens before the app has registered a single route. Switching to
   `"module"` produces native ESM and fixes it, but **breaks the five
   `.mocharc*.js` files**, which use `module.exports`; they need renaming to
   `.cjs`. A build-scoped alternative has not been found yet.
2. **Module evaluation order.** Meteor's lazy CommonJS requires let modules load
   in source order; ESM hoists the whole graph. The entrypoint therefore has to
   pin `./models` ahead of `./main` so the model registry is populated before
   `./settings` runs its top-level await.
3. **`__dirname` resolves to the emitted chunk**, not the original source file
   (see the output banner in the vite config). Any code deriving asset paths
   from it needs checking.
4. **`.node_version.txt`** is read from `<cwd>/../../` by
   `server/startup/serverRunning.ts`. A production Meteor bundle ships it at the
   bundle root; nothing in this repo generates it, so it must exist at the repo
   root (matching `engines.node`) for the built server to start.

## Not covered yet (by design, next milestones)

1. **DDP server** — websocket sessions, subscriptions, streamer. Plan: reuse
   `ee/apps/ddp-streamer`'s meteor-free `Server`/`Client`/`Streamer` in-process,
   dispatching to `Meteor.server.method_handlers` instead of proxying to a
   Meteor instance, and wiring `Meteor._emitConnection`. Until then the REST API
   works but websocket clients do not.
2. **Account email flows** — verification/reset/enrollment emails, plus an
   `Email` transport via `setEmailSender()`.
3. **OAuth login-response templates** — `OAuth._endOfLoginResponse` and friends
   still need vendoring for the OAuth popup/redirect flow.
4. **Reactive head injections** — `server/lib/ui-master` recomputes them in a
   `Tracker.autorun` over a `ReactiveDict`; this port of `ReactiveDict` is a
   plain store with no Tracker dependency, so the autorun runs once and later
   settings changes do not re-inject.

## Entrypoint contract

See [apps/meteor/server/main.vite.ts](../../apps/meteor/server/main.vite.ts). A
meteor-free boot must, in order:

1. import `assets`, `autoupdate` and `accounts-password` for their side effects
   (Meteor loaded these as packages; nothing in the app imports them)
2. `await connectToDatabase()` (from `mongo.ts`) — fail fast on a bad `MONGO_URL`
3. `await import('./models')` — pin the model registry ahead of the graph
4. `await import('./main')` — the app's server module graph
5. `await runStartupCallbacks()` (from `meteor.ts`), matching Meteor's boot,
   which awaits all eager modules before running startup hooks
6. `await startWebApp()` (from `webapp.ts`)

Note that a throwing startup callback aborts the boot: Meteor propagates it too,
but Rocket.Chat installs an `uncaughtException` handler that swallows it, so the
entrypoint catches and exits rather than idling forever without listening.

Environment: `MONGO_URL`, `ROOT_URL`, `PORT`, optional `METEOR_SETTINGS` JSON,
`METEOR_ASSETS_DIR`, `AUTOUPDATE_VERSION`.

```bash
MONGO_URL="mongodb://127.0.0.1:27017/rocketchat?directConnection=true" ROOT_URL="http://localhost:3000" PORT=3000 node dist-server/main.mjs
```

### Serving the frontend

The server serves the vite-built client itself ([client.ts](src/client.ts)), so
a single process on port 3000 serves both the app and the API — the same shape
as a Meteor bundle. Build the client first:

```bash
ROOT_URL=http://localhost:3000 NODE_ENV=production yarn --cwd apps/meteor vite build
```

`serveClient()` is mounted *after* the app's own handlers, so `/api`, `/avatar`,
`/file-upload` and friends keep priority and only unclaimed routes fall through
to the SPA entry. `dist/static/*` is served immutable, everything else
revalidates. Rocket.Chat's head/body injections (`Inject.rawModHtml`,
`Inject.rawBody` — favicons, custom CSS/JS, the loading screen) are applied to
`index.html` per request.

Set `SERVE_CLIENT=false` to skip this and put the vite dev server in front
instead (`ROOT_URL=http://localhost:3000 yarn --cwd apps/meteor vite`, then open
port 5173); it proxies the API back here. `.claude/launch.json` has a
`vite-local` entry for that. `CLIENT_DIR` overrides where the build is read from.

#### `__meteor_runtime_config__` and CSP

The vite build inlines the script that defines `__meteor_runtime_config__`, but
Rocket.Chat's `Enable_CSP` sets `script-src` without `unsafe-inline`, so the
browser blocks it and the client never boots. Meteor hit the same problem and
solved it by serving the config externally when
`WebAppInternals.inlineScriptsAllowed()` is false (`webapp_server.js`), which is
exactly what Rocket.Chat's CSP setting toggles. `serveClient()` does the same: it
lifts that script out to `/meteor_runtime_config.js` and references it by `src`,
falling back to inline when inline scripts are allowed.

#### What works in the browser

The login page renders and **logging in works** end to end (the token lands in
`localStorage`). The app then stalls on the loading spinner behind a "You're
offline" banner, because the DDP websocket has nothing to connect to — see
milestone 1 below. A favicon request also 404s.

### Connecting to a Mongo running in docker

Use `directConnection=true` rather than `replicaSet=rs0` when the database runs
in docker compose but the server runs on the host. A replica set advertises its
members by the hostnames in its own config — for a compose setup that is the
service name (`mongo:27017`), which resolves inside the compose network but not
on the host. With `replicaSet` set, the driver connects to the seed, discovers
that name, switches to it, and fails with `getaddrinfo ENOTFOUND mongo`.
`directConnection=true` skips discovery and talks to the seed; transactions still
work because the server is still a replica set member.

`connectToDatabase()` detects this case and rewrites the driver's error into an
explanation, since the raw `MongoServerSelectionError` does not hint at it.
