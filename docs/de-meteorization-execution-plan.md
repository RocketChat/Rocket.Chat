# De-Meteorization — Execution Plan

Execution guide for removing Meteor from Rocket.Chat. Source documents:

- **Report ch. 10** — target architecture, staged path, parity checklists:
  [`10-de-meteorization.md`](https://github.com/d-gubert/rc-meteor-raw-bundle/blob/f81f3739/docs/10-de-meteorization.md)
- **Discovery resolutions (D1–D12)** — verified inventories, file references, and what already
  exists in-tree: [`de-meteorization-discovery-resolutions.md`](./de-meteorization-discovery-resolutions.md)

Each phase below is written to be executed by an autonomous agent. Phases state their
dependencies, deliverables, verification commands, and an explicit definition of done (DoD).

## Conventions (apply to every phase)

- **Branching/PRs**: one branch per phase (sub-phases may split into stacked PRs). Every PR adds a
  changeset (`yarn changeset`) unless docs/tests-only. Base branch: `develop`.
- **Verification command glossary** (run from repo root unless stated):
  - `TC` = `yarn workspace @rocket.chat/meteor run typecheck` (runs `meteor lint` + `tsc --noEmit`)
  - `LINT` = `yarn workspace @rocket.chat/meteor run lint` (stylelint + meteor lint + eslint);
    for packages: `yarn workspace <pkg> run lint`
  - `UNIT` = `yarn workspace @rocket.chat/meteor run testunit` (definition mocha + jest + server
    mocha); for packages: `yarn workspace <pkg> run testunit`
  - `API` = `yarn workspace @rocket.chat/meteor run testapi` (requires a server running with
    `TEST_MODE=true`, empty DB)
  - `E2E` = `yarn workspace @rocket.chat/meteor run test:e2e` (requires
    `TEST_MODE=true yarn dev` running; see `apps/meteor/tests/e2e/README.md`); scope to files
    when the phase says so
  - `E2E-MS` = same, against microservices mode (`yarn ms` at root, which boots
    ddp-streamer/account-service/etc.)
  - `CONF` = the DDP conformance suite created in **P0** (script name defined there)
- **General DoD rules**: `TC`, `LINT`, and `UNIT` must pass in every phase in addition to the
  phase-specific items; no skipped/`.only` tests left behind; new runtime behavior behind a
  flag must be tested in **both** flag states; a phase is finished only when its PR(s) are open
  with CI green and the phase's DoD checklist is reproduced in the PR description.
- **Wire-compatibility invariants** (violating any of these fails the phase): DDP endpoint paths
  (`/websocket`, `/sockjs/*`), method names and EJSON argument/result semantics,
  `Meteor.Error` shape (`error`, `reason`, `message`, `errorType`), resume-token at-rest format
  (SHA-256/base64, `services.resume.loginTokens`), localStorage keys
  (`Meteor.loginToken`, `Meteor.loginTokenExpires`, `Meteor.userId`), HTTP prefixes
  (`/_oauth/*`, `/_saml/*`, `/_cas`), `/api/info` fields, `enc.js` served from `/`.
  References: resolutions D1, D6; report §10.2, footnotes `tokens`/`swscope`.

## Model selection

| Model | Use for | Phases |
|---|---|---|
| **Fable** | Protocol/wire-compat design, work where a subtle mistake is silent data/session loss, cross-cutting architecture | P0, P5, P6, P3a |
| **Opus** | Broad multi-file engineering with clear contracts, build/infra bring-up, regression burn-down | P1, P2, P4, P7, P3b |
| **Sonnet** | Mechanical, well-templated, high-volume tasks with strong existing tests | P8, P9, checklist sub-items inside P3b explicitly marked |

## Phase dependency graph

```
P0 (conformance suite) ──────────────┬────────────► P5 (gateway) ──┐
P1 (client auth port) ─► P2 (SDK     │              ▲              │
                          transport  │              │              ├─► P7 (boot swap
                          default-on)─┼─► P3 (client build) ─► P4 ─┘    & deletion)
                                     │              (HTTP host)
P0 ──────────────────────────────────┴────────────► P6 (auth extraction) ─► P7
P8 (method→REST long tail)  — continuous, no dependents
P9 (utility long tail)      — after P5+P6 start, before P7 completes
```

---

## P0 — DDP wire-compat conformance suite

**Dependencies:** none. **Model: Fable.**

Build the black-box test suite that every later phase runs against its DDP endpoint. It is the
safety net for P5/P6 and the acceptance gate for the final swap (report §10.5 Stage 0).

### Scope

1. Create `packages/ddp-conformance` (jest, TS). Drive the wire with raw `ws` frames and/or
   `MinimalDDPClient` from `packages/ddp-client/src/MinimalDDPClient.ts`; do **not** use the
   high-level SDK for assertions about framing.
2. The suite takes a target URL via `DDP_CONFORMANCE_URL` (default
   `ws://localhost:3000/websocket`) and a REST base for fixture setup (create users/rooms via
   `/api/v1` with the helpers in `apps/meteor/tests/data`).
3. Test groups (each maps to a resolutions/report reference):
   - **Session**: `server_id` greeting, `connect`→`connected` (session id), unsupported version →
     `failed`, no session resumption (reconnect ⇒ new session), first-message-must-be-connect
     (ddp-streamer closes otherwise — `ee/apps/ddp-streamer/src/Client.ts:127-133`).
   - **Heartbeat**: client `ping`→`pong` (with/without `id`); server-initiated ping cadence;
     idle timeout behavior (`TIMEOUT` in ddp-streamer constants).
   - **EJSON round-trip**: `{"$date": ms}` and `{"$binary": b64}` in method args and results;
     `fields`/`cleared` conventions on `changed` frames (report footnote `ejson`).
   - **Methods**: `method`→`result`+`updated` ordering (updated immediately after result —
     report footnote `fence`); unknown method → error result; `Meteor.Error` wire shape
     (`error`, `reason`, `message`, `errorType: 'Meteor.Error'`) asserted field-by-field for a
     known failing call (e.g. `sendMessage` unauthenticated); `randomSeed` sent-and-ignored.
   - **Auth over DDP**: `login` with resume token (mint via REST login first), result shape
     `{id, token, tokenExpires, type}`; `logout`; deleted-token disconnect (`force_logout`
     stream + socket close, resolutions D1); rejected resume → error 403.
   - **Publications**: `meteor.loginServiceConfiguration` (`added` per service, `ready`),
     `meteor_autoupdate_clientVersions` (`added` then `ready`), `nosub` with error for unknown
     publication.
   - **Streams**: `sub` to `stream-room-messages`/`stream-notify-room` with `{useCollection:
     false, args}` conventions; `ready` timing; `changed` frame shape on pseudo-collections
     (`msg: 'changed', collection: 'stream-…', fields: {eventName, args}`); visitor-token args
     for livechat streams (resolutions D5); `stream-notify-room` emit method; unsub → `nosub`.
   - **Rate limiting**: exceed `DDP_Rate_Limit_User_By_Method` on a cheap method; assert
     `too-many-requests` error with `timeToReset` details (resolutions D9).
   - **SockJS surface**: `GET /sockjs/info` returns `{"websocket":true,...}`; SockJS-framed
     websocket URL accepted (frames wrapped per ddp-streamer `Client.ts` `meteorClient` flag).
4. Wire scripts: `yarn workspace @rocket.chat/ddp-conformance run test` and a root-level
   turbo task; document in the package README how to point it at monolith vs ddp-streamer.
5. Record a baseline: run against current `develop` monolith **and** against `yarn ms`
   (ddp-streamer). Where the two differ today, encode the difference as an explicitly tagged
   test (`describe.each(['monolith','ddp-streamer'])`) rather than papering over it — these
   diffs are P5 work items.

### Definition of done

- [ ] `CONF` green against monolith (`TEST_MODE=true yarn dev`)
- [ ] `CONF` green against `yarn ms` (allowed: tagged, documented behavioral diffs)
- [ ] Divergence list (monolith vs ddp-streamer) committed as `packages/ddp-conformance/DIVERGENCES.md`
- [ ] `TC`, `LINT`, `UNIT` for the new package; turbo task runs it
- Finished when: PR open, CI green, both baseline runs attached to the PR description.

---

## P1 — Port client auth/oauth off Meteor packages

**Dependencies:** none (parallel with P0). **Model: Opus.**

Complete the port of `meteor/accounts-base`, `meteor/oauth`, and the 4 provider packages to
`@rocket.chat/ddp-client` + owned code. Continue (or supersede) PR
[#40413](https://github.com/RocketChat/Rocket.Chat/pull/40413). Inventory of everything that may
import these modules: resolutions **D2** (13 `accounts-base` + 8 `oauth` + 4 provider imports,
41 files total).

### Scope

1. Move token persistence fully onto `client/lib/sdk/storage.ts` (`STORAGE_KEYS` unchanged).
2. Re-implement the OAuth popup flow (`client/meteor/login/oauth.ts`, `CustomOAuth`) against the
   existing server endpoints: `/_oauth/<service>` + `credentialToken`/`credentialSecret`
   handshake; keep serving Meteor's `end_of_popup_response` pages (they are server assets —
   do not change the server side in this phase).
3. Port each login flavour in `client/meteor/login/*` (password, saml, cas, ldap, crowd, and the
   4 OAuth providers) to REST `method.callAnon/login` / SDK calls, preserving the routing rules
   documented in `client/meteor/overrides/ddpOverREST.ts:60-80` (resume over socket, everything
   else over REST).
4. Keep `overrideLoginMethod`/TOTP wrapping (`client/lib/2fa/overrideLoginMethod.ts`,
   `client/meteor/overrides/totpOnCall.ts`) working; e2e `account-totp.spec.ts` is the gate.
5. Delete the `meteor/accounts-base` / `meteor/oauth` imports file-by-file; the ESLint
   restricted-import rule for these specifiers should be enabled at the end of the phase so
   regressions fail lint.

### Definition of done

- [ ] `grep -r "from 'meteor/accounts-base'\|from 'meteor/oauth'\|-oauth'" apps/meteor/client packages` → only `client/meteor/overrides/*` bridge files (or zero, if the bridge is absorbed)
- [ ] `E2E`: `account-login.spec.ts`, `account-totp.spec.ts`, `account-security.spec.ts`,
      `account-forgetSessionOnWindowClose.spec.ts`, `oauth*.spec.ts` (if present) green with
      `?sdk_transport=on` **and** with the flag off
- [ ] Session continuity check: log in on a build of `develop`, upgrade working tree to the phase
      branch, reload — session survives (localStorage keys untouched)
- [ ] `TC`, `LINT`, `UNIT`
- Finished when: PR(s) open, CI green, restricted-import lint rule active.

---

## P2 — SDK transport default-on

**Dependencies:** P1. **Model: Opus** (regression burn-down; the flag flip itself is trivial).

### Scope

1. Flip the `SDK_DDP_Transport_Enabled` setting default to `true`
   (`apps/meteor/server/settings/*` — locate via `grep -rn "SDK_DDP_Transport_Enabled" apps/meteor/server`).
   Keep the setting as kill switch; keep the `?sdk_transport=off` URL override
   (`client/lib/sdk/sdkTransportEnabled.ts`).
2. Run the full `E2E` suite with the new default in monolith mode; triage and fix every failure
   (failures belong to the transport bridge files: `stubMeteorStream.ts`, `ddpOverREST.ts`,
   `subscribeViaSDK.ts`, `ddpSdkCollectionBridge.ts`, `ddpSdk.ts`).
3. Repeat in `E2E-MS` mode (ddp-streamer path — this exercises the
   native-method fast paths documented in `ddpOverREST.ts:17-27`).
4. Add a CI matrix dimension or dedicated workflow so both flag states stay tested until the
   legacy transport is deleted in P7.

### Definition of done

- [ ] Full `E2E` green, flag on, monolith
- [ ] Full `E2E-MS` green, flag on
- [ ] Smoke `E2E` subset green with flag **off** (kill switch works): `account-login.spec.ts`,
      `channel-management.spec.ts`, one messaging spec
- [ ] `API` green
- [ ] `TC`, `LINT`, `UNIT`
- Finished when: default merged, CI matrix includes both states.

---

## P3 — Client build on a standard bundler

**Dependencies:** P2. Two sub-phases; P3a gates P3b.

### P3a — Bundler bring-up + `meteor/*` shims — **Model: Fable**

1. Add an esbuild (or Vite) build for `apps/meteor/client` producing hashed immutable chunks.
   Entry: `client/main.ts`. Alias map (`resolve.alias`) per resolutions **D2** — exactly these
   modules need shims: `meteor/meteor`, `meteor/accounts-base` (thin, mostly gone after P1),
   `meteor/oauth` + 4 providers (thin after P1), `meteor/tracker` (vendor standalone Tracker),
   `meteor/ddp-common` (vendor `parseDDP`/`stringifyDDP` into `client/lib/sdk/ddpProtocol.ts`),
   `meteor/mongo` (type-only). Place shims in `apps/meteor/client/meteor/shims/`.
2. HTML shell: an Express middleware rendering `index.html` with (a) a runtime-config script
   containing only the keys the client reads (`ROOT_URL`, path prefix, DDP URL,
   `PUBLIC_SETTINGS`, version hashes — report §10.4 item 1), (b) the EJSON
   `<script type="application/ejson">` data islands with the existing double-encode scheme
   (report §10.4 item 1), (c) the `rc-sdk-transport-enabled` meta tag.
3. Gate the whole pipeline behind an env flag (e.g. `RC_BUNDLER_CLIENT=1`) so the Meteor client
   build remains the default until DoD is met; both must be runnable from the same server.
4. Version endpoint + staggered reload replacing autoupdate/HCP: poll or push over the SDK
   socket; reload with 2–10 min jitter (report footnote `hcp`). Native apps are unaffected
   (resolutions D7).

### P3b — Asset/URL parity + measurement — **Model: Opus** (items marked ⚙ are Sonnet-suitable)

1. ⚙ Copy-through with URL stability (report §10.4 item 5): `fonts/`, `sounds/`, `images/`,
   PWA manifest, `voice-call-popup.html`, `workers/mp3-encoder/index.js` (path is load-bearing),
   emojione sprite CSS paths, livechat widget bundle (`packages/rocketchat-livechat` output).
2. **`enc.js` must stay at `/enc.js`** — exempt from hashing (report footnote `swscope`). Add an
   e2e assertion that `GET /enc.js` serves the service worker.
3. ⚙ Delete-list wiring (only when flag is on): no `/__meteor__/dynamic-import/fetch` requests,
   no `?meteor_js_resource` fallbacks (report §10.4 item 2).
4. SRI via bundler plugin (report §10.4 item 8).
5. **D11 measurement** (resolutions D11): Playwright trace comparison, cold and warm, on
   login → home → open-room, isobuild client vs bundler client on the same server. Commit the
   report as `docs/de-meteorization-clientbuild-perf.md`. Regression budget: p75 cold
   first-room-paint within +10% of isobuild; otherwise tune chunking before proceeding.

### Definition of done (P3 overall)

- [ ] Full `E2E` green against the bundler-served client (`RC_BUNDLER_CLIENT=1`), monolith and
      `E2E-MS`
- [ ] `E2E` smoke green with flag off (isobuild path unbroken)
- [ ] E2EE file upload/download e2e spec green (proves `enc.js` scope) — `tests/e2e/e2e-encryption*.spec.ts`
- [ ] D11 report committed and within budget
- [ ] `TC`, `LINT`, `UNIT`
- Finished when: bundler client is CI-tested and the perf report is merged. (Flipping the default
  to the bundler client happens in P7.)

---

## P4 — Own the HTTP host

**Dependencies:** P3 (HTML shell middleware exists). **Model: Opus.**

Invert the mounting (report §10.5 Stage 2): Rocket.Chat's Express app owns the listener; Meteor's
`webapp` package is reduced to a compatibility layer and finally bypassed.

### Scope

1. Inventory the 41 `WebApp.*` mounts (report §10.1): `grep -rn "WebApp\." apps/meteor/app apps/meteor/server --include=*.ts --include=*.js`.
   Re-mount each on the owned Express app: REST API, avatars, uploads, i18n assets, OAuth/SAML/
   CAS HTTP endpoints, livechat widget route, `/api/info`.
2. Own `index.html` serving via the P3 middleware; static hashed chunks with immutable cache
   headers; `Assets.get*` call sites (4 — report §10.1) redirected to an assets dir read.
3. Preserve middleware order semantics currently provided by `rawConnectHandlers` vs
   `connectHandlers` (audit each mount's position relative to body parsing and auth).
4. Keep the process still booting under Meteor in this phase — the Express app takes over
   listening/routing, Meteor's webapp handlers get a pass-through mount for anything not yet
   claimed, behind env flag `RC_OWN_HTTP=1` until DoD.

### Definition of done

- [ ] `API` green with `RC_OWN_HTTP=1` (all REST suites: `testapi`, `testapi:livechat`, `testapi:apps`)
- [ ] `E2E` green with `RC_OWN_HTTP=1` (bundler client)
- [ ] Manual-scriptable checks in CI: avatar fetch, file upload+download, `/_oauth/*` round-trip
      (covered by oauth e2e), `/api/info` shape unchanged (assert `version`,
      `minimumClientVersions`, `supportedVersions` — resolutions D7)
- [ ] `yarn workspace @rocket.chat/meteor run ha:start` boots 2 instances (multi-instance routing unaffected)
- [ ] `TC`, `LINT`, `UNIT`
- Finished when: flag-on CI job green and default flipped to on.

---

## P5 — Gateway by default

**Dependencies:** P0 (hard), P4 (same-port mounting). **Model: Fable.**

Promote the ddp-streamer implementation from EE-microservices-only to the default realtime
endpoint in every deployment (report §10.5 Stage 3, reframed per resolutions D12).

### Scope

1. Extract `ee/apps/ddp-streamer/src/{Server,Client,Publication,Streamer,configureServer}.ts`
   into a package (e.g. `packages/ddp-gateway`) consumable both by the standalone EE service and
   in-process by the monolith. Keep the service wrapper in `ee/apps/ddp-streamer` as a thin
   consumer.
2. **InvocationContext** module per the spec in resolutions **D4**: own `AsyncLocalStorage`
   carrying `{userId?, connection?, token?}`; entered by (a) gateway method/sub dispatch,
   (b) REST middleware (replacing `ApiClass.ts:1184-1215` `createMeteorInvocation`),
   (c) `runAsUser(userId, fn)` for broker delegation (replacing
   `apps/meteor/packages/meteor-run-as-user`). Server-side `Meteor.userId()`/`Meteor.userAsync()`
   shims read it (171 call sites stay untouched).
3. **Method registration shim**: a `registerMethod(name, fn)` API on the gateway; adapt the 169
   `Meteor.methods` files via a codemod-friendly wrapper so registrations flow to both Meteor's
   DDP server and the gateway during transition. Method inventory: resolutions Appendix A.
4. **Streamer re-point**: `server/modules/streamer/streamer.module.ts` writes frames to gateway
   sockets instead of Meteor sessions (ddp-streamer's `Streamer.ts` already implements this —
   unify, don't duplicate).
5. **Hand publications**: user document (accounts-owned; port to a change-stream-fed
   publication), `meteor.loginServiceConfiguration` and `meteor_autoupdate_clientVersions`
   (both already in `configureServer.ts` — feed them in-process instead of via broker where
   monolithic).
6. **Rate limiter**: port `app/lib/server/startup/rateLimiter.js` onto the gateway hook,
   preserving the exact mapping in resolutions **D9** (5 groups, ×4 stream factor, dedicated-rule
   skip set, `broadcastAuth` exemption, Prometheus counters, `RATE_LIMITER_SLOWDOWN_RATE`).
7. Run side-by-side: gateway on `/websocket` behind env flag `RC_OWN_GATEWAY=1` while Meteor's
   ddp-server keeps running headless for methods not yet shimmed; then cut over.
8. Presence semantics: reuse the gateway's existing `UserPresence:*` handling and
   `Presence.removeConnection` wiring (`DDPStreamer.ts:236-249`).

### Definition of done

- [ ] `CONF` green against the in-process gateway, **including** every item in
      `DIVERGENCES.md` from P0 resolved to monolith-compatible behavior (file becomes empty or
      each remaining entry has an explicit sign-off note)
- [ ] Full `E2E` green with `RC_OWN_GATEWAY=1` (bundler client, SDK transport on)
- [ ] `E2E-MS` green (standalone ddp-streamer still works from the shared package)
- [ ] `API` green (REST context now enters InvocationContext)
- [ ] Rate-limiter unit tests: one per settings group asserting rule creation/removal on settings
      change and the ×4 stream factor (`UNIT`)
- [ ] Load sanity: `ha:start` with 2 instances + gateway; message delivery across instances
      (covered by e2e message specs run against the HA setup)
- [ ] `TC`, `LINT`, `UNIT`
- Finished when: `RC_OWN_GATEWAY` defaults on and Meteor's ddp-server no longer accepts external
  sockets.

---

## P6 — Auth extraction

**Dependencies:** P0 (hard). Sequence after P5 starts (P5's gateway exercises accounts via shim
first — report §10.5 Stage 4 note). **Model: Fable.**

### Scope

1. Create the owned auth service (server package or `apps/meteor/server/services/auth`),
   reusing `packages/account-utils` and the token/stamped-token/`loginViaResume`/expiration code
   already written in `ee/apps/account-service/src/lib/*` (resolutions D6). Token at-rest format
   is frozen: SHA-256 → base64, unsalted, `{hashedToken, when}` in
   `services.resume.loginTokens` (report footnote `tokens`).
2. Lift the pipeline contract: ordered login handlers (first non-undefined wins), composite
   `validateLoginAttempt` veto, `onLogin`/`onLogout`/`onLoginFailure` reactions. Port the 9
   handlers from the table in resolutions **D6** (files listed there) plus `password` and
   `resume` equivalents; port the hook registrations (`sauMonitorHooks.ts`, auth startup,
   livechat business hours, EE presence).
3. Keep `login`/`logout`/`getNewToken`/`removeOtherTokens`/`forgotPassword`/`resetPassword`/
   `verifyEmail`/`changePassword` method names and result shapes on the gateway; `/api/v1/login`
   continues to call the same pipeline (currently `ApiClass.ts:1068`).
4. OAuth/SAML/CAS server machinery: keep `/_oauth/*`, `/_saml/*`, `/_cas` endpoints and the
   `credentialToken` handshake; move `ServiceConfiguration` reads/writes to a plain collection
   accessor; keep publishing `meteor_accounts_loginServiceConfiguration` via the gateway
   (already done in `configureServer.ts:14-45`).
5. `Accounts_LoginExpiration` enforcement: pruning job equivalent to current behavior
   (`server/services/meteor/userReactivity.ts` + accounts pruning), same window semantics.
6. Deleted-token disconnect + `loginServiceConfiguration` change push stay wired (the two
   reactive behaviors — report §10.2 #2; both already exist as hand-rolled listeners).

### Definition of done

- [ ] `CONF` auth group green (resume/logout/force_logout/loginServiceConfiguration)
- [ ] `API` green — especially `tests/end-to-end/api/users.ts`, login/logout/PAT suites
- [ ] `E2E` green: all `account-*.spec.ts`, `admin-users*.spec.ts`, SAML spec
      (`tests/e2e/saml*.spec.ts` if present), TOTP spec
- [ ] **Cutover continuity test** (must be automated in the phase branch): create sessions +
      PATs on `develop` build against a DB volume, boot the phase build on the same volume,
      assert REST `X-Auth-Token` auth, DDP resume, and PAT auth all succeed with the old tokens
- [ ] LDAP/CAS/Crowd handlers: unit tests over the ported handler functions (mock directory
      responses) since CI lacks live backends; `UNIT`
- [ ] `TC`, `LINT`
- Finished when: accounts packages are no longer in the login path (verifiable by grep:
  `Accounts.registerLoginHandler` remaining only in the compatibility shim, if any).

---

## P7 — Boot swap and Meteor deletion

**Dependencies:** P3, P4, P5, P6 all defaulted-on. **Model: Opus.**

### Scope

1. Server bundle: esbuild `apps/meteor/server/main.ts` → ESM `dist/main.mjs`; `meteor/*`
   specifiers resolved by aliases to server shims (`Meteor.Error`, `Meteor.startup` → run-after-
   wiring per existing orchestration in `server/main.ts`, `Meteor.absoluteUrl`, `Random`,
   vendored `check`/`Match` and `EJSON`, `Assets` → `fs.readFile`, `MongoInternals` → owned
   connection module absorbing `rocketchat-mongo-config` options/env translation).
2. Mailer: replace the single `Email.sendAsync` site (`app/mailer/server/api.ts:179`) with a
   nodemailer transport built from `MAIL_URL`/SMTP settings per resolutions **D8**; keep
   `configureSMTP.ts` semantics.
3. Flip client default to the bundler build; delete isobuild client path, vendored `autoupdate`
   package, dynamic-import/HCP plumbing, `client/meteor/minimongo` + `userAndUsers.ts` bridge
   (requires `Meteor.user()`/`Meteor.users` consumers gone — verify by grep, port stragglers).
4. Remove `.meteor/` from the build path: `node dist/main.mjs` starts the server; update
   `package.json` scripts (`dev`, `start`, `build:ci`), Docker images, `docker-compose*`,
   `.github/workflows` build jobs.
5. Delete `apps/meteor/packages/*` Meteor packages that became dead (`meteor-run-as-user`,
   `meteor-cookies` → `cookie-parser`, `meteor-inject-initial`, `rocketchat-mongo-config`,
   `autoupdate`), and the `.meteor/packages` manifest itself once nothing consumes it.
   `rocketchat-version`'s compile plugin becomes a build script emitting the same module
   (`/api/info` fields unchanged — resolutions D7).
6. Update `typecheck`/`lint` scripts to drop `meteor lint` (replace with the bundler's check or
   remove); ensure eslint config no longer needs Meteor globals.

### Definition of done

- [ ] `node dist/main.mjs` boots against a clean Mongo and serves login → home → messaging
      (drive via `E2E` pointed at it: `BASE_URL=http://localhost:3000 yarn test:e2e`)
- [ ] Full `CONF`, `API` (all three suites), `E2E`, `E2E-MS` green on the new boot path
- [ ] `UNIT` green with mocha/jest configs updated for the new module format
- [ ] Docker image builds from the new artifact; compose smoke test passes
- [ ] `grep -rn "from 'meteor/" apps/meteor --include=*.ts --include=*.tsx --include=*.js`
      returns only shim-internal files; CI guard added to keep it that way
- [ ] Updated `TC`/`LINT` definitions pass
- Finished when: `develop` CI runs entirely without the `meteor` CLI.

---

## P8 — Method → REST long tail (continuous)

**Dependencies:** none; runs in parallel with everything. **Model: Sonnet.**

Work the `ddp-removal` backlog: GitHub todo-issues labeled `todo` with `(ddp-removal)` titles
(e.g. [#41000](https://github.com/RocketChat/Rocket.Chat/issues/41000),
[#40710](https://github.com/RocketChat/Rocket.Chat/issues/40710)) and any Jira `ARCH-*` items.
Per item:

1. Follow `docs/api-endpoint-migration.md` (typed `API.v1.get/post` routes, AJV request/response
   schemas).
2. Add the endpoint, switch the web client call site, keep the DDP method registered and
   deprecation-logged (`methodDeprecationLogger`) for external clients.
3. Add `API` coverage for the new endpoint; keep or add a test for the deprecated method until
   its removal release.

### Definition of done (per item)

- [ ] New endpoint + `API` tests green; affected `E2E` spec green; `TC`, `LINT`, `UNIT`
- [ ] Changeset present; todo-issue closed with a link to the PR
- Item finished when merged; the workstream never "finishes" — it drains the Appendix A list.

---

## P9 — Utility long tail

**Dependencies:** start any time after P5/P6 are underway; must complete before P7's deletion
step. **Model: Sonnet.**

Small, independent replacements (report §10.2 "long tail"; each is a one-PR task):

| Item | Action | Verify with |
|---|---|---|
| `check`/`Match` (747 sites) | vendor the package as `@rocket.chat/check` (isomorphic, dep-light); alias | `TC`, `UNIT` |
| `Random` | wrap `crypto` in `@rocket.chat/random` (already exists — `packages/random`; migrate imports) | `UNIT` |
| `ostrio:cookies` | replace with `cookie-parser` (already a dep) | `API` (cookie-auth paths) |
| `HTTP.call` legacy sites (3) | replace with `@rocket.chat/server-fetch` | `UNIT` + targeted `API` |
| `sha` package imports | `packages/sha256` (exists) | `UNIT` |
| `EJSON` imports | vendor `ejson` npm (ddp-streamer already consumes it) | `CONF` EJSON group |
| `session`/`reactive-dict`/`reload` client vestiges | delete imports (none in source per D2 — remove from `.meteor/packages` only in P7) | `TC` |

### Definition of done (per item)

- [ ] Zero remaining imports of the replaced module (grep in PR description)
- [ ] `TC`, `LINT`, `UNIT` + the row's verify column
- Finished when all rows are merged.

---

## Execution order summary

| Order | Phase | Model | Blocking for |
|---|---|---|---|
| 1 (parallel) | P0 conformance suite | Fable | P5, P6 |
| 1 (parallel) | P1 client auth port | Opus | P2 |
| 1 (parallel) | P8 method→REST (continuous) | Sonnet | — |
| 2 | P2 SDK transport default | Opus | P3 |
| 3 | P3 client build (P3a Fable, P3b Opus/Sonnet) | mixed | P4, P7 |
| 4 | P4 HTTP host | Opus | P5, P7 |
| 5 | P5 gateway default | Fable | P7 |
| 6 | P6 auth extraction | Fable | P7 |
| 6 (parallel) | P9 utility long tail | Sonnet | P7 |
| 7 | P7 boot swap & deletion | Opus | — |
