# Meteor Removal Plan

> Status: proposal — verified against the codebase on 2026-07-07 (Meteor 3.4.1).
>
> Companion document: [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) covers the backend *folder-structure* migration. This document covers removing the Meteor *framework*. The two proceed in parallel; coordination points are called out where they touch the same files (mainly Meteor methods).

## 1. Goal

Remove Meteor entirely from the monorepo while:

- keeping `develop` shippable at every step — no long-lived migration branch, no big-bang cutover;
- minimizing disruption for the many engineers working on features and fixes concurrently;
- preserving wire-level compatibility for every external consumer (mobile apps, desktop app, livechat widget, bots/SDKs speaking DDP or REST, incoming/outgoing webhooks, OAuth2 provider consumers);
- ending with the same one-command developer experience (`yarn dev` starts backend + frontend).

**We are not adopting a monolithic replacement framework** (Nest, Fastify-the-framework, etc.). The replacement stack has already been chosen incrementally over the past years and is battle-tested in microservices mode:

| Concern | Replacement | Status |
| --- | --- | --- |
| HTTP routing | Hono via `@rocket.chat/http-router` | in production (whole REST API) |
| MongoDB | native driver via `@rocket.chat/models` / `BaseRaw` | in production |
| Realtime (DDP server) | `ws`-based server from `ee/apps/ddp-streamer` | in production (microservices mode) |
| Realtime (client) | `@rocket.chat/ddp-client` (DDPSDK) | behind `SDK_DDP_Transport_Enabled` flag |
| Service bus | `@rocket.chat/core-services` + LocalBroker / Moleculer | in production |
| Client state | Zustand stores + `CachedStore` (localforage) | in production |
| Client build | **Vite** (to be introduced, Phase 7) | not started |
| Auth/accounts | **new `Accounts` service** (Phase 5) | only `hashLoginToken` exists (`@rocket.chat/account-utils`) |

What remains is to fill the gaps (accounts, HTTP host, methods runtime, client build) and cut over.

## 2. Verified current state

### 2.1 Already Meteor-free

- **All 55+ shared packages and 9 EE packages**, including `models`, `core-services`, `rest-typings`, `http-router`, `ddp-client`, `cron` (Agenda), `instance-status`, `network-broker`.
- **All EE microservices** (`ee/apps/*`): plain `tsc` builds, `node src/service.js` entrypoints, raw `MongoClient` from `MONGO_URL` (`packages/core-services/src/lib/mongo.ts`). Crucially this includes **`ee/apps/ddp-streamer`** — a complete DDP server on `ws` + `polka` with native `login`, presence methods, and `meteor_autoupdate_clientVersions` / `meteor.loginServiceConfiguration` publications (`ee/apps/ddp-streamer/src/{Server,Client,DDPStreamer,configureServer}.ts`).
- **The REST API**: Hono routers, ajv validation, own auth middleware using `hashLoginToken` from `@rocket.chat/account-utils`. Only its final mount touches Meteor (`WebApp.rawConnectHandlers` in `server/api/api.ts`).
- **The livechat widget** (`packages/livechat`): Preact + webpack, zero Meteor.
- **Client feature code**: components/views consume `ui-contexts` hooks and Zustand stores. Meteor survives only in a compatibility shim (`client/meteor/` — overrides, vendored minimongo, login glue), the SDK adapter (`client/lib/sdk/`), and three providers (`ServerProvider`, `UserProvider`, `AuthenticationProvider`).
- **Method calls from the web client already go over REST** unconditionally (`client/meteor/overrides/ddpOverREST.ts` → `POST /api/v1/method.call[Anon]/:method`). The websocket only carries: `login` (resume), `logout`, `UserPresence:*`, `setUserStatus`, and `stream-*` subscriptions. This is exactly the surface `ddp-streamer` already implements natively.
- **`MeteorError`** already has a Meteor-free implementation (`packages/core-services/src/MeteorError.ts`).

### 2.2 Remaining coupling (import counts = files, `apps/meteor` server+client)

