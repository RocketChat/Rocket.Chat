# ADR 0001 — Accessor logic lives in the base-runtime, not the host

## Status

**Accepted — implemented.** All phases landed. Supersedes the `apps-accessor-consolidation` proposal.

- **Date:** 2026-07
- **Scope:** `packages/apps` (host) and `packages/apps/base-runtime` (subprocess runtime)

## Decision

1. The base-runtime is the **single source of truth** for accessor behavior.
2. The `accessor:*` message category — and `handleAccessorMessage` with it — is **eliminated**;
   `bridges:*` is the only host-bound RPC category originated by accessors.
3. Registration accessors, whose side effects had no bridge `do*`, ride `bridges:*` through one new
   internal host bridge, `AppResourceBridge`.

**Drift rule.** Where the runtime and host implementations had diverged: **merge non-conflicting logic;
on genuine conflict the runtime supersedes the host.** The runtime implementations are what apps
actually experienced in production (host copies were unreachable from the subprocess). Two refinements:

- **Direction-aware.** For **MOVE** accessors the host was authoritative (the app hit it via the
  proxy), so merging preserves live behavior. For **RECONCILE** accessors the runtime was
  authoritative, so folding in *host-only* logic **adds observable behavior** — a deliberate, tested
  change, never a neutral reconciliation.
- **Drift is classified before adoption.** Runtime-is-superset → adopt silently. Runtime *dropped or
  changed* observable behavior → requires a justification that the drop is intentional plus a test
  pinning the resulting shape, so the migration cannot immortalize an accidental regression.

## End state

`BaseRuntimeSubprocessController` handles exactly one app-originated RPC category — `bridges:*` — with
a single dispatcher and a single permission model. The `@rocket.chat/apps` host contains no accessor
implementation and no accessor manager (`src/server/accessors/` and `AppAccessorManager` are deleted);
the only accessor-shaped host code is the bridge layer (`AppBridges`/`do*`) plus `AppResourceBridge`.
Every accessor an app uses is built and resolved inside `packages/apps/base-runtime`.

## Follow-ups

Out of scope here; unblocked or motivated by this work.

1. **Bridge-level input hardening** — move load-bearing caps into the bridge `do*` wrappers (the real
   trust boundary). Caps like `getMessages` ≤ 100 and `removeUsersFromRoom` ≤ 50 were *already*
   bypassable before this migration: app code runs via `new Function` in the runtime's own JS realm
   (globals are shadowed, not a security boundary — see `construct.ts`) and can emit arbitrary
   `bridges:*` messages. This work introduced **no new exposure**, it only made the advisory-ness
   visible. Independent security item, non-blocking.
2. **Replace the restart registration guard** with an explicit `reinitialize` request so the subprocess
   knows not to re-send registrations, removing controller-state-dependent message dropping.
3. **`messenger.sendRequest` timeout** — the runtime-side TODO is more prominent now that all accessor
   traffic flows through it.
4. **`createProcessorId` suffix check** (`SchedulerModify`) — job-id namespacing uses `includes`
   (substring) instead of `endsWith` (suffix), so an appId substring in the *middle* of a job id makes
   it skip the suffix, risking collisions and jobs `cancelJob` can't reach. Flagged in review but not
   fixed inside the migration: the port was a faithful copy of the host code, and fixing only the
   runtime copy would have re-introduced the drift this ADR removes. The host copy is gone now, so it
   can land standalone with a test.
5. **Consolidated host↔subprocess protocol/SDK** — one typed manifest of every host-bound method and
   its accepted params (the APP_ID bucket table is the seed), replacing hand-rolled message strings and
   per-param normalization judgment. Also where bucket C's nested-identity gap gets closed (host
   substitutes nested `appId` fields, or `HttpBridge.doCall` ignores the payload `appId` and uses the
   connection-known id).
