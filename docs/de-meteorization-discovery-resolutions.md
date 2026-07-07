# De-Meteorization Discovery Backlog — Resolutions

This document resolves the twelve discovery items (**D1–D12**) flagged in chapter 10 of the
Meteor Bundle Report (["De-Meteorizing Rocket.Chat: Couplings, Distances, and a Concrete
Path"](https://github.com/d-gubert/rc-meteor-raw-bundle/blob/f81f3739/docs/10-de-meteorization.md),
§10.7). Every claim below was verified against the Rocket.Chat monorepo at commit
`38e80cb47919ca6aaedec6870f5702a1f94bb35c` (develop, 2026-07-07) unless an external source is
cited. File references are repo-relative.

## The headline finding

**The de-Meteorization described in chapter 10 is not a proposal — it is an active, partially
shipped program inside this repository.** Several discovery items resolve to "already built":

- A **plain-Node DDP gateway already exists and ships to production**: `ee/apps/ddp-streamer` is a
  standalone microservice (polka + `ws`, no Meteor) that speaks the DDP subset, serves
  `/websocket`, emulates the SockJS info handshake, publishes the three residual collections by
  hand, natively handles `login`(resume)/`logout`/`UserPresence:*`/`stream-*`, and delegates
  everything else to the monolith over the service broker (`MeteorService.callMethodWithToken`).
- A **plain-Node auth service already exists**: `ee/apps/account-service` re-implements the resume
  token semantics (SHA-256/base64 stamped tokens, `loginExpiration`) with line-level references to
  Meteor's `accounts_server.js`, and `packages/account-utils` exports `hashLoginToken` used by the
  REST auth middleware.
- The **web client is mid-migration onto `@rocket.chat/ddp-client`**: behind the
  `SDK_DDP_Transport_Enabled` staged-rollout flag (`client/lib/sdk/sdkTransportEnabled.ts`), the
  Meteor connection's transport is stubbed (`client/meteor/overrides/stubMeteorStream.ts`), method
  calls go over REST (`ddpOverREST.ts` → `/api/v1/method.call[Anon]`), subscriptions go through the
  SDK socket (`subscribeViaSDK.ts`), and the client cache has been rewritten on Zustand stores
  (`client/lib/cachedStores`, `client/stores`) with minimongo surviving only as a vendored
  compatibility shim for `Meteor.users`.
- There is an ongoing **`ddp-removal` workstream** (Jira `ARCH-*`, GitHub todo-issues, e.g.
  [#41000](https://github.com/RocketChat/Rocket.Chat/issues/41000),
  [#40710](https://github.com/RocketChat/Rocket.Chat/issues/40710)) migrating individual DDP
  methods to typed REST endpoints.

The practical consequence for the chapter-10 plan: Stage 3 (gateway) and Stage 4 (auth) have
working reference implementations in-tree, and Stage 1 (client) is underway via the shim/override
strategy the chapter proposed. The genuinely open items are the client *build* (isobuild is still
the only bundler — see D11) and finishing the method/stream migration long tail.

---

## D1 — DDP method/stream inventory, per-client usage, randomSeed, SockJS

**Status: resolved** (inventory + per-client transport matrix; a per-client × per-method audit of
the mobile app remains optional, see "Residual").

### Method inventory

Methods are registered in two layers, both enumerable from source:

1. **App methods via `Meteor.methods(...)`** — 169 registration files in `apps/meteor`, yielding
   **181 distinct method names** (Appendix A). All are also declared in the typed registry: the
   `ServerMethods` interface in `packages/ddp-client/src/types/methods.ts`, augmented by **176
   `declare module` sites** across the monorepo (~200 typed names — the superset includes methods
   registered by Meteor packages, e.g. `resetPassword`, `verifyEmail`, `createToken`). This typed
   registry *is* the definitive inventory the chapter asked for, and it is enforced by the
   compiler for every client-side `sdk.call(...)`/`callAsync`.
2. **Runtime/framework methods registered outside app code**: `login`, `logout`,
   `logoutOtherClients`, `getNewToken`, `removeOtherTokens`, `forgotPassword`, `changePassword`,
   `configureLoginService` (accounts packages); one `stream-<name>` method per streamer (the
   client→server emit path, registered by `server/modules/streamer/streamer.module.ts`); and the
   `UserPresence:*` trio. `ee/apps/ddp-streamer/src/configureServer.ts` shows exactly which of
   these a gateway must implement natively: `login` (resume shape only), `logout`,
   `UserPresence:setDefaultStatus|online|away`, `setUserStatus`, plus the `stream-*` emitters —
   everything else can be proxied to the method host (`Server.ts:68-71` falls back to
   `MeteorService.callMethodWithToken`).

### Stream inventory

The typed registry `StreamerEvents` (`packages/ddp-client/src/types/streams.ts`, 499 lines) is
definitive — 17 public stream names, each with typed event keys and payloads:

`apps`, `apps-engine`, `canned-responses`, `importers`, `integrationHistory`,
`livechat-inquiry-queue-observer`, `livechat-room`, `local` (internal), `notify-all`,
`notify-logged`, `notify-room`, `notify-room-users`, `notify-user`, `roles`, `room-data`,
`room-messages`, `user-presence`.

Instantiation sites: `server/modules/notifications/notifications.module.ts:51-93`. Only **three
cursor-fed publications** remain besides the streamer wrapper: `meteor.loginServiceConfiguration`
and `meteor_autoupdate_clientVersions` (both already hand-published by ddp-streamer,
`configureServer.ts:22-65`) and the user-doc publication owned by accounts-base. `Meteor.publish`
appears in source only in the streamer wrapper (`app/notifications/server/lib/Notifications.ts:13`)
and the vendored `autoupdate` package.

### Per-client transport matrix

| Client | Methods | Realtime | Login | Notes |
|---|---|---|---|---|
| Web (this repo) | REST `POST /api/v1/method.call[Anon]/<name>` via `ddpOverREST.ts` when SDK transport is on; classic DDP otherwise | SDK websocket (`/websocket`), `stream-*` subs | resume over the SDK/Meteor socket; password/SAML/OAuth over REST | one WebSocket per page when flag is on |
| Mobile (Rocket.Chat.ReactNative) | REST `method.call[Anon]` (`app/lib/services/sdk.ts`, `methodCallWrapper`); DDP fallback | raw `/websocket`, subscribes `stream-room-messages`, `stream-notify-room` (`typing`, `user-activity`, `deleteMessage`, `deleteMessageBulk`, `messagesRead`), `stream-notify-all`, `stream-notify-logged`, `stream-notify-user` (incl. `force_logout`), `stream-roles`, `stream-user-presence` | REST `/api/v1/login` | most data ops are plain REST |
| Desktop (Rocket.Chat.Electron) | n/a — wraps the web client | n/a (inherits web) | n/a | own update path is electron-updater + supportedVersions JWT (see D7) |
| Livechat widget (`packages/livechat`) | REST `/api/v1/livechat/*`; DDP only for `stream-notify-room` emits | SDK websocket: `room-messages`, `notify-room` (`user-activity`, `deleteMessage`), `livechat-room` | visitor token, no accounts login | see D5 |
| Bots/SDK (`packages/ddp-client` legacy wrapper) | DDP `callAsync` (arbitrary methods) | `room-messages`, `notify-room` (`typing`, `deleteMessage`), `notify-all`, `notify-logged`, `notify-user` (`message`, `notification`, `rooms-changed`, `subscriptions-changed`, `uiInteraction`) | DDP `login` | `RocketchatSDKLegacy.ts` |

### randomSeed / stub-id agreement

**No RC method relies on it.** There are zero client-side method stubs in the web client (no
`Meteor.methods` call anywhere under `apps/meteor/client` or client-side packages), so the
server never needs the client's random seed to reproduce generated ids. Where client-generated
ids exist they are **explicit application-level arguments**: e.g. the message `_id` is created
with `Random.id()` in `client/lib/chats/data.ts:27` and sent inside the message object;
`sendMessage`'s server signature accepts `_id` as a parameter
(`app/lib/server/methods/sendMessage.ts`). `randomSeed` exists only as an optional field in the
protocol typings (`packages/ddp-client/src/types/methodsPayloads.ts:13`). A gateway can ignore
`randomSeed` entirely.

### SockJS fallback

**Websocket-only is already the shipped production posture for gateway deployments.**
`ee/apps/ddp-streamer` serves the SockJS *info* handshake (`{"websocket":true,...}` at
`GET /sockjs/info`, `DDPStreamer.ts:276-285`) and accepts SockJS-framed *websocket* connections
(any URL other than `/websocket` gets SockJS framing, `Client.ts` `meteorClient` flag), but has
**no xhr-polling or other fallback transports** — and this has been the EE microservices
deployment for years. All native clients and the SDK connect to raw `/websocket`
(`DDPSDK.create('wss://…/websocket')`). Recommendation confirmed: implement the gateway as native
`ws` + the SockJS info-endpoint shim, exactly as ddp-streamer does; keep `/sockjs/*`-framed
websocket URLs for old web sessions during transition; drop polling transports.

### Residual

A per-method audit of which of the ~180 methods the mobile/desktop/bot populations actually call
would refine the deprecation order of the REST migration but does not gate the gateway: the
gateway proxies *all* methods uniformly (ddp-streamer proves the pattern). The `ddp-removal`
todo-issue stream is already producing this data method-by-method as endpoints get migrated.

---

## D2 — Eager client entry: full `meteor/*` import inventory

**Status: resolved.** Source (not the minified bundle) now answers this exactly. The entire client
tree — eager and lazy — imports **10 distinct `meteor/*` modules from 41 files**, total 66 import
statements:

| Module | Imports | Importers (concentration) |
|---|---:|---|
| `meteor/meteor` | 33 | overrides, login flows, providers |
| `meteor/accounts-base` | 13 | login flows, `UserProvider`, SDK bridge |
| `meteor/oauth` | 8 | `client/meteor/login/*`, `CustomOAuth` |
| `meteor/tracker` | 6 | vendored minimongo (2), overrides (2), SDK bridge, `watch.ts` |
| `meteor/facebook-oauth`, `google-oauth`, `twitter-oauth`, `meteor-developer-oauth` | 1 each | corresponding `client/meteor/login/*` file |
| `meteor/mongo` | 1 | vendored `MinimongoCollection.ts` (type only) |
| `meteor/ddp-common` | 1 | `client/lib/sdk/ddpProtocol.ts` (re-exports `parseDDP`/`stringifyDDP` — the wire codec was already centralized behind one file by PR [#40486](https://github.com/RocketChat/Rocket.Chat/pull/40486)) |

Everything Meteor-touching is already **corralled into `client/meteor/`** (overrides, login,
vendored minimongo, startup) plus `client/lib/sdk/` — a deliberate refactor (PR
[#36895](https://github.com/RocketChat/Rocket.Chat/pull/36895) "Recolocate Meteor-related
client-side modules under `client/meteor`"). The eager entry (`client/main.ts`) loads
`./meteor/overrides` + `./meteor/startup` + `./lib/sdk/ddpSdk` and then dynamic-imports the rest.

The eager Meteor *runtime* beyond source imports is defined by `.meteor/packages`: accounts-*
(base/password/oauth + 4 providers), `oauth`/`oauth2`, `check`, `ddp-rate-limiter`, `email`,
`ddp-common`, `webapp`, `mongo`, `reload`, `service-configuration`, `session`, `tracker`,
`reactive-dict`, `reactive-var`, `dynamic-import`, `autoupdate` (vendored fork in
`apps/meteor/packages/autoupdate`). No Blaze, no jQuery, no legacy arch. The shim list for §10.4
item 3 is therefore closed: `meteor`, `accounts-base`, `oauth` (+4 provider shims), `tracker`,
`ddp-common` (vendor `parseDDP`/`stringifyDDP`), and nothing else — `mongo` disappears with the
vendored minimongo type, and `session`/`reactive-dict`/`reload` have no source importers.

---

## D3 — Client cache architecture: minimongo vs `CachedCollection`, Tracker depth

**Status: resolved — and the "one architectural client decision" has already been made and
executed upstream.**

- **The cache layer is Zustand, not minimongo.** `client/lib/cachedStores/` implements
  `CachedStore` (localforage/IndexedDB persistence, version-stamped, EJSON-encoded records,
  `_updatedAt`-based delta sync on reconnect) feeding `DocumentMapStore` Zustand stores. The five
  persisted caches are `rooms`, `subscriptions`, `permissions`, `public-settings`,
  `private-settings` (`CachedStore.ts:19`). In-memory global stores live in `client/stores/`:
  `Messages`, `Permissions`, `Roles`, `Rooms`, `Settings`, `Subscriptions`, `Users`.
- **Tracker is residually present at exactly 3 production call sites**, all inside the
  compatibility bridge itself: `client/meteor/overrides/userAndUsers.ts:17` (mirrors
  `Accounts.connection.userId()` into the Zustand `userIdStore`),
  `client/lib/sdk/meteorBackedSdk.ts:43`, and the vendored minimongo's own reactivity
  (`client/meteor/minimongo/Cursor.ts`). `useTracker` is gone from application code (PRs
  [#40445](https://github.com/RocketChat/Rocket.Chat/pull/40445),
  [#40446](https://github.com/RocketChat/Rocket.Chat/pull/40446) replaced the last autorun
  bridges with `useSyncExternalStore`).
- **Minimongo survives only as a vendored shim** (`client/meteor/minimongo/`, in-repo copy with
  its own tests) whose single consumer is the `Meteor.users` / `Meteor.user()` compatibility
  override (`userAndUsers.ts:22-38`), which re-points Meteor's user collection at the Zustand
  `Users` store. The UI reads through stores/React Query, not through minimongo queries.
- The Tracker→React bridge concern from §10.2 #4 is therefore obsolete; what remains to delete is
  the `userAndUsers.ts` bridge itself, which goes away with `accounts-base` (tracked by todo-issue
  [#40884](https://github.com/RocketChat/Rocket.Chat/issues/40884)).

Storage-key contract confirmed: `client/lib/sdk/storage.ts` pins `Meteor.userId`,
`Meteor.loginToken`, `Meteor.loginTokenExpires` (plus E2EE keys) — "the keys mirror the names
Meteor originally wrote so sessions persist across the Meteor → SDK migration."

---

## D4 — apps-engine + `dispatch:run-as-user` impersonation semantics

**Status: resolved.** The impersonation surface is smaller than feared:

- `dispatch:run-as-user` is a **vendored fork** (`apps/meteor/packages/meteor-run-as-user/`,
  ~25 lines that matter): `Meteor.runAsUser(userId, f)` creates a fresh `MethodInvocation`,
  `setUserId(userId)`, and runs `f` inside `DDP._CurrentInvocation.withValue(...)`
  (`lib/common.js`). Its **only production consumer** is
  `MeteorService.callMethod/callMethodWithToken` (`server/services/meteor/service.ts:203`) — i.e.
  the delegation path that lets **ddp-streamer** (and anything broker-side) invoke methods with a
  user identity. (It also overrides collection mutators to *deny* untrusted-style writes while
  impersonating — `lib/collection.overwrites.js` — which is irrelevant once server code writes
  through the raw driver, as RC does.)
- **The apps-engine does not touch the ambient invocation context at all.** Zero hits for
  `runAsUser`/`_CurrentInvocation` in `packages/apps-engine` and `apps/meteor/app/apps`. Bridges
  pass explicit actor users into internal server functions (e.g. the command bridge calls
  `executeCommand(command, context)` with the user in the context object; message bridges call
  `sendMessage(user, ...)`). App impersonation is *parameter passing*, not context manipulation.
- The REST API's context entry is `ApiClass.ts:1184-1215` (`createMeteorInvocation`): build a
  `MethodInvocation` with `{connection, userId}`, register the token in `Accounts._accountData`,
  and `DDP._CurrentInvocation.withValue(invocation, action)`.

**Spec for the replacement `InvocationContext` module** (per §10.2 #3): a context value of
`{userId?, connection?, token?}` entered at three boundaries — gateway message dispatch, REST
middleware, and an explicit `runAsUser(userId, fn)` re-entry API for broker delegation. Nothing
else in the codebase (including apps-engine) requires deeper semantics.

---

## D5 — Livechat widget transport and server endpoints

**Status: resolved.** The widget (`packages/livechat`, a Preact SPA built by webpack) uses
`LivechatClientImpl` from `packages/ddp-client/src/livechat/`:

- **All data operations are REST** under `/api/v1/livechat/*`: `config`, `room`, `visitor`,
  `message`, `messages.history/:rid`, `agent.info`/`agent.next`, `room.close`, `room.survey`,
  `transcript`, `offline.message`, `page.visited`, `custom.field(s)`, `visitor.status`, `upload/:rid`,
  plus `/apps/ui.interaction/:appId` (`LivechatClientImpl.ts:126-323`).
- **Realtime is the SDK websocket** with visitor-token-scoped stream subs: `room-messages`,
  `notify-room` (`/user-activity`, `/deleteMessage`), and `livechat-room` (room status/agent
  changes), each passing `{ token, visitorToken }` as subscription args.
- **DDP methods used: effectively one** — the widget *emits* typing/user-activity via
  `callAsync('stream-notify-room', ...)` (`LivechatClientImpl.ts:114-118`). (`sendMessageLivechat`
  etc. remain registered server-side but the widget path is REST.)

**Constraint on the gateway:** the widget requires unauthenticated (visitor-token) stream
subscriptions with per-key token args and the `stream-notify-room` emit method — both already
handled by the streamer's own permission callbacks, and both already work through ddp-streamer.
No publication/mergebox features are needed. The widget bundle is copy-through in a new build
(already an independent webpack artifact served by `apps/meteor/packages/rocketchat-livechat`).

---

## D6 — Login handlers: provider list, REST-vs-DDP flows, token TTL

**Status: resolved.**

**The 9 in-repo `registerLoginHandler` sites** (matching the bundle's count):

| Handler | File |
|---|---|
| `ldap` | `server/configuration/ldap.ts:9` |
| `cas` | `server/configuration/cas.ts:30` |
| `totp` (wraps password login) | `app/2fa/server/loginHandler.ts:17` |
| `iframe` | `app/iframe-login/server/iframe_server.ts:8` |
| `login-token` | `app/token-login/server/login_token_server.js:5` |
| `crowd` | `app/crowd/server/crowd.ts:366` |
| `apple` | `app/apple/server/loginHandler.ts:7` |
| OAuth (unnamed, all providers incl. CustomOAuth) | `app/lib/server/oauth/oauth.js:18` |
| `saml` | `app/meteor-accounts-saml/server/loginHandler.ts:15` |

plus the `password` and `resume` handlers inside the accounts packages. Gates and reactions:
**one composite `Accounts.validateLoginAttempt`** (`app/authentication/server/startup/index.js:477`)
which fans out to RC's own `beforeValidateLogin`/`onValidateLogin` callback chains (license seat
checks, deactivation, App events live behind it); `Accounts.onLogin` ×4 (auth startup, SAU
monitor, livechat business hours, EE presence), `Accounts.onLogout` ×3, `onLoginFailure` ×1
(failed-login events + audit).

**REST vs DDP:** `/api/v1/login` is implemented *as* the DDP `login` method run under a fabricated
invocation (`ApiClass.ts:1068`), so both surfaces share one pipeline — including SAML/CAS/OAuth
credential-token redemption (mobile logs in by POSTing `credentialToken` to `/api/v1/login`).
Browser flows keep `/_oauth/*`, `/_saml/*`, `/_cas` HTTP endpoints. With the SDK transport flag on,
the web client itself routes non-resume logins over REST and only `login{resume}` over the socket
(`ddpOverREST.ts:60-80` documents why).

**Token TTL:** `Accounts_LoginExpiration` setting (default **90 days**,
`server/settings/accounts.ts:243`) → `Accounts._options.loginExpirationInDays` kept in sync by a
settings watcher (`app/authentication/server/startup/index.js:45-60`). Expired-token pruning also
runs in RC's own code (`server/services/meteor/userReactivity.ts:10-11`). Personal access tokens
and resume tokens share the `services.resume.loginTokens` array and the same SHA-256/base64
hashing — REST auth verifies via `hashLoginToken` from **`packages/account-utils`**
(`server/api/v1/middlewares/authentication.ts:28`), and **`ee/apps/account-service`** already
implements stamped-token generation, hashing, `loginViaResume`, and expiration in plain Node
(`src/lib/utils.ts:33-57`, `src/Account.ts`). The "keep the exact at-rest format" requirement from
§10.2 #2 is thus already codified in owned, non-Meteor code.

---

## D7 — Native wrappers vs `meteor_autoupdate_clientVersions` / `minimumClientVersions`

**Status: resolved — native apps do not use the Meteor autoupdate machinery.**

- **Desktop** (Rocket.Chat.Electron): server compatibility is determined by the
  **supportedVersions JWT** mechanism — `/api/info` (including the `supportedVersions.signed`
  field and `minimumClientVersions`), the cloud supported-versions endpoint, and a built-in
  fallback JWT, verified RS256 client-side and evaluated with semver
  ([`src/servers/supportedVersions/main.ts`](https://github.com/RocketChat/Rocket.Chat.Electron/blob/develop/src/servers/supportedVersions/main.ts)).
  App updates use electron-updater. No DDP, no `meteor_autoupdate_clientVersions`.
- **Mobile** (Rocket.Chat.ReactNative): same supportedVersions/semver mechanism
  ([`app/lib/methods/checkSupportedVersions.ts`](https://github.com/RocketChat/Rocket.Chat.ReactNative/blob/develop/app/lib/methods/checkSupportedVersions.ts));
  no autoupdate subscription in its connection layer.
- **Server side**: `minimumClientVersions` is baked at build time by the vendored
  `rocketchat-version` compiler plugin (`packages/rocketchat-version/plugin/compile-version.js:86`)
  and served over REST by `server/api/lib/getServerInfo.ts:26`. This is independent of isobuild in
  substance — the plugin just needs to become a build script writing the same module.
- The **only consumer of `meteor_autoupdate_clientVersions` is the web client itself** (vendored
  `autoupdate` package), and ddp-streamer already re-implements the publication
  (`configureServer.ts:47-65`) fed by `MeteorService.getAutoUpdateClientVersions()`.

**Conclusion:** the HCP replacement (version endpoint + staggered reload) cannot break native
update prompts — they never depended on it. Keep `/api/info`'s `version`, `minimumClientVersions`,
and `supportedVersions` fields stable and native clients are unaffected.

---

## D8 — Outbound mail path

**Status: resolved — one call site, mechanical replacement.**

- All application mail funnels through `app/mailer/server/api.ts:179` — the **single**
  `Email.sendAsync` call site in the codebase (password reset, invites, admin mail, etc. all build
  on this module).
- SMTP admin settings are translated into `process.env.MAIL_URL` at runtime by
  `server/configuration/configureSMTP.ts` (protocol/user/pass/host/port/pool → URL); Meteor's
  `email` package (nodemailer inside) reads `MAIL_URL` per send.
- The `rocketchat:mongo-config` wrapper (`packages/rocketchat-mongo-config/server/index.js:42-57`)
  does **not** reroute real mail: in TEST_MODE it logs; in non-development it injects a default
  `stream` sink so that *unconfigured* servers (no `MAIL_URL`) devnull instead of dumping RFC822 to
  stdout. With `MAIL_URL` set, mail goes to real SMTP.
- Independent mail paths already bypass Meteor entirely: omnichannel Email Inbox uses **nodemailer
  directly** (`server/features/EmailInbox/EmailInbox.ts:75`).

**Replacement:** swap the one `Email.sendAsync` call for a direct nodemailer transport built from
the same `getMailURL()`/SMTP settings (pooling behavior comes from `?pool=true`, preserved).
Nothing else in the product depends on the `email` package.

---

## D9 — Admin rate-limit settings → DDPRateLimiter rules

**Status: resolved.** The whole mapping lives in `app/lib/server/startup/rateLimiter.js` plus
`server/settings/rate.ts` (settings declarations, section `DDP_Rate_Limiter`):

| Setting group (`DDP_Rate_Limit_*`) | Rule matcher | Defaults (allowed / interval) |
|---|---|---|
| `IP_*` | `clientAddress !== '127.0.0.1'` | 120,000 / 60s |
| `User_*` | `userId != null` | 1,200 / 60s |
| `Connection_*` | any `connectionId` | 600 / 60s |
| `User_By_Method_*` | per `{userId, type, name}`; **two rules**: non-`stream-*` names at ×1, `stream-*` names at ×4 (both counts and interval) | 20 / 10s (streams: 80 / 40s) |
| `Connection_By_Method_*` | same split, keyed by `connectionId` | 100 / 10s (streams ×4) |

Mechanics a gateway limiter must reproduce: each group is **enabled/disabled and re-created live**
via `settings.watchByRegex` (debounced 1s); per-method rules **skip method names that already have
a dedicated rule** (the `names` set — 10 `RateLimiter.limitMethod` sites e.g. `sendMessage`,
`registerUser`, `createDirectMessage`, `followMessage`, plus 7 direct `DDPRateLimiter.addRule`
sites e.g. `spotlight`, `browseChannels`, `userSetUtcOffset`); connections marked `broadcastAuth`
(instance-to-instance) are **exempt** from all five groups; on rejection it logs, increments
Prometheus counters (`rocketchat_ddp_rate_limit_exceeded*`), and optionally sleeps
`RATE_LIMITER_SLOWDOWN_RATE × numInvocationsExceeded` before replying (`too-many-requests`,
`timeToReset` in the error details). REST has its *own* limiter (`API_Enable_Rate_Limiter*`);
only the DDP side moves into the gateway.

---

## D10 — Custom EJSON types on the wire

**Status: resolved — there are none.** `EJSON.addType` has **zero call sites** in the monorepo
(`apps/meteor`, `packages`, `ee`, including apps-engine). The wire needs exactly the EJSON
built-ins: `{"$date": ms}` (dates are pervasive) and `{"$binary": base64}` (E2EE key payloads,
uploads). The gateway serializer is complete with vendored stock EJSON; ddp-streamer already ships
this way (`ejson` npm package, `Server.ts:35`).

---

## D11 — Cold-load performance: dynamic-import protocol vs bundler chunking

**Status: still open — this is the one item that requires a prototype; but the risk framing
improved.** What source now establishes:

- The custom pipeline is fully intact and still the only client build: `dynamic-import@0.7.4` in
  `.meteor/packages`, batched-POST fetch + IndexedDB module cache at runtime. No Vite/esbuild/
  Rspack work exists upstream (no configs in-tree, no PRs in RocketChat/Rocket.Chat).
- Two chapter-10 assumptions strengthened: (a) *data* caching no longer rides on the module cache
  — rooms/subscriptions/settings persist in localforage via `CachedStore` (D3), so replacing the
  dynamic-import IndexedDB layer cannot regress data cold-start; (b) route-level code splitting
  already uses standard `import()` boundaries (`client/main.ts` chains dynamic imports;
  `react-loadable`-style lazy routes), so a bundler gets natural split points rather than 5,811
  per-file modules — chunk-count explosion is a tuning problem, not a structural one.
- What still needs measuring on a real deployment, exactly as the chapter says: cold-load
  waterfall depth with module-preload manifests vs. the batched-POST graph walk, and warm-load
  (HTTP cache) vs. IndexedDB hit rates on the login → home → first-room path. Suggested harness:
  build the client with esbuild using the D2 shim list (10 modules), serve behind the existing
  `webapp` static handler, and compare Playwright cold/warm traces against the isobuild client on
  the same server — the E2E suite (`apps/meteor/tests/e2e`) already boots both ends.

---

## D12 — Upstream de-Meteorization work already in flight

**Status: resolved — substantial, coordinated, and worth aligning with rather than duplicating.**
Inventory of the in-flight program (all verified in-tree or on GitHub):

**Server/gateway (shipped, EE):**
- `ee/apps/ddp-streamer` — the plain-Node DDP gateway (see headline). Also
  `ee/apps/account-service` (auth), `presence-service`, `authorization-service`, etc. on
  `@rocket.chat/core-services` — the broker topology the chapter's Stage 3/4 target.
- `Meteor.absoluteUrl`, `Assets`, oplog disabling, `HTTP_FORWARDED_COUNT` — already centralized in
  small owned modules/packages.

**Client (shipped or in review, behind `SDK_DDP_Transport_Enabled`):**
- PR [#40268](https://github.com/RocketChat/Rocket.Chat/pull/40268) "refactor: incrementally
  remove Meteor deps from the frontend" and PRs
  [#40301](https://github.com/RocketChat/Rocket.Chat/pull/40301)/[#40430](https://github.com/RocketChat/Rocket.Chat/pull/40430)
  "introduce experimental Meteor independent DDP client" (merged, 2026-04/05).
- The override stack (D2/D3): `stubMeteorStream`, `killMeteorStream`, `ddpOverREST` (HTTP status
  mapping hardened in [#38007](https://github.com/RocketChat/Rocket.Chat/pull/38007)),
  `subscribeViaSDK`, `ddpSdkCollectionBridge`, Zustand stores, storage contract.
- Tracker/Accounts removal series: [#36911](https://github.com/RocketChat/Rocket.Chat/pull/36911),
  [#40442](https://github.com/RocketChat/Rocket.Chat/pull/40442),
  [#40445](https://github.com/RocketChat/Rocket.Chat/pull/40445),
  [#40446](https://github.com/RocketChat/Rocket.Chat/pull/40446),
  [#40477](https://github.com/RocketChat/Rocket.Chat/pull/40477),
  [#40480](https://github.com/RocketChat/Rocket.Chat/pull/40480),
  [#40482](https://github.com/RocketChat/Rocket.Chat/pull/40482),
  [#40486](https://github.com/RocketChat/Rocket.Chat/pull/40486),
  [#40542](https://github.com/RocketChat/Rocket.Chat/pull/40542) (removes legacy
  `streamerCentral`); open: [#40413](https://github.com/RocketChat/Rocket.Chat/pull/40413) "port
  Meteor auth/oauth packages to @rocket.chat/ddp-client".
- E2EE/TOTP flows covered through the new transport
  ([#40431](https://github.com/RocketChat/Rocket.Chat/pull/40431)).

**Method → REST migration (`ddp-removal` workstream, Jira `ARCH-*`):** todo-issues tagged
`(ddp-removal)` track per-method endpoint moves — e.g.
[#41000](https://github.com/RocketChat/Rocket.Chat/issues/41000) reconnect sync →
`GET /v1/chat.syncMessages` (milestone 8.7.0),
[#40710](https://github.com/RocketChat/Rocket.Chat/issues/40710) `slashCommand` →
`POST /v1/commands.run`, PR [#40723](https://github.com/RocketChat/Rocket.Chat/pull/40723)
`addUsersToRoom` → per-type REST endpoints. The API framework migration
(`docs/api-endpoint-migration.md`, AJV-validated typed routes with generated OpenAPI) is the
landing zone. Some livechat admin methods are already gone from DDP (e.g.
`app/livechat/server/methods/saveBusinessHour.ts` is an empty file).

**Settings-level kill switches:** `SDK_DDP_Transport_Enabled` (client transport rollout);
`API_Use_REST_For_DDP_Calls` was removed in migration v320 — REST-for-methods is now
unconditional for clients that choose it.

**Alignment implications for the chapter-10 plan:** Stage 1's "own the client build" is the only
stage with no upstream owner today (D11); Stage 3/4 should be phrased as "promote ddp-streamer +
account-service from EE microservices topology to the default single-process build" rather than
"write a gateway"; and the method-registration shim of Stage 3 already exists as
`server.methods()`/`callMethodWithToken` in ddp-streamer. The wire-compat conformance suite
(Stage 0) remains unbuilt and is the highest-leverage missing artifact — ddp-streamer's
`Server.spec.ts` is an embryo of it.

---

## Appendix A — DDP method names registered by app code (181)

Extracted from all `Meteor.methods({...})` registration sites in `apps/meteor` at the audited
commit (regenerate by parsing registration object keys; the typed superset lives in the
`ServerMethods` interface augmentations across the monorepo). Excludes accounts-package methods,
per-stream `stream-<name>` emit methods, and gateway-native `UserPresence:*`/`setUserStatus`
registrations (listed in D1).

```
2fa:checkCodesRemaining 2fa:disable 2fa:enable 2fa:regenerateCodes 2fa:validateTempToken
OAuth.retrieveCredential OEmbedCacheCleanup UserPresence:away UserPresence:online
UserPresence:setDefaultStatus addAllUserToRoom addIncomingIntegration addOAuthService
addOutgoingIntegration addRoomLeader addRoomModerator addRoomOwner addSamlService addUserToRoom
addUsersToRoom addWebdavAccount addWebdavAccountByToken afterVerifyEmail archiveRoom
auditGetOmnichannelMessages authorization:addPermissionToRole
authorization:removeRoleFromPermission autoTranslate.getProviderUiMetadata
autoTranslate.getSupportedLanguages autoTranslate.saveSettings autoTranslate.translateMessage
banner/dismiss blockUser botRequest browseChannels channelsList checkFederationConfiguration
checkRegistrationSecretURL cleanRoomHistory clearIntegrationHistory cloud:checkUserLoggedIn
cloud:connectWorkspace cloud:finishOAuthAuthorization cloud:getWorkspaceRegisterData cloud:logout
cloud:registerWorkspace cloud:syncWorkspace createChannel createDirectMessage createPrivateGroup
crowd_sync_users crowd_test_connection deleteCustomSound deleteCustomUserStatus deleteEmojiCustom
deleteFileMessage deleteIncomingIntegration deleteOAuthApp deleteOutgoingIntegration deleteUser
deleteUserOwnAccount downloadPublicImportFile e2e.fetchMyKeys e2e.getUsersOfRoomWithoutKey
e2e.requestSubscriptionKeys e2e.resetOwnE2EKey e2e.setRoomKeyID e2e.setUserPublicAndPrivateKeys
executeSlashCommandPreview followMessage getChannelHistory getFileFromWebdav getImportFileData
getImportProgress getLatestImportOperations getMessages getReadReceipts getRoomById
getRoomByTypeAndName getRoomIdByNameOrId getRoomJoinCode getRoomNameById getS3FileUrl
getSetupWizardParameters getSingleMessage getSlashCommandPreviews getStatistics getThreadMessages
getThreadsList getTotalChannels getUserMentionsByChannel getUserStatusText getUsernameSuggestion
getUsersOfRoom getWebdavFileList getWebdavFilePreview hideRoom ignoreUser insertOrUpdateEmoji
insertOrUpdateSound insertOrUpdateUserStatus joinDefaultChannels joinRoom leaveRoom
license:getModules license:getTags license:hasLicense license:isEnterprise listCustomSounds
listCustomUserStatus loadHistory loadLocale loadMissedMessages loadNextMessages
loadSurroundingMessages logoutCleanUp messageSearch messages/get openRoom permissions/get
personalAccessTokens:generateToken personalAccessTokens:regenerateToken
personalAccessTokens:removeToken pinMessage private-settings/get public-settings/get push_test
raix:push-update readMessages readThreads refreshOAuthService registerUser removeOAuthService
removeRoomLeader removeRoomModerator removeRoomOwner removeSlackBridgeChannelLinks
removeUserFromRoom replayOutgoingIntegration requestDataDownload resetAvatar resetIrcConnection
restart_server rooms/get samlLogout saveAudioNotificationValue saveNotificationSettings
saveRoomSettings saveSetting saveSettings saveUserPreferences sendFileMessage
sendForgotPasswordEmail sendMessage sendMessageLivechat sendSMTPTestEmail setAvatarFromService
setEmail setRealName setUserActiveStatus setUserStatus slashCommand spotlight starMessage
startImport subscriptions/get toggleFavorite unarchiveRoom unblockUser unfollowMessage
unpinMessage unreadMessages updateIncomingIntegration updateMessage updateOAuthApp
updateOutgoingIntegration uploadCustomSound uploadEmojiCustom uploadFileToWebdav uploadImportFile
userSetUtcOffset
```

## Appendix B — Stream names and instantiation

From `server/modules/notifications/notifications.module.ts` (server) and
`packages/ddp-client/src/types/streams.ts` (typed contract):

| Stream | Notes |
|---|---|
| `notify-all` | public settings changes, custom sounds, license |
| `notify-logged` | user name/avatar/role/permission changes, custom emoji/status, banners |
| `notify-user` | per-user: rooms-changed, subscriptions-changed, message, notification, webrtc, otr, uiInteraction, video-conference, force_logout, calendar, voip |
| `notify-room` | typing/user-activity, deleteMessage(+Bulk), messagesRead, e2e.keyRequest, videoconf |
| `notify-room-users` | webrtc/otr/userData fan-out to room members |
| `room-messages` | message feed (+ `__my_messages__` firehose) |
| `room-data` | omnichannel room document updates |
| `user-presence` | presence status fan-out |
| `roles` | role definition changes |
| `importers`, `integrationHistory`, `apps`, `apps-engine`, `canned-responses`, `livechat-room`, `livechat-inquiry-queue-observer` | feature-scoped |
| `local` | intra-instance only (never leaves the server) |

## External sources

- [RocketChat/Rocket.Chat.Electron `src/servers/supportedVersions/main.ts`](https://github.com/RocketChat/Rocket.Chat.Electron/blob/develop/src/servers/supportedVersions/main.ts) (D7)
- [RocketChat/Rocket.Chat.ReactNative `app/lib/services/connect.ts`](https://github.com/RocketChat/Rocket.Chat.ReactNative/blob/develop/app/lib/services/connect.ts), [`app/lib/services/sdk.ts`](https://github.com/RocketChat/Rocket.Chat.ReactNative/blob/develop/app/lib/services/sdk.ts), [`app/lib/methods/subscriptions/room.ts`](https://github.com/RocketChat/Rocket.Chat.ReactNative/blob/develop/app/lib/methods/subscriptions/room.ts), [`app/lib/methods/checkSupportedVersions.ts`](https://github.com/RocketChat/Rocket.Chat.ReactNative/blob/develop/app/lib/methods/checkSupportedVersions.ts) (D1, D7)
- [Rocket.Chat Realtime API docs](https://developer.rocket.chat/apidocs/realtimeapi) (D1)
- GitHub PRs/issues in RocketChat/Rocket.Chat cited inline (D12)