| Meteor package | Files | Concentration |
| --- | --- | --- |
| `meteor/meteor` | 425 | `Meteor.methods` (~164 sites), `Meteor.startup` (~65), `Meteor.Error` (~205 uses), `Meteor.userId/userAsync`, `Meteor.callAsync` |
| `meteor/check` | 145 | almost entirely method param validation; REST already uses ajv |
| `meteor/accounts-base` | 64 | login pipeline, tokens, password, email flows (§5) |
| `meteor/webapp` | 31 | ~25 HTTP mount points + `WebAppInternals` overrides (§3) |
| `meteor/mongo` | 18 | single real chokepoint: `server/database/utils.ts` (`MongoInternals.defaultRemoteCollectionDriver()`); rest import it or use GridFS via `MongoInternals` |
| `meteor/oauth` + provider pkgs | 20 | OAuth login flows, `service-configuration` |
| `meteor/ddp-rate-limiter`, `rate-limit` | 17 | method/publication rate rules |
| `meteor/tracker` | 8 | client shim only (`client/meteor/`) |
| `ostrio:cookies` | 5 | cookie parsing on file/avatar routes |
| singles | — | `meteor/email` (`app/mailer/server/api.ts`), `facts-base` (metrics), `inject-initial` (ui-master), `routepolicy` (CAS/SAML), `reactive-dict` (ui-master server), `meteor/http`+`meteor/url` (`server/lib/http/call.ts`, **dead code**) |

Plus non-import coupling:

- **Global `Assets` API** (bundled `private/` files): 4 call sites — i18n route, moment locales, rocketcat avatar, livechat widget HTML.
- **`WebAppInternals`**: `staticFilesMiddleware` + CSP/`meteor_runtime_config.js` interception (`app/cors/server/cors.ts`), `generateBoilerplate` (`server/configuration/configureBoilerplate.ts`), `setBundledJsCssPrefix` (CDN).
- **`Meteor.server` internals**: DDP session access for presence/monitoring (`server/services/meteor/service.ts`, `ee/server/startup/presence.ts`), streamer publish writing straight to `_session.socket` (`server/modules/streamer/streamer.module.ts`).
- **`DDP._CurrentInvocation`**: user context propagation for REST→method bridging (`server/api/ApiClass.ts`, `packages/meteor-run-as-user`).
- **Build system**: Meteor builds server bundle and client bundle (`meteor build`), `dynamic-import`, `autoupdate`, boilerplate HTML; local packages `rocketchat-mongo-config`, `rocketchat-version`, `rocketchat-livechat`, `rocketchat-i18n`, `meteor-inject-initial`, `meteor-cookies`, `autoupdate` fork.

## 3. Strategy: strangler package + guardrails

### 3.1 New package: `@rocket.chat/server-core` (`packages/server-core`)

A Meteor-free package that hosts the replacement runtime, importable by `apps/meteor` today and by the future plain-Node entrypoint. Rules:

1. **`server-core` never imports `meteor/*`.** Where a capability must be backed by Meteor during transition, `server-core` defines the interface + a registration hook, and `apps/meteor` injects a Meteor-backed adapter at boot. Adapters live in `apps/meteor/server/meteor-compat/` and are deleted at cutover.
2. Call sites migrate **once**: `import { X } from 'meteor/…'` → `import { X } from '@rocket.chat/server-core'`. Swapping the backing later touches only the adapter.
3. **A Meteor idiom is not automatically a requirement.** `server-core` must not become a 1-to-1 mirror of Meteor's API. Every candidate module falls into exactly one of three buckets, stated explicitly:

   **(a) Target-architecture modules** — designed as if Meteor never existed; stateless-where-possible libraries that a future gateway or standalone service would also compose:
   - `http` — `webServer` facade (§Phase 3): connect-style `use()`, raw handlers, `httpServer` accessor, static files, boilerplate/HTML rendering.
   - `methods` — typed method registry + dispatcher with **AsyncLocalStorage invocation context** (`getCurrentUserId()`, `runAsUser()`), replacing `Meteor.methods`/`DDP._CurrentInvocation`/`meteor-run-as-user`. Method params are validated by **ajv schemas at registration** (same machinery as `rest-typings`) — no imperative validation inside handlers.
   - `accounts` — the big one (§Phase 5): tokens, password, login-handler pipeline, account hooks, email token flows, OAuth engine.

   **(b) Transitional compat modules** (`server-core/compat`, deleted or re-homed after Phase 8):
   - `onStartup` — mechanical replacement for `Meteor.startup` (~65 call sites). Scattered startup callbacks are themselves a Meteor-ism; the end state is an explicit boot sequence in `server/main.ts`, consolidated post-migration.
   - `MeteorError` re-export (from `core-services`) — the `error/reason/details` shape is a **wire contract** with existing clients, not an endorsed pattern; a proper error taxonomy is a post-migration, API-versioned discussion.

   **(c) Deliberately NOT replaced** — Meteor idioms that die with Meteor:
   - `check`/`Match` — no port. Validation belongs at transport boundaries: REST already uses ajv schemas; methods gain param schemas as they migrate in Phase 4, and the `check()` calls in their bodies are **deleted**, not renamed. Until a method migrates, Meteor's own `check` keeps working. Small reusable guards that aren't boundary validation go to `@rocket.chat/tools`.
   - Function-level rate limiting (`ddp-rate-limiter`/`rate-limit`) — no port. Rate limiting is a transport concern: REST per-route middleware (exists, `enforceRateLimit`), per-method-name middleware config on the `method.call` route (Phase 4), protocol-level limits in the ws gateway (Phase 6). Login brute-force protection is already RC code (`restrictLoginAttempts`).
   - `meteor/email`, `ostrio:cookies`, global `Assets` — plain npm/fs utilities (nodemailer, `cookie`, `fs`) applied in place (Phase 1); no new abstractions.

4. **Post-migration disposition**: `server-core` is a migration vehicle first. After Phase 8, review it — the target-architecture modules may dissolve into focused packages (e.g. `@rocket.chat/accounts`) once real boundaries are proven; `compat/` must be empty.

### 3.2 Guardrails (Phase 0, before anything else)

- **ESLint `no-restricted-imports`** for `meteor/*` across `apps/meteor`, with the current offender list as a baseline allowlist (like `verify-no-old-imports.mjs`). New code cannot add Meteor imports; the allowlist only shrinks.
- **CI burn-down metric**: a script printing `meteor/* import count` per package, wired into CI output so progress is visible per PR.
- Document the rules in `CLAUDE.md`/contributing docs so external contributors' PRs get steered automatically.

### 3.3 Compatibility contracts (must not change, ever)

- REST surface `/api/v1/*` (typed by `rest-typings`).
- DDP endpoint `/websocket` + sockjs `/sockjs/info` shim; DDP protocol v1 (`connect`/`method`/`sub`); method names including `login`, `logout`, `UserPresence:*`, `stream-*`; `meteor_autoupdate_clientVersions` and `meteor.loginServiceConfiguration` pubs (mobile + bots depend on these — `ddp-streamer` already proves the compatible implementation).
- Login token semantics: raw token → SHA-256 base64 in `users.services.resume.loginTokens[].hashedToken`; `X-Auth-Token`/`X-User-Id` headers. **No schema migration for auth cutover.**
- `users.services.*` document shapes (password bcrypt, email verification tokens, reset tokens, per-service OAuth data).
- OAuth redirect URLs (`/_oauth/<service>`), SAML (`/_saml/*`), CAS (`/_cas/*`) paths.
- File/avatar/asset URL formats.

### 3.4 Target HTTP topology

One Node `http.createServer` — Meteor's instance until Phase 8, then ours; the `server-core/http` facade hides which — with an explicitly ordered pipeline (today this order is implicit in the `rawConnectHandlers`/`connectHandlers`/Meteor-internals split):

1. Security middleware: Force_SSL redirect, security headers, CSP (today scattered in `app/cors/server/cors.ts`).
2. Health/observability: `/health`, `/livez`, `/readyz`, metrics.
3. **REST API at `/api`** — the existing Hono routers, unchanged (hookup below).
4. Dynamic content routes: uploads, avatars, admin-uploaded assets (`/assets`), custom emoji/sounds (GridFS), theme CSS, OAuth/SAML/CAS endpoints, livechat widget, integrations, apps-engine APIs.
5. Static files: client bundle + `public/` (serving model in Phase 7).
6. HTML fallback: rendered `index.html` for client-side routes.
7. Websocket: the DDP gateway attaches to the server's `upgrade` event (Phase 6) — outside the middleware chain.