6. **Deferred review findings** — reviewers flagged the items below on ported accessors; in every case
   the port was byte-identical to its host original, so the flag is *pre-existing* behavior, not a
   regression. Deferred for the same reason as 4, and likewise unblocked now.

   *Latent behavior (identical in host):*
   - `UploadCreator.uploadBuffer` uses `Object.hasOwn(descriptor, 'user')` to decide whether to fetch
     the app user; with `{ user: null }` (nullable per `IUploadDescriptor`) and no visitor token it
     treats the user as present and sends `userId: undefined`. A value check (`!descriptor.user`) would
     fall back to the app user.
   - `RoomRead.getMessages` accepts `0`/negative `limit` — the guard only rejects `> 100`, unlike the
     `1–100` checks in `getAllRooms`/`getUnreadByUser`.
   - `RoomRead.getMessages` mutates the caller's `options` in place (`options.limit ??= 100`,
     `options.showThreadMessages ??= true`). Fix = copy before defaulting.
   - `ServerSettingRead.getOneById` casts the bridge result to `ISetting` with no null guard, so a
     missing setting returns `null`/`undefined` despite the typed return; sibling `getValueById` throws.
   - `UIController`'s deprecated surface APIs (`openModalView`, `updateModalView`,
     `openContextualBarView`, `updateContextualBarView`) call the serializers directly, skipping the
     `UIHelper.assignIds` block-ID scoping that `openSurfaceView`/`updateSurfaceView` apply, so legacy
     interactions can emit un-scoped block IDs.

   *Type/cosmetic (no runtime change):* `MessageRead.getSenderUser`/`getRoom` cast the bridge result
   (`as IMessage`) and declare `Promise<IUser>`/`Promise<IRoom>`, so the `undefined` they return for a
   missing message — and which `IMessageRead` does declare — is absent from their own signatures.

## Context

Accessors used to have two implementations. The subprocess got a thin proxy layer that forwarded
`accessor:*` JSON-RPC messages to the host, where `handleAccessorMessage` walked the *real* accessor
objects built by `AppAccessorManager` from `src/server/accessors/`. That split existed because, when
the Deno runtime was introduced, module-resolution conflicts made sharing code between subprocess and
host impractical. The constraint no longer held: base-runtime assumes Node module resolution, is
compiled by `tsc`, and is consumed by Deno as TypeScript source through an import map.

Three call paths coexisted:

| Path | Example | Mechanism |
| --- | --- | --- |
| **Pure proxy** | `read.getRoomReader().getById(id)` | `proxify()` sends `accessor:getReader:getRoomReader:getById`; host resolves it via `handleAccessorMessage` → `AppAccessorManager` → `RoomBridge.doGetById` |
| **Local + direct bridge call** | `modify.getCreator().finish(builder)` | runtime validates locally, then sends `bridges:getMessageBridge:doCreate` to the permission-wrapped bridge method |
| **Fully local** | `configurationExtend.http.provideDefaultHeader()` | state lives entirely in the subprocess |

Paths 2 and 3 were already the target, so the work was migrating path 1 into them and closing the gaps
that forced accessors to stay on path 1.

**Why `bridges:*` is sufficient security-wise.** Permission enforcement never lived in the accessors;
it lives in the host bridge `do*` wrappers (`MessageBridge.doCreate` checks
`AppPermissionManager.hasPermission(appId, AppPermissions.message.write)`). Three properties make that
channel a complete trust boundary: `handleBridgeMessage` only dispatches `do`-prefixed methods; any
param equal to the literal `'APP_ID'` is replaced host-side with the app's real id, so a subprocess
cannot impersonate another app; and `hasPermission(appId, …)` takes the appId explicitly, with no
call-stack or async-context magic that breaks when the caller leaves the host process. So moving
accessor logic into the subprocess **loses nothing permission-wise**, provided every side effect still
flows through a `do*` method. The corollary: accessor-level validation is *advisory* inside the sandbox
— but it already was, since a subprocess can emit arbitrary `bridges:*` messages (follow-up 1).

**Who consumed the host accessors.** Almost exclusively the RPC channel. The only load-bearing
non-RPC use was `AppListenerManager.executePostMessageSent` calling
`getReader(appId).getUserReader().getAppUser()` to gate `IPostMessageSentToBot`. `accessors/Http.ts`
reached back into `AppAccessorManager` for HTTP pre/post handlers (dead for subprocess apps);
`accessors/AppAccessors.ts` was never instantiated; and `AppApiManager`,
`AppSlashCommandManager`, `AppVideoConfProviderManager`, `AppOutboundCommunicationProviderManager`
threaded `this.accessors` into executors that ignored it (`_accessors`) — legacy in-process-era
signatures. Nothing in `apps/meteor` touched `AppAccessorManager`.

## Architecture

### `AppResourceBridge`

Every bridge gap reduces to one capability: *invoke an app-scoped operation on a host manager or the
app's own storage item*. One internal bridge lets them ride the existing permission-checked,
appId-substituting `bridges:*` channel:

```text
AppResourceBridge (host-side, internal — not part of the app-facing definition surface)
├── doProvideSetting(setting, appId)              → ProxiedApp.getStorageItem() mutation (SettingsExtend)
├── doGetAppSetting(id, appId)                    → app.getStorageItem().settings[id] (SettingRead)
├── doUpdateAppSetting(setting, appId)            → AppSettingsManager.updateAppSetting
├── doProvideSlashCommand(command, appId)         → AppSlashCommandManager.addCommand
├── doModifySlashCommand(command, appId)          → AppSlashCommandManager.modifyCommand
├── doEnableSlashCommand(name, appId)             → AppSlashCommandManager.enableCommand
├── doDisableSlashCommand(name, appId)            → AppSlashCommandManager.disableCommand
├── doProvideApi(api, appId)                      → AppApiManager.addApi
├── doListApis(appId)                             → AppApiManager.listApis
├── doRegisterProcessors(processors, appId)       → AppSchedulerManager.registerProcessors
├── doRegisterActionButton(button, appId)         → UIActionButtonManager.registerActionButton
├── doRegisterExternalComponent(component, appId) → AppExternalComponentManager.addExternalComponent
├── doProvideVideoConfProvider(provider, appId)   → AppVideoConfProviderManager.addProvider
└── doRegisterOutboundProvider(provider, appId)   → AppOutboundCommunicationProviderManager.addProvider
```

- **Placement and ownership.** The managers live in `packages/apps`, so the bridge does too. It is
  *not* an abstract getter on `AppBridges` — that would force every orchestrator/host embedding to
  implement it. `handleBridgeMessage` resolves names from `this.bridges` first, then from a dedicated
  `getAppResourceBridge` lookup. The bridge is **stateless** (every method takes the `appId` and
  delegates to an `AppManager`-owned manager), so `AppManager` constructs it once
  (`getAppResourceBridge()`) and every `BaseRuntimeSubprocessController` shares that instance. The
  `do*` gate and `'APP_ID'` substitution apply identically.
- **Permission and error behavior preserved, including throw-vs-silent.** Each method calls the same
  manager the host accessor used: `AppVideoConfProviderManager`/`AppOutboundCommunicationProviderManager`
  `addProvider` still **throw** `PermissionDeniedError`, `UIActionButtonManager.registerActionButton`
  still logs-and-refuses silently, and conflict errors (`CommandAlreadyExistsError`,
  `CommandHasAlreadyBeenTouchedError`, `PathAlreadyExistsError`, `VideoConfProviderAlreadyExistsError`)
  still propagate as JSON-RPC errors.
- **The restart guard moved with it — via an explicit method set, not a name prefix.**
  `handleAccessorMessage` used to short-circuit any `getConfigurationExtend` call to `success(null)`
  while the controller is `restarting` (re-running `app:initialize` must not re-register resources, but
  the subprocess must still rebuild its local `AppObjectRegistry` entries). That guard keyed on the
  accessor *origin*, structurally capturing the whole registration surface. The bridge version
  deliberately does **not** re-derive the boundary from `doProvide*`/`doRegister*` prefixes — a future
  registration method named otherwise would double-register during restart, and a future
  non-registration method matching the prefix would be silently dropped. Instead a static
  `AppResourceBridge.REGISTRATION_METHODS` set enumerates exactly the suppressed names (registrations
  only — not `doGetAppSetting`/`doUpdateAppSetting`/`doModifySlashCommand`/`doEnable*`/`doDisable*`/
  `doListApis`), consulted by `handleBridgeMessage` while `state === 'restarting'`. Runtime `_proxy`
  wrappers still stash live instances into `AppObjectRegistry` *before* the RPC, so local
  re-registration works. Stopgap; follow-up 2 is the real fix.

### `bridgeCall`

Runtime accessors do not hand-roll message strings. `base-runtime/src/lib/bridges/bridgeCall.ts`
exposes one helper:

```ts
bridgeCall<T>(senderFn, bridge: BridgeName, method: `do${string}`, ...params: unknown[]): Promise<T>
```

It encodes `bridges:<bridge>:<method>`, unwraps `response.result`, and normalizes rejections through
`formatErrorResponse`. `BridgeName` is the union of host bridges reachable from the subprocess
(including `getAppResourceBridge`); the `` `do${string}` `` type mirrors the host gate. Accessors get a
`(request) => this.senderFn(request)` thunk so instance-level `senderFn` test stubs stay intercepted.
(An earlier iteration used a `RemoteBridges` proxy facade with a getter per bridge; `bridgeCall`
replaced it with the same guarantees and no `Proxy` layer.)