**How the existing REST API hooks in.** Endpoint definitions never change — they are already Hono routers (`@rocket.chat/http-router`) typed by `rest-typings`. Only the mount point moves, twice, one line each time:

- Today: the router tree is converted to an Express-compatible handler and mounted via `WebApp.rawConnectHandlers.use(API.api.router)` (`server/api/api.ts:startRestAPI`).
- Phase 3: the same Express-compatible handler mounts on the `server-core/http` facade (still backed by Meteor's server underneath).
- Phase 8 (follow-up after the host swap): the facade's native backing is a root Hono app on `@hono/node-server`; the API mounts natively (`app.route('/api', …)`) and http-router's Hono→Express bridge is deleted — it only exists because the host is Meteor's connect chain. Remaining connect-style handlers get a small adapter middleware and migrate to Hono routes opportunistically.

One variable per step: Phase 3 changes the mount host, Phase 8 changes the server, the bridge removal changes the mount style — never two at once.

## 4. Phases

Phases are orderable by dependency, but 1–3 are internally parallelizable into many small PRs — that is the point: dozens of engineers can each take a slice without coordination beyond the allowlist file.

---

### Phase 0 — Scaffold + guardrails (S)

- Create `packages/server-core`, add as dependency of `@rocket.chat/meteor`.
- Land ESLint restriction + baseline allowlist + CI burn-down counter.
- **Exit:** package builds and is imported; CI fails on new `meteor/*` imports.

### Phase 1 — Isolated single-file decouplings (S, fully parallel)

Each is an independent PR with an obvious test:

1. Delete `server/lib/http/call.ts` (dead) → removes `meteor/http`, `meteor/url`.
2. `app/mailer/server/api.ts`: `Email.sendAsync` → nodemailer directly, in place (Meteor's email package is itself a thin nodemailer wrapper). Verify with SMTP settings + Direct Reply + EmailInbox flows.
3. A local fs util (`server/lib/getPrivateAsset.ts` or similar) replaces global `Assets` in `server/routes/i18n.ts`, `server/lib/getMomentLocale.ts`, `server/startup/initialData.ts` (rocketcat avatar), `app/livechat/server/livechat.ts`. Must resolve paths both inside a Meteor bundle and in plain Node (env-resolved base dir).
4. `ostrio:cookies` → the `cookie` npm package (5 files: FileUpload, avatar routes, userDataDownload).
5. `app/ui-master/server` `ReactiveDict` → plain `Map` (server-side reactivity is unused there).
6. `Meteor.bindEnvironment` (3 sites) → plain closures (no-op semantics since Meteor 3 dropped fibers).

- **Exit:** `meteor/email`, `meteor/http`, `meteor/url`, `ostrio:cookies`, `reactive-dict` off the allowlist; global `Assets` unused.

### Phase 2 — Runtime primitives (M, mechanical codemods, parallel by directory)

1. `Meteor.startup` (~65 sites) → `onStartup()` from `server-core/compat`, flushed at the right point in `server/main.ts` (current ordering documented there). Transitional — see §3.1(b).
2. `Meteor.Error` (~205 uses) → `MeteorError` re-exported from `server-core/compat` (keeps `errorType: 'Meteor.Error'` so clients/broker regeneration are unaffected).

Deliberately **not** in this phase (see §3.1(c)): `check`/`Match` and the rate limiters are not ported — they are removed by Phase 4 (methods migration deletes `check()` in favor of param schemas; per-method rate rules become transport middleware). `meteor/check`, `meteor/ddp-rate-limiter`, `meteor/rate-limit` stay on the allowlist until Phase 4 burns them down.

These sweeps churn the same files as MIGRATION_PLAN.md moves — sequence each directory's codemod either before or after its folder move, never concurrently.

- **Exit:** `Meteor.startup`/`Meteor.Error` gone from app code.

### Phase 3 — HTTP host: strangle `WebApp` (M/L)

1. `server-core/http`: `webServer` facade — `use(path, connectHandler)`, `useRaw(...)`, `httpServer`, plus hooks for static-file middleware and HTML boilerplate. Initially backed by a Meteor adapter (`WebApp.connectHandlers`/`rawConnectHandlers`/`rawHandlers`/`httpServer`); at Phase 8, by our own server with the pipeline of §3.4.
2. Migrate all ~25 mount sites (REST mount, integrations, apps-engine api/uikit, federation, oauth2-server, uploads/ufs, avatars, custom assets/emoji/sounds, theme, health/timesync/i18n/robots, livechat widget, SAML/CAS listeners, data export) to the facade. Mechanical; parallelizable per route.
3. Consolidate the special cases into single adapter modules so their Meteor surface is contained:
   - `app/cors/server/cors.ts`: CSP/security headers + Force_SSL (`httpServer` listener rewrite) + `staticFilesMiddleware`/`meteor_runtime_config.js` interception → reimplement headers/SSL as ordinary first-in-chain middleware in `server-core`; the static/runtime-config parts stay in a `meteor-compat` adapter until Phase 7 kills them.
   - `configureBoilerplate.ts` + `inject-initial` (`app/ui-master/server`): define `server-core` HTML-rendering hooks (`injectHead`/`injectBody`/dynamic per-key injections) with a Meteor-backed adapter; the native renderer arrives with Vite (Phase 7).
   - `routepolicy`: becomes a no-op in the facade (only `/_cas/`, `/_saml/`).
4. `dispatch:run-as-user`, `meteor-cookies`, `meteor-inject-initial` local packages become removable as their consumers migrate.

- **Exit:** no file outside `server/meteor-compat/` imports `meteor/webapp`; the HTTP topology is expressed entirely against `server-core/http`.

### Phase 4 — Methods runtime + invocation context (L)

1. `server-core/methods`: `registerMethod(name, schema, fn, options)` with the existing `ServerMethods` typed registry (type stays in `@rocket.chat/ddp-client`, shared with the client); **params validated by ajv schema at the boundary** (closing a real gap — today `method.call` bodies are unvalidated EJSON); dispatcher runs handlers inside AsyncLocalStorage context providing `userId`, `connection`, `token`, `twoFactorChecked`; helpers `getCurrentUserId()`, `runAsUser()` replace `Meteor.userId()`/`Meteor.userAsync()`/`meteor-run-as-user`/`DDP._CurrentInvocation`.
2. Transitional adapter: `registerMethod` also registers into `Meteor.methods` (wrapping to bridge context) so DDP clients (mobile/desktop/bots) are unaffected while Meteor still owns the socket.
3. Flip `POST /api/v1/method.call[Anon]` (`server/api/v1/misc.ts`) from `Meteor.callAsync` to the native dispatcher — the web client's method traffic leaves Meteor here. Same for `applyMeteorContext`-style REST bridging in `ApiClass.ts`. Rate limiting on this route becomes ordinary middleware keyed by method name (replacing `DDPRateLimiter._increment/_check`).
4. Migrate ~164 `Meteor.methods` sites to `registerMethod` (per-domain PRs; coordinate with MIGRATION_PLAN.md's methods moves — ideally ride the same PRs). Each migration: write the param schema, **delete** the `check`/`Match` calls from the body, drop any `DDPRateLimiter.addRule` (becomes middleware config). Where a method is already deprecated in favor of a REST endpoint, prefer finishing the deprecation over migrating it.
5. 2FA: replace `MethodInvocationOverride`/`Accounts._setAccountData` plumbing with fields on the native invocation context.

- **Exit:** app code has zero `Meteor.methods`/`Meteor.userId()`; `meteor/check`, `meteor/ddp-rate-limiter`, `meteor/rate-limit` off the allowlist; REST method path is Meteor-free and schema-validated end-to-end; DDP path still bridges via one adapter.

### Phase 5 — Accounts & auth (XL — the long pole; per-flow rollout)

Build `server-core/accounts` reproducing exactly the semantics the app already relies on (all verified in `app/authentication/server/startup/index.js` and consumers):

1. **Tokens**: stamped login tokens (crypto random → SHA-256 base64 hashed storage — `hashLoginToken` exists), insertion/limit (`ensureLoginTokensLimit`), expiry loop honoring `Accounts_LoginExpiration`.
2. **Password**: bcrypt check/set with SHA-256-digest client convention (`_checkPasswordAsync`, `_bcryptRounds`, `setPasswordAsync`), password history.
3. **Login pipeline**: ordered `registerLoginHandler` chain; hooks `validateLoginAttempt`, `validateNewUser`, `onLogin`, `onLogout`, `onLoginFailure`; `onCreateUser`/`insertUserDoc` overrides; `updateOrCreateUserFromExternalService` (+ `accounts_meld` wrapping). Existing RC handlers (SAML, CAS, LDAP, Crowd, Apple, iframe, token-login, TOTP wrapper, custom OAuth) re-register onto the new pipeline — they are already mostly RC code touching only these primitives.
4. **The `login`/`logout` methods** registered on the Phase 4 registry — REST `/api/v1/login` (`ApiClass._initAuth`) and DDP both dispatch to it (`ddp-streamer` already models this: `configureServer.ts`).
5. **Email flows**: verification/reset/enrollment token generation + validation writing the **same `users.services.{email,password}` shapes** Meteor writes today (zero-migration), templates already RC-owned (`Accounts.emailTemplates` config moves to the new service), `resetPassword`/`verifyEmail` methods reimplemented.
6. **OAuth engine**: replace `meteor/oauth` + `accounts-oauth` + `service-configuration`: `_oauth/<service>` HTTP endpoints (on `server-core/http`), credential secret/pending-credential store, `service-configuration` reads move to the existing `LoginServiceConfiguration` model (SAML already does this). Port the provider glue (`app/lib/server/oauth/*`, `custom_oauth_server.js`, `linkedin-oauth`) onto it.
7. **Rollout**: per-flow feature flags (e.g. `Accounts_NativePipeline`) with the Meteor implementation as fallback; cut over one login service at a time (password → resume → OAuth providers → SAML/CAS/LDAP/Crowd); E2E matrix per flow; run dual in staging. Because token/schema formats are identical, rollback is a flag flip and sessions survive cutover in both directions.

- **Exit:** `meteor/accounts-base`, `meteor/oauth*`, `meteor/service-configuration` off the allowlist; Meteor's accounts packages removable from `.meteor/packages`.

### Phase 6 — Realtime cutover (L)

Prereqs: Phases 4–5 (native method dispatch + login).

1. **Extract the DDP server** from `ee/apps/ddp-streamer` (`Server.ts`, `Client.ts`, presence/method/pub wiring) into a shared package (e.g. `@rocket.chat/ddp-server`). ⚠️ **Licensing decision required**: this code lives under `ee/`; the monolith's community realtime today is Meteor (MIT). Either relicense the extracted core to the community license, or reimplement the (small) protocol core cleanly in `packages/`. The `ddp-streamer` service keeps its EE-only scaling behavior on top.
2. Run the ws server in-process in the monolith on the same HTTP server (`server-core/http`), serving `/websocket` + sockjs info shim; native pubs `meteor_autoupdate_clientVersions`, `meteor.loginServiceConfiguration` (already implemented in `configureServer.ts`).
3. **Streamer backend swap**: `server/modules/streamer/streamer.module.ts` is already RC code; replace the Meteor-backed subclass (`app/notifications/server/lib/Notifications.ts` — `Meteor.publish`/`DDPCommon.stringifyDDP`/`_session.socket`) with the ddp-server-backed one (exists: `ee/apps/ddp-streamer/src/Streamer.ts`). Cross-instance broadcast (Moleculer `InstanceService`) is untouched — it already speaks to `StreamerCentral`.
4. **Presence/session consumers** move from `Meteor.server.sessions` / `Meteor.onConnection` (`server/services/meteor/service.ts`, `ee/server/startup/presence.ts`, sauMonitor) to the ddp-server's connection events (patterns exist in `DDPStreamer.ts`).
5. **Client**: default `SDK_DDP_Transport_Enabled` on (staged: insiders → cloud canary → default; the off-path remains one release as escape hatch). Mobile/desktop/bots see a protocol-compatible server and need no changes.
6. Rate limiting at the protocol layer of the ws gateway (per-connection/per-message limits, `login` attempt limits) — middleware in the DDP server, not rules attached to functions.
- **Exit:** Meteor's livedata/websocket unused by all clients; `Meteor.publish`/DDP internals gone from app code; monolith no longer needs `ddp`, `ddp-rate-limiter`, `autoupdate` Meteor packages at runtime.

### Phase 7 — Client build (Vite) + shim removal (L, overlaps Phase 6)

1. **Remove the client Meteor shims** now that transport + auth are native: login glue (`client/meteor/login/*`, `AuthenticationProvider`) moves to DDPSDK `account` + REST; `userAndUsers.ts` Tracker bridge → direct Zustand wiring; delete vendored minimongo (`client/meteor/minimongo/`) once `Meteor.users` facade consumers are gone; `ddpOverREST`/`subscribeViaSDK`/bridge overrides die with the Meteor connection.
2. **Vite build**: entry `client/main.ts`; native dynamic imports replace `dynamic-import`; asset hashing via content hashes in filenames. Until this phase flips, Meteor keeps building and serving the client — static serving is deliberately the last HTTP concern to leave Meteor.
3. **Serving model** (replaces `WebAppInternals.staticFilesMiddleware` + boilerplate generation; slots into pipeline steps 5–6 of §3.4):
   - **Hashed Vite assets** served with `Cache-Control: public, max-age=31536000, immutable` — content hashes replace the whole `?hash=` / `cache_version` cookie / `Clear-Site-Data` machinery in `cors.ts`.
   - **`public/` files** (sounds, images, `enc.js` service worker, PWA manifest) served at their current URLs — mobile/desktop reference some of them.
   - **`index.html` is not a static file**: rendered from the Vite manifest (entry JS/CSS tags) + runtime config (keep the `__meteor_runtime_config__`-shaped global during transition; `client/lib/meteorRuntimeConfig.ts` is the single accessor) + admin head/body injections (the Phase 3 hooks that replace `inject-initial`/theme CSS wiring) + CSP nonce when enabled. Cached in memory; re-rendered on relevant setting changes (same trigger as today's `generateBoilerplate` on `Site_Url`). Also served as the SPA fallback for client-side routes.
   - **Runtime CDN prefix preserved**: `CDN_PREFIX` is a runtime setting but Vite bakes asset URLs at build time — bridge with Vite's `renderBuiltUrl` emitting references to a global the `index.html` renderer injects (replaces `setBundledJsCssPrefix`). Origin keeps serving assets for CDN pull-through, as today.
   - **Dynamic asset routes are untouched**: admin-uploaded `/assets` (RocketChatAssets), custom emoji/sounds, avatars, uploads are DB/GridFS-backed routes migrated in Phase 3 — never part of the client bundle.
4. **Update notification**: replace `autoupdate` fork — server announces build hash via a stream/setting; `AutoupdateToastMessage` already just does `window.location.reload()`.
5. Dev mode: Vite dev server fronts the app (HMR), proxying `/api`, `/websocket`, and dynamic routes to the backend; `yarn dev` stays one command via turbo — strictly better DX than Meteor rebuilds.
- **Exit:** client bundle produced without Meteor; `client/meteor/` deleted; `meteor/tracker`, `meteor/mongo` (client) gone.

### Phase 8 — Boot cutover & final removal (M)

1. **Mongo**: swap `server/database/utils.ts` from `MongoInternals.defaultRemoteCollectionDriver()` to a raw `MongoClient` (pattern: `packages/core-services/src/lib/mongo.ts`), porting `rocketchat-mongo-config` driver options (TLS, poolSize, oplog url handling). All `MongoInternals` consumers (GridFS, apps scheduler, statistics) read from this one file already or migrate trivially.
2. **Entrypoint**: `server/main.ts` becomes the plain Node entry (its startup sequence is already explicit); the `server-core/http` facade flips to its native backing — a root Hono app on `@hono/node-server` per §3.4, followed by the native `/api` mount that deletes http-router's Hono→Express bridge; build server with the same `tsc`/esbuild pipeline as `ee/apps/*`; `rocketchat-version` info generated by a build script.
3. Delete `.meteor/`, `apps/meteor/packages/*`, `server/meteor-compat/`, Meteor `definition/externals` shims; drop `meteor` from all scripts.
4. **Scripts/infra**: root `yarn dev` → turbo runs server watch + Vite; `build:ci` → node bundle + Vite build; Dockerfiles already end at `node main.js` — only the bundle layout changes; update `run-ha`/`ms` scripts, CI pipelines, docs.
5. Rename cleanup (`apps/meteor` → `apps/rocketchat`?) — optional, separate decision after everything is stable.
- **Exit:** `grep -r "from 'meteor/" apps/` returns nothing; Meteor gone from the lockfile.

---

## 5. Sequencing & parallelism

```
Phase 0 ──► Phase 1 (parallel PRs) ─┐
        ──► Phase 2 (parallel PRs) ─┼─► Phase 4 ─► Phase 5 ─► Phase 6 ─┐
        ──► Phase 3 (parallel PRs) ─┘                    Phase 7 ──────┼─► Phase 8
                                                       (starts with 6)─┘
```

- 1, 2, 3 are independent of each other and internally parallel — ideal "good first migration PR" material for the wider team.
- 4 needs 2 (error/startup) and benefits from 3; 5 needs 4; 6 needs 5; 7's shim removal needs 6's transport flip, but Vite spike work can start anytime (using aliases for the remaining `meteor/*` client imports).
- The folder-structure migration (MIGRATION_PLAN.md Phases 5–7) should ideally land before the Phase 4 methods codemod so the sweep happens on the final layout.

Rough sizing: 0+1 ≈ days; 2–3 ≈ weeks of parallelizable mechanical work; 4 ≈ weeks; 5 ≈ the long pole, 1–2 months elapsed with per-flow rollout; 6–8 ≈ weeks each, mostly integration/rollout care.

## 6. Testing & rollout principles

- **Every phase ships to `develop` behind the existing release train**; no phase requires a schema migration, and auth/realtime cutovers are flag-gated with the Meteor path as rollback for at least one release.
- Regression net: existing Playwright E2E + REST API tests + unit suites run per PR; add targeted E2E for each auth flow before its Phase 5 cutover; add a DDP protocol conformance test (drive `@rocket.chat/ddp-client` + a real mobile-style resume/stream session against both servers).
- Canary order for risky flips (SDK transport, native login, in-process ddp-server): insiders/nightly → Cloud canary tier → default-on → remove old path next release.
- Watch: login success rate, websocket connect/resume errors, message delivery latency (streamer), memory/CPU (two mongo pools during Phase 8 transition), mobile client version telemetry.

## 7. Risks & open decisions

| Risk / decision | Mitigation / owner call needed |
| --- | --- |
| **DDP server licensing** (Phase 6.1): extracted from `ee/` | Decide relicense vs. clean-room reimplement before Phase 6 starts |
| Accounts edge semantics (token expiry quirks, meld, 2FA resume) | Port with tests derived from current behavior; per-flow flags; identical storage = flag-flip rollback |
| Long-tail OAuth providers (fb/twitter/google/linkedin/apple) | Wire-compat `_oauth/*` endpoints; test against provider sandboxes; usage telemetry to prioritize |
| Codemod churn vs. feature PRs (merge conflicts) | Small per-directory PRs, land fast; coordinate via the allowlist file; announce sweeps ahead |
| Meteor client removal breaking subtle reactivity (minimongo facade consumers) | The facade is already down to `Meteor.users`; finish store migration before deleting |
| Two mongo connections during transition (Meteor's + ours) | Acceptable temporarily; Phase 8 consolidates; monitor pool sizes |
| `dynamic-import` → Vite chunking changes load behavior | Bundle-size/route-level load E2E; preload hints |
| Mobile apps relying on undocumented DDP behaviors | Protocol conformance suite + Cloud canary before default flip |

## 8. Immediate next steps

1. Land Phase 0: `packages/server-core` scaffold (done in this branch), ESLint guardrail + baseline, CI counter.
2. Ship the Phase 1 quick wins as individual PRs (mailer, dead HTTP lib, Assets, cookies).
3. Decide the DDP-server licensing question early (it gates Phase 6 planning).
4. Socialize this plan + the burn-down metric with the team; label parallelizable items for contributors.