**It deliberately does not auto-inject `'APP_ID'`.** Identity is passed explicitly and positionally by
each accessor, exactly as the host accessor did, so a faithful copy keeps caller-identity params
carrying the sentinel and leaves app-supplied argument-appIds raw *by construction*. Centralizing
injection would be cleaner but would make the argument-appId exceptions the dangerous default.

### `APP_ID` sentinel everywhere

All bridge params denoting the *calling app* use the `'APP_ID'` literal, substituted host-side. This
closed the pre-existing inconsistency (drift 7) and removed the runtime's reliance on
`AppObjectRegistry.get('id')` for identity — it stays available for non-identity uses like
`UIHelper.assignIds` block-id prefixes and scheduler job-id suffixes.

This is a per-param judgment that fails in **both** directions, caught by neither the type-checker nor
a green suite: over-normalizing a genuine app-supplied argument-appId silently strips the app's ability
to pass any appId; under-normalizing a caller-identity param re-opens the impersonation gap. So every
`do*` appId param was audited into exactly one of three buckets — only A is normalized:

| Bucket | Params | Value sent |
| --- | --- | --- |
| **A** — caller identity, top-level positional | The trailing appId of every `Notifier`, `ModifyCreator`, `ModifyUpdater`, `ModifyExtender`, reader, and modifier bridge call (`doNotifyUser`, `doNotifyRoom`, `doTyping`, `doGetAppUser`, `doCreate*`, `doGetById`, `doUpdate`, …), and everything not listed in B/C | `'APP_ID'` sentinel |
| **B** — app-supplied *argument* appId | `ModerationBridge.doReport`, `.doDismissReportsByMessageId`, `.doDismissReportsByUserId` (`ModerationModify` ignores its constructor `_appId` and forwards the caller's arg); `UserBridge.doDeleteUsersCreatedByApp` (the id is the *target* app that created bot users); `UserBridge.doGetAppUser` (legacy param, removing it risks a break) | raw caller value |
| **C** — nested identity field | `HttpBridge.doCall`'s single payload param `{ appId, method, url, request }` — `appId` is a *field*, and the host substitution maps only top-level positional params, so the sentinel would travel through unrewritten | resolved `AppObjectRegistry.get('id')` |

Before this work every site sent the raw resolved id except `ModifyCreator._finishMessage`'s
`doGetAppUser` — the lone correct one, and the drift that motivated the normalization. Host-observable
behavior is unchanged (the host still ends up with the real id); the wire now carries the sentinel and
the impersonation gap is closed for buckets A and B. **Audit rule when adding a `do*` call:** an appId
populated from a method parameter rather than the app's own identity belongs in bucket B.

Bucket C is a pre-existing impersonation surface predating this migration (the sandbox picks the id it
sends), so this work introduced no new exposure there; closing it needs a host change — either
substituting nested `appId` fields for known payload params, or having `HttpBridge.doCall` ignore the
payload `appId` and use the connection-known id (follow-up 5).

### Module-resolution constraints (the original reason for the proxies)

The Deno subprocess consumes base-runtime **as TypeScript source** through the import map
(`@rocket.chat/apps/base-runtime/` → `../base-runtime/src/`); compiled `dist` CJS is avoided because
its `require()` calls bypass the import map. So moved code may import only
`@rocket.chat/apps-engine/definition/*` (mapped to source), `node:` builtins, and npm deps already in
`deno.jsonc`'s import map or Deno cache — which every moved accessor satisfies.

`UIHelper` was **duplicated** into base-runtime rather than shared. It is a small pure helper (only
`node:crypto` plus two type-only imports) needed by `ModifyCreator`/`ModifyUpdater`/`UIController`, and
the runtime used to import it from `@rocket.chat/apps/dist/server/misc/UIHelper` — exactly the fragile
dist-CJS path the runtime avoids. Having the host import it *back* from base-runtime was rejected:
base-runtime already imports `apps/dist`, so that would create an unlinearizable **build cycle**
(flipping the order only moves it). Phase 0 copied it into `base-runtime/src/lib/` and left the host
copy for the still-living host accessors; since all three `src/` importers were MOVE accessors, that
copy died in teardown — single source of truth *at teardown*, no cross-package import, no build-order
change. Other small carry-overs: `createProcessorId` (a local function) and `RoomRead`'s
`GetMessagesSortableFields` sort validation (constants from apps-engine definitions).
`lodash.clonedeep` was not needed — the runtime extenders already exist without it.

### Error semantics

Validation errors formerly thrown host-side inside accessor methods (serialized as JSON-RPC error 1000)
now throw *locally* in the subprocess: same message, better stack traces, one less round trip.
Bridge-side errors keep the `handleBridgeMessage` shape (code -32000, message preserved, formatted by
`formatErrorResponse`). Permission failures on read/write bridges stay *silent-undefined*;
manager-level registration failures keep *throwing*. Both are preserved verbatim because both layers
are reused untouched.

### `AppObjectRegistry` and one-app-per-process

The registry (a process-global singleton keyed by simple strings, including a single `id`) assumes one
app per subprocess. The migration keeps that assumption, restated in code comments since consolidating
logic into the runtime makes it more load-bearing.

## Per-accessor disposition

**MOVE** — implement in base-runtime, side effects via existing bridge `do*`, delete host class.
**RECONCILE** — already in base-runtime; make canonical, delete host copy. **BRIDGE-GAP** — needs
`AppResourceBridge`. **DELETE** — already dead on the host.

**Readers (all MOVE — bridge passthroughs plus portable validation).** `Reader` (facade over 15
sub-readers); `MessageRead` (`getSenderUser`/`getRoom` are fetch-then-extract compositions); `RoomRead`
(`getMessages`/`getAllRooms`/`getUnreadByUser` limit/skip/sort validation); `UserRead`
(`getAppUser(appId?)` arg defaulting); `PersistenceRead` (single-assoc → array wrapping); `LivechatRead`
(`isOnline` deprecation warning — runtime `console` is piped to app logs); `UploadRead`
(`getBufferById` becomes two bridge RPCs); `CloudWorkspaceRead`, `VideoConferenceRead`, `OAuthAppsReader`
(`doGetByid` typo is on the bridge, unchanged), `ContactRead`, `ThreadRead`, `RoleRead` (1:1);
`ExperimentalRead` (empty shell → empty local class).

**Environment.** MOVE: `EnvironmentRead`/`EnvironmentWrite` (facades), `ServerSettingRead`
(`getValueById` `value → packageValue` fallback; `getAll` keeps throwing "not implemented" locally),
`EnvironmentalVariableRead`, `ServerSettingUpdater` (+ `incrementValue` default). BRIDGE-GAP:
`SettingRead` (reads `ProxiedApp.getStorageItem().settings`) → `doGetAppSetting`; `SettingUpdater`
(`AppSettingsManager.updateAppSetting` persists, fires `doOnAppSettingsChange`, runs the
`ON_PRE_SETTING_UPDATE` round-trip back into the app) → `doUpdateAppSetting`.

**Modify.** RECONCILE: `ModifyCreator`, `ModifyUpdater` (diff-update semantics), `ModifyExtender`,
`Notifier` (awaits typing calls). MOVE: `Modify` (facade); `LivechatCreator` (`createToken` already
local in the runtime, supersedes; rest 1:1); `UploadCreator` (`uploadBuffer` defaults user via
`doGetAppUser` — two RPCs); `EmailCreator`, `ContactCreator`, `MessageUpdater`, `OAuthAppsModify` (1:1);
`LivechatUpdater` (+ boolean coercion in `setCustomFields`); `UserUpdater` (partial-object wrapping);
`ModifyDeleter` (`removeUsersFromRoom` ≤ 50 validation); `UIController` (UIKit interaction payloads +
`UIHelper.assignIds`, then `doNotifyUser`; required relocating `UIHelper`); `SchedulerModify`
(`createProcessorId` is pure and idempotent — the subprocess knows its own appId for the suffix and the
bridge still permission-checks the real id); `ModerationModify` (appId comes from method args by design).

**Configuration extend/modify — the registration surface.** These are why `handleAccessorMessage` could
not be deleted by bridge calls alone: they write into host-only managers whose in-memory registries the
host reads to render UI, route events, and dispatch executions back into the subprocess. MOVE:
`ConfigurationExtend`, `ConfigurationModify` (facades), `ServerSettingsModify` (1:1 + increment
default). RECONCILE: `HttpExtend` (already fully local). BRIDGE-GAP: `SettingsExtend` →
`doProvideSetting`; `SlashCommandsExtend` (registry, touched-command conflict tracking,
`CommandAlreadyExistsError`) → `doProvideSlashCommand`; `ApiExtend` (registry, `PathAlreadyExistsError`)
→ `doProvideApi` plus `listApis` → `doListApis`, killing the `accessor:api:listApis` special case;
`ExternalComponentsExtend` → `doRegisterExternalComponent`; `SchedulerExtend` (wraps processors in host
callbacks, namespaces ids, guards disabled apps) → `doRegisterProcessors`; `UIExtend` (button registry
read directly by host UI, `ui.registerButtons` permission, `doActionsChanged` side effect) →
`doRegisterActionButton`; `VideoConfProviderExtend` (`PermissionDeniedError`, name-collision tracking) →
`doProvideVideoConfProvider`; `OutboundMessageProviderExtend` → `doRegisterOutboundProvider`;
`SlashCommandsModify` → `doModifySlashCommand`/`doEnableSlashCommand`/`doDisableSlashCommand`.

*Serialization note:* `ISlashCommand`, `IProcessor`, `IApi`, and the provider objects contain executor
functions. The old `accessor:*` messages already stripped them in JSON serialization — the host managers
keep metadata and dispatch executions *back into* the subprocess, which looks the live instances up in
`AppObjectRegistry`. The new bridge methods receive the same serialized shapes, so **the wire semantics
did not change, only the message prefix**.

**Standalone.** `Http` — RECONCILE (runtime version already merges `HttpExtend` defaults, runs pre/post
handlers, calls `doCall`; the host copy and its reach-back into `AppAccessorManager` are deleted).
`Persistence` — MOVE (1:1 + arg wrapping/defaults). `AppAccessors` — DELETE (never instantiated on the
host; the runtime one in `mod.ts` is live).

## Drift resolutions

Only the **bounded subset carrying logic on both sides** — the RECONCILE accessors plus the few MOVE
accessors already partially local. Pure-proxy accessors had no runtime counterpart to reconcile; they
were faithful-ported and covered by the parity check instead.

Classes: **superset/equiv** — runtime already covers the host behavior, adopt silently.
**conflict→runtime** — genuine divergence; runtime wins, observationally neutral since the runtime was
authoritative. **merge (host→runtime)** — host-only logic folded in, adds observable behavior, ships
with a test (no row needed one).

| # | Drift | Class | Decision |
| --- | --- | --- | --- |
| 1 | **Update payload shape** — host `ModifyUpdater._finishMessage/_finishRoom` sent the *full* builder object to `doUpdate`; runtime sends a *diff* (`{ id, ...builder.getChanges() }`). | conflict→runtime | Diff wins; bridges demonstrably accept it (production sends it). Host path deleted, diff shape pinned by a test. |
| 2 | **Editor tracking** — runtime `ModifyUpdater.message()` calls `builder.setEditor(editor)`; host ignored the updater param. | superset/equiv | Runtime wins; editor recorded on update. |
| 3 | **`typing()` awaits** — runtime `Notifier` awaits `doTyping`; host fire-and-forget. | superset/equiv | Runtime wins. |
| 4 | **`createToken`** — runtime generates `randomBytes(16).toString('hex')` locally; host generated it host-side. | conflict→runtime | Runtime wins; same format. |
| 5 | **HTTP method representation** — runtime uses lowercase literals; host used the `RequestMethod` enum. | superset/equiv | Runtime wins; `doCall` payload identical. |
| 6 | **`BlockBuilder` appId** — host `getBlockBuilder()` passed appId into the builder; runtime builder takes none (ids assigned later by `UIHelper.assignIds`). | conflict→runtime | Runtime wins; the drop is intentional (ids assigned later) and the block shape is pinned by a test. |
| 7 | **`APP_ID` inconsistency** — exactly one runtime call site (`ModifyCreator._finishMessage` → `doGetAppUser`) sent the sentinel; every other sent the raw `AppObjectRegistry.get('id')`. | normalization | Not a pick-a-side drift; all caller-identity params now use `'APP_ID'`, argument appIds stay raw. |
| 8 | Cosmetic error wording ("can not" vs "can't"). | conflict→runtime | Runtime wording wins. |

Where a ported accessor interacts with a reconciled one, the reconciled (runtime) semantics apply.

## Alternatives considered

- **Move the registries into the subprocess** — non-starter. The host reads
  `UIActionButtonManager.getAllActionButtons` to render UI, routes slash-command/api/scheduler/provider
  invocations off these registries, and enforces cross-app conflict rules (two apps claiming the same
  slash command) that no single subprocess can arbitrate; app settings are host-persisted metadata read
  by other subsystems. A host-side write surface must remain.
- **Keep a residual `accessor:*` channel just for registration** — works, but keeps two RPC categories,
  two dispatchers, and the reflective accessor-path-walking code alive. The bridge approach reuses an
  existing dispatcher, its security gates, and its error model, and let `handleAccessorMessage`,
  `ALLOWED_ACCESSOR_METHODS`, `isValidOrigin`, and `getAccessorForOrigin` be deleted entirely.

## Consequences

**Positive.** One source of truth for accessor behavior; the host accessor layer and
`AppAccessorManager` deleted; subprocess controllers lose the whole `accessor:*` family and its
dispatcher; working LSP navigation into real implementations instead of proxies; local validation
throws with real stack traces and one less round trip.

**Accepted trade-offs.** Slightly chattier composite reads — `UploadRead.getBufferById` and
`UploadCreator.uploadBuffer` became two bridge RPCs where one accessor RPC (wrapping two in-host bridge
calls) sufficed; bounded, rare, symmetrical with what `Notifier`/`ModifyCreator` already did, and no
pagination-style N+1 patterns exist in this surface. Sandbox validation is advisory (unchanged in
practice, now explicit — follow-up 1). Two implementations existed transiently during rollout,
mitigated by per-accessor merge units and the parity harness.

**"Faithful port" was verified, not asserted.** For MOVE accessors the host logic was *live in
production*, so a subtly wrong port — a dropped default, an off-by-one cap, a renamed sort field — is an
immediate observable regression. Ported unit tests only prove the new class satisfies carried-over
assertions; they do not prove equivalence, so a port that drops an uncovered branch passes green. Each
host MOVE class deletion was gated on a **mechanical parity check**: either a differential harness
driving representative calls through both paths and asserting identical bridge-message output (method
string + params) and return shaping, or an enforced branch-coverage audit of the ported tests against
the host source. RECONCILE accessors did not need it (their host copy was already unreachable); the
drift rules govern them instead. The harness
(`base-runtime/src/lib/accessors/tests/helpers/parityHarness.ts`) was planned as throwaway but **kept**
— it became a test utility the base-runtime accessor suites depend on.

## Implementation record

**A phase was a milestone, not a single PR.** Each phase is independently shippable and keeps
`test:node`/`test:deno`/`test:base-runtime` green, but the *unit of merge* was the accessor: Phases 1–2
landed as a series of per-accessor (or tight cohesive-group) PRs, so blast radius per merge is one
accessor family. This mattered because the migration flips *live production behavior* for MOVE
accessors with no rollback but `git revert`, and the unit of revert equals the unit of merge. Host
accessor tests were ported to `base-runtime/src/lib/accessors/tests/`.

**Phase 0 — foundations, no behavior change.** Added the typed bridge entry point (now `bridgeCall.ts`)
with tests for message-string generation, the `do*` gate, and error formatting. Produced the APP_ID
exception list — the audit surfaced bucket C, since the sentinel substitution rewrites only *top-level
positional* params. Refactored the existing runtime accessors (`Http`, `Notifier`, `ModifyCreator`,
`ModifyUpdater`, `ModifyExtender`, `roomFactory`) onto it and normalized caller-identity params;
accessors still holding `accessor:*` sub-proxies kept `senderFn` for those until Phase 2. Duplicated
`UIHelper` into `base-runtime/src/lib/`. Stood up the parity harness. No changeset:
`@rocket.chat/apps` is `private` and has never carried one — this ADR and the exception list are the
recorded contract.

**Phase 1 — readers, `Persistence`, server-side environment.** Ported the reader family plus
`ServerSettingRead`, `EnvironmentalVariableRead`, `ServerSettingUpdater`, `ServerSettingsModify`,
`Persistence`, and the `Reader`/`EnvironmentRead`/`EnvironmentWrite` facades, moving all portable
validation/defaulting verbatim; app-settings members stayed proxied until Phase 3. Flipped the
corresponding `mod.ts` entries to local. *Host-class deletion was deferred to Phase 4* (deliberate
deviation): `AppAccessorManager.getReader()` builds the whole reader family and was still called by
`AppListenerManager.executePostMessageSent` and to build not-yet-migrated sub-accessors, so deleting
e.g. `RoomRead` then would have pulled the Phase-4 refactor forward mid-phase. *RPC-boundary
adaptation:* `ServerSettingRead.getValueById` checked `typeof set === 'undefined'` host-side; across the
boundary an absent return arrives as `null`, so the runtime treats both as "not found" — identical for
apps, since the bridge only ever returns a setting or nothing.

**Phase 2 — modify family.** Ported `ModifyDeleter`, `MessageUpdater`, `LivechatUpdater`, `UserUpdater`,
`LivechatCreator`, `UploadCreator`, `EmailCreator`, `ContactCreator`, `UIController`, `SchedulerModify`,
`OAuthAppsModify`, `ModerationModify`; caller-identity params use the sentinel, the
`ModerationModify`/`ModifyDeleter.deleteUsers` argument-appIds stay raw (bucket B), and
`UIController`/`SchedulerModify` read the real id from `AppObjectRegistry` for their non-identity uses.
Removed the remaining `proxify` entries in `getModifier` and the `accessor:*` sub-creator/sub-updater
proxies, after which `getReader`/`getModifier`/`getPersistence`/`getHttp` generated **zero**
`accessor:*` traffic. *RPC-boundary note:* sub-accessor methods now flow through `Promise<unknown>` and
are cast to their interface return types; `void`-returning methods `await` instead of returning the
bridge value.

**Phase 3 — registration surface.** Added `src/server/bridges/AppResourceBridge.ts` and wired it into
`handleBridgeMessage` via the dedicated `getAppResourceBridge` lookup plus the `restarting` guard keyed
on `REGISTRATION_METHODS`; no `apps/meteor` orchestrator changes needed. Rewrote
`getConfigurationExtend`, `getConfigurationModify`, and the app-settings
`SettingRead`/`SettingUpdater`/`SettingsExtend` members onto `getAppResourceBridge().do*`, preserving
the `AppObjectRegistry` stash-then-forward; `accessor:api:listApis` became `doListApis`;
`registerButton` stays a synchronous `void` per its interface. The dead `proxify` machinery and
`WithProxy` type were removed from `mod.ts` — **the runtime stopped emitting `accessor:*` entirely.**
*RPC-boundary note:* `SettingRead.getValueById` treats `null` and `undefined` alike, same adaptation as
`ServerSettingRead`.

**Phase 4 — message-path teardown.** Replaced the `executePostMessageSent` accessor call with
`this.manager.getBridges().getUserBridge().doGetAppUser(appId)`. Deleted `handleAccessorMessage`,
`ALLOWED_ACCESSOR_METHODS`, `isValidOrigin`, `getAccessorForOrigin`, the `accessor:` branch in
`handleIncomingMessage`, and the controller's unused `accessors`/`api` fields — **the `accessor:*`
category no longer exists**; the controller dispatches only `bridges:*`, `ready`, `log`, and the error
notifications. `JSONRPC_METHOD_NOT_FOUND` is kept (imported by `ProxiedApp`, `AppListenerManager`,
`AppVideoConfProvider`). Removed the four now-meaningless `handleAccessorMessage` cases from
`DenoRuntimeSubprocessController.test.ts`. Physical deletion of the dead classes was folded into
Phase 5, since it first required un-threading the ignored `accessors` parameter from the
sandbox-execution core — a separate behavior-neutral change that should not ride at the tail of the
teardown.

**Phase 5 — dead host accessor layer removal.** Behavior-neutral; nothing on the subprocess path
reached any of it after Phase 4. Un-threaded the vestigial `accessors` parameter from `AppApi`,
`AppSlashCommand`, `AppVideoConfProvider`, and `AppOutboundCommunicationProvider` `run*`/`runTheCode`
methods (which already ignored it as `_accessors`), updated the four managers' call sites, and dropped
their unused `accessors` fields. Deleted `AppAccessorManager`, its `managers/index.ts` export, and
`AppManager`'s field, construction, `getAccessorManager()`, and the `purifyApp(...)` call in
`removeLocal` (a no-op once no host code called `getReader`/`getModifier`). Deleted
`src/server/accessors/` (64 files) and the host `src/server/misc/UIHelper.ts`. Adapted tests: removed
`tests/server/accessors/` (35 suites, covered by the base-runtime ones),
`AppAccessorManager.test.ts`, and the accessor setup/assertions in the four manager tests,
`AppSettingsManager.test.ts`, `AppManager.test.ts`, `AppListenerManager.test.ts`, and the two
Deno-runtime integration tests. *Verification:* host `tsc` error-set unchanged vs the
environmental-only baseline; `test:node` host suites green (excluding the two `deno`-spawn integration
suites needing a `deno` binary unavailable in that environment); base-runtime suite unaffected.
