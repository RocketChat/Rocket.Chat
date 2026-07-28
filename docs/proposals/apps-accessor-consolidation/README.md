# Plan: consolidating accessor logic into the base-runtime

## Summary

The accessor proxies in `packages/apps/base-runtime/src/lib/accessors/` exist because, when the
Deno runtime was introduced, module-resolution conflicts made it impractical to share code between
the subprocess and the host. The subprocess therefore got a thin proxy layer that forwards
`accessor:*` JSON-RPC messages to the host, where `BaseRuntimeSubprocessController.handleAccessorMessage`
walks the *real* accessor objects built by `AppAccessorManager` from `packages/apps/src/server/accessors/`.

That constraint no longer holds: the base-runtime assumes Node's module resolution, is compiled by
`tsc`, and is consumed by Deno as TypeScript source through an import map. Accessor logic can live in
the runtime itself.

This document analyzes every accessor in `packages/apps/src/server/accessors/`, classifies it by
what it actually needs from the host, and lays out a phased plan to:

1. Make the base-runtime the **single source of truth** for accessor behavior.
2. **Eliminate `handleAccessorMessage`** (and the whole `accessor:*` message category) from
   `BaseRuntimeSubprocessController`, leaving `bridges:*` as the only host-bound RPC category
   originated by accessors.

**Governing decision (per project direction):** wherever the base-runtime implementation and
`src/server/accessors/` have drifted, **merge the non-conflicting logic from both sides; on a genuine
conflict, the runtime behavior supersedes the host behavior.** The runtime implementations are what
apps actually experience in production today (the host copies of those code paths are unreachable
from the subprocess), so they are canonical wherever the two truly diverge.

Two refinements make this rule safe rather than a blanket "runtime wins":

- **The merge rule is direction-aware.** For **MOVE** accessors the host is authoritative today (the
  app hits it through the proxy), so merging *preserves* live behavior and folding in whatever the
  runtime already does is safe; conflicts resolve to the runtime. For **RECONCILE** accessors the
  runtime is authoritative today, so merging a piece of *host-only* logic the runtime currently lacks
  **adds new observable behavior to production** — it is a deliberate change (tested + noted in the
  CHANGELOG), never a "neutral" reconciliation.
- **Drift is classified before adoption (see §3).** Where the runtime is a superset of or
  semantically equivalent to the host, adopt it silently. Where the runtime *dropped or changed*
  observable behavior (e.g. drift #1 diff-vs-full-object, #6 BlockBuilder appId), require a one-line
  justification that the drop is intentional and harmless, backed by a test that pins the resulting
  shape — so the migration cannot silently immortalize an accidental regression as the contract.

## Benefits

- **One source of truth** - accessor behavior clearly defined in a single place.
- **Dead code elimination** - existing unused accessor files can be erased.
- **Less responsibility for subprocess controllers** - the whole `accessor:*` message family handling code is unnecessary
- **Improved DX** - less proxies make for better LSP integration

---

## 1. Current architecture

An accessor call from an app can take one of three paths today:

| Path | Example | Mechanism |
| --- | --- | --- |
| **Pure proxy** | `read.getRoomReader().getById(id)` | `proxify()` in `base-runtime/src/lib/accessors/mod.ts` sends `accessor:getReader:getRoomReader:getById`; the host resolves it against the real `RoomRead` instance via `handleAccessorMessage` → `AppAccessorManager` → `RoomBridge.doGetById` |
| **Local implementation + direct bridge call** | `modify.getCreator().finish(builder)` | `base-runtime` `ModifyCreator` validates locally, then sends `bridges:getMessageBridge:doCreate`; the host's `handleBridgeMessage` invokes the permission-wrapped bridge method |
| **Fully local** | `configurationExtend.http.provideDefaultHeader()` | `HttpExtend` state lives entirely in the subprocess |

So the codebase already contains the target pattern (paths 2 and 3) — the plan is essentially to
migrate path 1 into paths 2 and 3, and to close the gaps that forced some accessors to stay on
path 1.

### 1.1 Why the `bridges:*` path is sufficient security-wise

Permission enforcement does **not** live in the accessors. It lives in the host-side bridge `do*`
wrappers (e.g. `MessageBridge.doCreate` checks `AppPermissionManager.hasPermission(appId, AppPermissions.message.write)`
before calling the abstract `create`). Three properties make the bridge channel a complete trust
boundary:

- `handleBridgeMessage` only dispatches methods that start with `do` — the permission-wrapped
  surface (`BaseRuntimeSubprocessController.ts:530`).
- Any param equal to the literal `'APP_ID'` is replaced host-side with the app's real id
  (`BaseRuntimeSubprocessController.ts:546-548`), so a subprocess cannot impersonate another app.
- `AppPermissionManager.hasPermission(appId, permission)` takes the appId explicitly; there is no
  call-stack or async-context magic that would break when the caller moves out of the host process
  (`getCallStack()` is only used to decorate error logs).

Consequently, moving accessor logic into the subprocess **loses nothing permission-wise**, provided
every side effect still flows through a `do*` bridge method.

An important consequence: accessor-level validation (e.g. `RoomRead.getMessages` capping `limit` at
100) becomes *advisory* once it runs inside the sandbox — but it already is advisory today, because
a subprocess can emit arbitrary `bridges:*` messages and bypass the host-side accessors entirely.
Validation that is actually load-bearing must live in the bridges. See §7 (follow-ups).

### 1.2 Who consumes the host-side accessors today

Auditing every call site of `AppAccessorManager` shows the host-side accessor code is almost
exclusively serving the subprocess RPC channel:

- `BaseRuntimeSubprocessController.handleAccessorMessage` — the primary consumer.
- `AppListenerManager.executePostMessageSent` (`managers/AppListenerManager.ts:560`) — the **only**
  genuine host-side accessor use: `getReader(appId).getUserReader().getAppUser()` to gate
  `IPostMessageSentToBot`. Trivially replaceable with `bridges.getUserBridge().doGetAppUser(appId)`.
- `accessors/Http.ts` — reaches back into `AppAccessorManager` to build reader/persistence for HTTP
  pre/post handlers; dead for subprocess apps (the runtime `Http` is already local) once the move
  completes.
- `accessors/AppAccessors.ts` — exported but **never instantiated** anywhere in `src/`. Dead code;
  the live `IAppAccessors` is the base-runtime one.
- `AppApiManager`, `AppSlashCommandManager`, `AppVideoConfProviderManager`,
  `AppOutboundCommunicationProviderManager` — all thread `this.accessors` into their executor
  classes, whose `runTheCode`/`runExecutor` methods ignore it (`_accessors`). Legacy signatures from
  the in-process runtime era.

Nothing in `apps/meteor` touches `AppAccessorManager`. This means the host-side accessor directory
can be deleted at the end of the migration with only one substantive host change
(`AppListenerManager`).

---

## 2. Accessor-by-accessor disposition

Legend:

- **MOVE** — implement in base-runtime (port host logic, honoring runtime-supersedes drift rule);
  side effects via existing bridge `do*` methods; delete host class in teardown.
- **RECONCILE** — already implemented in base-runtime; make it canonical, normalize details, delete host copy.
- **BRIDGE-GAP** — logic can move, but the host side effect has no bridge `do*` today; requires the
  new `AppResourceBridge` (§4).
- **DELETE** — dead on the host already.

### 2.1 Reader family (all MOVE — bridge passthroughs plus portable validation)

| Accessor | Host deps | Notes on logic that moves with it |
| --- | --- | --- |
| `Reader` | 15 sub-readers | Pure facade. |
| `MessageRead` | MessageBridge | `getSenderUser`/`getRoom` are fetch-then-extract compositions. |
| `RoomRead` | RoomBridge | `getMessages`/`getAllRooms`/`getUnreadByUser` carry limit/skip/sort validation (`GetMessagesSortableFields` comes from apps-engine definitions — importable by the runtime). |
| `UserRead` | UserBridge | `getAppUser(appId?)` defaults the arg; keep behavior. |
| `PersistenceRead` | PersistenceBridge | Single-assoc → array wrapping. |
| `LivechatRead` | LivechatBridge | `isOnline` deprecation warning moves too (runtime `console` is already piped to app logs). |
| `UploadRead` | UploadBridge | `getBufferById` becomes two bridge RPCs instead of one accessor RPC — accepted (see §6, chattiness). |
| `CloudWorkspaceRead` | CloudWorkspaceBridge | 1:1. |
| `VideoConferenceRead` | VideoConferenceBridge | 1:1. |
| `OAuthAppsReader` | OAuthAppsBridge | 1:1 (`doGetByid` typo is on the bridge; unchanged). |
| `ContactRead` | AppBridges → ContactBridge | 1:1. |
| `ThreadRead` | ThreadBridge | 1:1. |
| `RoleRead` | RoleBridge | 1:1. |
| `ExperimentalRead` | ExperimentalBridge | Empty shell; becomes an empty local class. |

### 2.2 Environment family

| Accessor | Disposition | Notes |
| --- | --- | --- |
| `EnvironmentRead` | MOVE | Facade over the three below. |
| `ServerSettingRead` | MOVE | `getValueById` fallback (`value → packageValue`) moves; `getAll` throws "not implemented" — keep throwing locally. |
| `EnvironmentalVariableRead` | MOVE | 1:1 over EnvironmentalVariableBridge. |
| `SettingRead` | **BRIDGE-GAP** | Reads `ProxiedApp.getStorageItem().settings` — host-persisted app metadata. Needs `AppResourceBridge.doGetAppSetting`. |
| `EnvironmentWrite` | MOVE | Facade. |
| `ServerSettingUpdater` | MOVE | 1:1 + `incrementValue` default. |
| `SettingUpdater` | **BRIDGE-GAP** | Mutates app settings via `AppSettingsManager.updateAppSetting` (persists, fires `doOnAppSettingsChange`, runs the `ON_PRE_SETTING_UPDATE` round-trip back into the app). Needs `AppResourceBridge.doUpdateAppSetting`. |

### 2.3 Modify family

| Accessor | Disposition | Notes |
| --- | --- | --- |
| `Modify` | MOVE | Facade; base-runtime `getModifier()` already exists, loses its remaining `proxify` entries. |
| `ModifyCreator` | RECONCILE | Base-runtime version is canonical (§3). Sub-creators below stop being proxies. |
| `LivechatCreator` | MOVE | `createToken` already local in runtime (supersedes). Rest is 1:1 LivechatBridge. |
| `UploadCreator` | MOVE | `uploadBuffer` defaults user via `doGetAppUser` — two bridge RPCs, fine. |
| `EmailCreator` | MOVE | 1:1 `doSendEmail`. |
| `ContactCreator` | MOVE | 1:1 ContactBridge. |
| `ModifyUpdater` | RECONCILE | Runtime diff-update semantics win (§3). Sub-updaters below stop being proxies. |
| `MessageUpdater` | MOVE | 1:1 reactions. |
| `LivechatUpdater` | MOVE | 1:1 + boolean coercion in `setCustomFields`. |
| `UserUpdater` | MOVE | Partial-object wrapping + 1:1 calls. |
| `ModifyExtender` | RECONCILE | Already equivalent; delete host copy. |
| `ModifyDeleter` | MOVE | `removeUsersFromRoom` ≤50 validation moves. |
| `Notifier` | RECONCILE | Runtime version canonical (awaits typing calls — supersedes host's fire-and-forget). |
| `UIController` | MOVE | Builds UIKit interaction payloads + `UIHelper.assignIds`, then `doNotifyUser` on UiInteractionBridge. Requires relocating `UIHelper` (§5.3). |
| `SchedulerModify` | MOVE | `createProcessorId(jobId, appId)` is a pure, idempotent function (duplicated locally in the file already); the subprocess knows its own appId for the suffix, and the bridge still permission-checks against the real id. |
| `OAuthAppsModify` | MOVE | 1:1. |
| `ModerationModify` | MOVE | 1:1 (appId comes from method args by design; unchanged). |

### 2.4 Configuration extend/modify family (the registration surface)

These are the reason `handleAccessorMessage` can't be deleted by bridge calls alone: they write into
host-only managers whose in-memory registries the host reads to render UI, route events, and
dispatch executions back into the subprocess.

| Accessor | Host dependency | Disposition |
| --- | --- | --- |
| `ConfigurationExtend` | facade | MOVE (facade only). |
| `HttpExtend` | none | RECONCILE — already fully local in runtime. |
| `SettingsExtend` | `ProxiedApp` storage item | **BRIDGE-GAP** → `doProvideSetting`. |
| `SlashCommandsExtend` | `AppSlashCommandManager.addCommand` (registry, "touched command" conflict tracking, `CommandAlreadyExistsError`) | **BRIDGE-GAP** → `doProvideSlashCommand`. |
| `ApiExtend` | `AppApiManager.addApi` (registry, `PathAlreadyExistsError`) | **BRIDGE-GAP** → `doProvideApi`; `listApis` → `doListApis` (kills the `accessor:api:listApis` special case). |
| `ExternalComponentsExtend` | `AppExternalComponentManager` | **BRIDGE-GAP** → `doRegisterExternalComponent`. |
| `SchedulerExtend` | `AppSchedulerManager.registerProcessors` (wraps processors in host callbacks, namespaces ids, guards disabled apps) | **BRIDGE-GAP** → `doRegisterProcessors`. |
| `UIExtend` | `UIActionButtonManager` (button registry read directly by host UI; `ui.registerButtons` permission; `doActionsChanged` side effect) | **BRIDGE-GAP** → `doRegisterActionButton`. |
| `VideoConfProviderExtend` | `AppVideoConfProviderManager.addProvider` (throws `PermissionDeniedError`; name-collision tracking) | **BRIDGE-GAP** → `doProvideVideoConfProvider`. |
| `OutboundMessageProviderExtend` | `AppOutboundCommunicationProviderManager.addProvider` (throws `PermissionDeniedError`) | **BRIDGE-GAP** → `doRegisterOutboundProvider`. |
| `ConfigurationModify` | facade | MOVE. |
| `ServerSettingsModify` | ServerSettingBridge | MOVE (1:1 + increment default). |
| `SlashCommandsModify` | `AppSlashCommandManager` modify/enable/disable | **BRIDGE-GAP** → `doModifySlashCommand` / `doEnableSlashCommand` / `doDisableSlashCommand`. |

Serialization note: `ISlashCommand`, `IProcessor`, `IApi`, and the provider objects contain
functions (executors). Today's `accessor:*` messages already strip them in JSON serialization — the
host managers keep metadata and dispatch executions *back into* the subprocess, which looks the live
instances up in `AppObjectRegistry`. The new bridge methods receive exactly the same serialized
shapes, so **the wire semantics don't change, only the message prefix does**. The
`AppObjectRegistry` stash-then-forward pattern in `mod.ts` stays as-is.

### 2.5 Standalone

| Accessor | Disposition | Notes |
| --- | --- | --- |
| `Http` | RECONCILE | Runtime `Http` already local (merges `HttpExtend` defaults, runs pre/post handlers, calls `doCall`). Host copy — including its awkward reach-back into `AppAccessorManager` — is deleted. |
| `Persistence` | MOVE | 1:1 + arg wrapping/defaults. |
| `AppAccessors` | DELETE | Never instantiated on the host; the runtime `AppAccessors` (in `mod.ts`) is the live one. |

---

## 3. Drift resolution table (the both-sides subset only)

This table is the per-accessor resolution for the **bounded subset of accessors that carry logic on
*both* sides today** — the RECONCILE accessors plus the few MOVE accessors that are already partially
local. Pure-proxy MOVE accessors (the Reader family etc.) have **no runtime counterpart to
reconcile** and are deliberately excluded: they are faithful-ported and verified by the parity check
(§6), not by this table.

Each row is resolved under the governing rule: **merge non-conflicting logic; runtime supersedes on
conflict.** The `Class` column records which of the three cases applies:

- **superset/equiv** — runtime already covers the host behavior (or is a strict superset); adopt
  silently, no observable change.
- **conflict→runtime** — the two genuinely diverge for the same input; the runtime wins, and because
  the runtime is authoritative today this is still observationally neutral for production.
- **merge (host→runtime)** — host-only logic is folded *into* the live runtime accessor; this **adds
  observable behavior to production** and must ship with a test + CHANGELOG note (per the
  direction-aware rule in the Summary).

| # | Drift | Class | Decision |
| --- | --- | --- | --- |
| 1 | **Update payload shape** — host `ModifyUpdater._finishMessage/_finishRoom` send the *full* builder object to `doUpdate`; runtime sends a *diff* (`{ id, ...builder.getChanges() }`). | conflict→runtime | Diff semantics win. Bridges demonstrably accept the diff (it is what production sends). Delete the host full-object path. **Observable-drop → pin the diff shape with a test** confirming the reduced payload is intentional. |
| 2 | **Editor tracking** — runtime `ModifyUpdater.message()` calls `builder.setEditor(editor)`; host ignores the updater param. | superset/equiv | Runtime wins: editor is recorded on update (runtime is a superset). |
| 3 | **`typing()` awaits** — runtime `Notifier` awaits `doTyping` start/stop; host fires-and-forgets. | superset/equiv | Runtime wins (awaited). |
| 4 | **`createToken`** — runtime generates `randomBytes(16).toString('hex')` locally; host generated it host-side. | conflict→runtime | Runtime wins (local generation; same format). |
| 5 | **HTTP method representation** — runtime uses lowercase string literals; host used the `RequestMethod` enum. | superset/equiv | Runtime wins; the `doCall` payload shape is identical. |
| 6 | **`BlockBuilder` appId** — host `getBlockBuilder()` passes appId into the builder; runtime builder takes none (ids assigned later via `UIHelper.assignIds` with the registry appId). | conflict→runtime | Runtime wins. **Observable-drop → require a one-line justification that dropping the constructor appId is intentional (ids are assigned later) and a test pinning the resulting block shape**, so an incomplete port is not blessed as the contract. |
| 7 | **`APP_ID` placeholder inconsistency** — exactly one runtime call site (`ModifyCreator._finishMessage` → `doGetAppUser`) sends the anti-impersonation `'APP_ID'` placeholder; every other runtime bridge call sends the raw `AppObjectRegistry.get('id')`. | normalization | Not a "pick one side" drift — this is a normalization task: **all** bridge params that denote the *calling app* must use `'APP_ID'` (§5.2). Host substitution already handles it. Params that are app-supplied *arguments* (not caller identity) stay raw — see the exception list in §5.2. |
| 8 | Cosmetic error-message wording differences (e.g. "can not" vs "can't"). | conflict→runtime | Runtime wording wins; not worth preserving host strings. |

Rule for the newly-ported (pure-proxy MOVE) accessors — Reader family etc.: those have no runtime
counterpart yet, so the host logic is ported as-is — there is nothing to supersede, and correctness
is guaranteed by the parity check (§6) rather than by this table. Where a ported accessor interacts
with a reconciled one, the reconciled (runtime) semantics apply.

---

## 4. Closing the bridge gaps: `AppResourceBridge`

The BRIDGE-GAP rows all reduce to one missing capability: *"invoke an app-scoped operation on a host
manager / the app's own storage item"*. Rather than keeping a residual `accessor:*` channel for
them, add one internal bridge so they ride the existing, permission-checked, appId-substituting
`bridges:*` channel:

```text
AppResourceBridge (host-side, internal — not part of the app-facing definition surface)
├── doProvideSetting(setting, appId)            → ProxiedApp.getStorageItem() mutation (SettingsExtend semantics)
├── doGetAppSetting(id, appId)                  → app.getStorageItem().settings[id] (SettingRead semantics)
├── doUpdateAppSetting(setting, appId)          → AppSettingsManager.updateAppSetting
├── doProvideSlashCommand(command, appId)       → AppSlashCommandManager.addCommand
├── doModifySlashCommand(command, appId)        → AppSlashCommandManager.modifyCommand
├── doEnableSlashCommand(name, appId)           → AppSlashCommandManager.enableCommand
├── doDisableSlashCommand(name, appId)          → AppSlashCommandManager.disableCommand
├── doProvideApi(api, appId)                    → AppApiManager.addApi
├── doListApis(appId)                           → AppApiManager.listApis
├── doRegisterProcessors(processors, appId)     → AppSchedulerManager.registerProcessors
├── doRegisterActionButton(button, appId)       → UIActionButtonManager.registerActionButton
├── doRegisterExternalComponent(component, appId) → AppExternalComponentManager.addExternalComponent
├── doProvideVideoConfProvider(provider, appId) → AppVideoConfProviderManager.addProvider
└── doRegisterOutboundProvider(provider, appId) → AppOutboundCommunicationProviderManager.addProvider
```

Design points:

- **Placement.** The managers live in `packages/apps`, so the bridge is implemented there and
  instantiated by `AppManager` — *not* added as an abstract getter on `AppBridges` (which would
  force every orchestrator/host embedding to implement it). `handleBridgeMessage` resolves bridge
  names from `this.bridges` first, then from an engine-owned internal-bridge lookup supplied by
  `AppManager`. The `do*`-prefix gate and `'APP_ID'` substitution apply identically.
- **Permission behavior is preserved, including throw-vs-silent.** The bridge methods delegate to
  the managers, which keep their own checks: `AppVideoConfProviderManager.addProvider` and
  `AppOutboundCommunicationProviderManager.addProvider` **throw** `PermissionDeniedError` (the
  JSON-RPC error propagates to the app exactly as it does today through `handleAccessorMessage`);
  `UIActionButtonManager.registerActionButton` logs-and-refuses silently. No behavior change.
- **Conflict-tracking errors** (`CommandAlreadyExistsError`, `CommandHasAlreadyBeenTouchedError`,
  `PathAlreadyExistsError`, `VideoConfProviderAlreadyExistsError`) also propagate as JSON-RPC errors,
  same as today.
- **The restart hijack moves with it — via an explicit method set, not a name prefix.** Today
  `handleAccessorMessage` short-circuits any `getConfigurationExtend` call to `success(null)` while
  the controller is `restarting` (re-running `app:initialize` must not re-register resources, but the
  subprocess must still rebuild its local `AppObjectRegistry` entries). Today's guard is clean
  because it keys on the accessor *origin* (`getConfigurationExtend`), which structurally captures the
  whole registration surface. The bridge equivalent must **not** re-derive that boundary from method
  name prefixes like `doProvide*`/`doRegister*` — that is a convention-dependent footgun (a future
  registration method named otherwise would double-register during restart; a future non-registration
  method matching the prefix would be silently dropped). Instead, `AppResourceBridge` exposes an
  explicit static `REGISTRATION_METHODS` set enumerating exactly the method names that must be
  suppressed during restart (the `doProvide*`/`doRegister*` registrations — *not* the read/update
  methods `doGetAppSetting`/`doUpdateAppSetting`/`doModifySlashCommand`/`doEnable*`/`doDisable*`/
  `doListApis`), and `handleBridgeMessage` consults that set while `state === 'restarting'`. This
  keeps the guarded surface auditable and decoupled from naming discipline. The runtime-side `_proxy`
  wrappers keep stashing the live instances into `AppObjectRegistry` *before* the RPC, so local
  re-registration still works during restarts. This is a stopgap: the real fix — an explicit
  `reinitialize` mode telegraphed to the subprocess (follow-up #2) — should be referenced in a comment
  at the guard site, and is not a prerequisite here.

### Deal breakers considered, and why this is the best compromise

- **Moving the registries into the subprocess is a non-starter.** The host reads
  `UIActionButtonManager.getAllActionButtons` to render UI, routes slash-command/api/scheduler/provider
  invocations off these registries, and enforces cross-app conflict rules (two apps registering the
  same slash command) that no single subprocess can arbitrate. App settings are host-persisted
  metadata read by other subsystems. So a host-side write surface must remain.
- **Keeping a residual `accessor:*` channel just for registration** would work but keeps two RPC
  categories, two dispatchers, and the reflective accessor-path-walking code alive. The bridge
  approach reuses an existing dispatcher, its security gates, and its error model — and lets
  `handleAccessorMessage`, `ALLOWED_ACCESSOR_METHODS`, `isValidOrigin`, and `getAccessorForOrigin`
  be deleted entirely, which is the stated objective.
- **Net effect on the objectives:** accessor behavior (validation, shaping, defaulting) has exactly
  one home — the base-runtime. The host keeps only *state and enforcement* (registries, persistence,
  permissions), reachable through a uniform, auditable `do*` surface.

---

## 5. Cross-cutting design details

### 5.1 `RemoteBridges`: a typed bridge facade for the runtime

Today each runtime accessor hand-rolls its `bridges:...` message strings. To port ~30 host accessor
classes with minimal diffs — and keep them readable against their git history — introduce
`base-runtime/src/lib/bridges/RemoteBridges.ts`:

- Getters mirroring the `AppBridges` surface the accessors use (`getMessageBridge()`,
  `getRoomBridge()`, …, `getAppResourceBridge()`).
- Each getter returns a `Proxy` that turns `doX(...args)` into
  `sendRequest({ method: 'bridges:<getter>:doX', params: args })`, unwraps `response.result`, and
  maps errors through `formatErrorResponse`.
- Only `do*` method names are allowed (mirrors the host gate; fails fast in the runtime).

Ported accessors then keep their host shape (`constructor(bridge, appId)`,
`this.bridge.doGetById(id, this.appId)`) with `appId = 'APP_ID'`. Existing runtime accessors
(`Http`, `Notifier`, `Modify*`) are refactored onto the same facade, deleting their bespoke
`senderFn` plumbing.

**The facade must not auto-inject `'APP_ID'`.** Identity is passed *explicitly* by each ported
accessor (positionally, exactly as the host accessor did), so a faithful copy keeps caller-identity
params carrying the `'APP_ID'` sentinel and leaves app-supplied argument-appIds raw *by
construction*. Centralizing injection in the facade is cleaner but would make the argument-appId
exceptions (below) the dangerous default — a mechanical port across ~30 classes must not depend on
the facade guessing which appIds are identity vs. argument.

### 5.2 `APP_ID` placeholder everywhere

All bridge params denoting the *calling app* use the `'APP_ID'` literal; the host substitutes the
real id (value-based substitution at `BaseRuntimeSubprocessController.ts:548`). This fixes today's
inconsistency (§3 #7), removes the runtime's reliance on `AppObjectRegistry.get('id')` for identity
(it remains available for non-identity uses like `UIHelper.assignIds` block-id prefixes and scheduler
job-id suffixes), and makes impersonation structurally impossible for the whole accessor surface.

**This is a per-param judgment that can fail in *both* directions**, so it must be applied
deliberately, not mechanically:

- **Over-normalizing** a genuine app-supplied argument-appId → the app loses the ability to pass any
  appId and can only ever act as itself (a silent behavior change).
- **Under-normalizing** a caller-identity param → re-opens exactly the impersonation gap this section
  closes.

Because neither failure is caught by the type-checker or a green test suite, produce an **up-front
exception list (Phase 0 artifact)** of every `do*` param where the appId is an *app-supplied
argument, not caller identity* — those stay raw and must **not** be normalized. Known members
(audit for others when porting):

- `ModerationBridge.doReport(messageId, description, userId, appId)`
- `ModerationBridge.doDismissReportsByMessageId(messageId, reason, action, appId)`
- `ModerationBridge.doDismissReportsByUserId(userId, reason, action, appId)`

(`ModerationModify` already ignores its constructor `_appId` and forwards the app-supplied method-arg
`appId`; the faithful port preserves this, so keeping APP_ID explicit per §5.1 handles it naturally.)

The longer-term home for this is a consolidated host↔subprocess protocol/SDK (follow-up #6) — a
single typed manifest of every method and its accepted params — for which this exception list is the
seed.

### 5.3 Module-resolution constraints (the original reason for the proxies)

The Deno subprocess consumes base-runtime **as TypeScript source** through the import map
(`@rocket.chat/apps/base-runtime/` → `../base-runtime/src/`); compiled `dist` CJS is avoided because
its `require()` calls bypass the import map (see the comment block in `deno-runtime/main.ts`).
Rules for the moved code:

- Imports are restricted to: `@rocket.chat/apps-engine/definition/*` (mapped to source),
  `node:` builtins, and npm deps already present in `deno.jsonc`'s import map / Deno cache.
  This holds for every accessor being moved — they import definition types, and the few utilities
  below.
- **`UIHelper` is duplicated into base-runtime — not shared cross-package.** It is a small pure
  helper (imports only `node:crypto` plus two *type-only* imports, `IBlock` and `LayoutBlock`, which
  are erased at transpile and so need no import-map entry) needed by
  `ModifyCreator`/`ModifyUpdater`/`UIController`. The runtime currently imports it from
  `@rocket.chat/apps/dist/server/misc/UIHelper` — exactly the fragile dist-CJS import the runtime
  otherwise avoids. **Do not make the host import it back from base-runtime**: base-runtime already
  imports `apps/dist` (host output), so a host→base-runtime dist import would create an
  unlinearizable *build cycle* (and "flip the order" only moves the cycle). Instead, in Phase 0 copy
  `UIHelper` into `base-runtime/src/lib/` (the runtime immediately stops importing the `apps/dist`
  path) while leaving the `src/server/misc/UIHelper.ts` copy untouched for the still-living host
  accessors. All three of its `src/` importers (`ModifyCreator`, `ModifyUpdater`, `UIController`) are
  MOVE accessors deleted by this migration, so the `src/` copy is deleted in Phase 4 teardown —
  achieving a single source of truth *at teardown* with no cross-package import and no build-order
  change. A transient duplicate of a ~30-line pure helper is cheaper than a build-graph cycle.
- Other tiny helpers to carry over: `createProcessorId` (already duplicated as a local function in
  `SchedulerModify.ts` — stays a local function), the `GetMessagesSortableFields` /
  sort-validation logic in `RoomRead` (constants come from apps-engine definitions).
- `lodash.clonedeep` (used by host extenders) is *not* needed — the runtime extenders already exist
  without it (RECONCILE, not MOVE).
- Build order already compiles `src/` before `base-runtime/` (`build:default` → `build:base-runtime`);
  if the host ends up importing anything from base-runtime dist, flip the order. Prefer designs
  where the host doesn't import runtime code at all (after teardown, it shouldn't need to).

### 5.4 Error semantics

- Validation errors that used to be thrown host-side inside accessor methods (then serialized as
  JSON-RPC error 1000 by `handleAccessorMessage`) now throw *locally* in the subprocess — same
  message, better stack traces for app developers, one less round trip.
- Bridge-side errors keep today's `handleBridgeMessage` shape (code -32000, message preserved,
  formatted by `formatErrorResponse` runtime-side).
- Permission failures on read/write bridges stay *silent-undefined* (bridge wrappers return
  `undefined` and log); manager-level registration failures keep *throwing*. Both behaviors are
  preserved verbatim because both layers are reused untouched.

### 5.5 `AppObjectRegistry` and one-app-per-process

The registry (a process-global singleton keyed by simple strings, including a single `id`) assumes
one app per subprocess. The migration keeps that assumption — worth restating in code comments,
since consolidating more logic into the runtime makes the assumption more load-bearing.

---

## 6. Known trade-offs

- **Slightly chattier for composite reads.** `UploadRead.getBufferById` and
  `UploadCreator.uploadBuffer` become two bridge RPCs where one accessor RPC (wrapping two in-host
  bridge calls) sufficed. Bounded, rare, and symmetrical with what `Notifier`/`ModifyCreator`
  already do today. No pagination-style N+1 patterns exist in the accessor surface.
- **Validation inside the sandbox is advisory.** Unchanged in practice (see §1.1), but the migration
  makes it explicit. Hard limits that matter (e.g. `getMessages` limit ≤ 100,
  `removeUsersFromRoom` ≤ 50) should eventually be enforced in the bridges (§7).
- **Two implementations exist transiently during the phased rollout.** Mitigated by deleting each
  host class in the same PR that flips its runtime counterpart from proxy to local — "one source of
  truth" is enforced **per-accessor, per-PR** (see §8: a phase is a milestone, not a single PR), not
  in a big-bang.

- **"Faithful port" of MOVE accessors is verified, not asserted.** For MOVE accessors the host logic
  is *live in production today* (the app reaches it through the proxy), so a subtly wrong port — a
  dropped default, an off-by-one on a cap, a renamed sort field — is an immediate observable
  regression. Ported unit tests only prove the new class satisfies carried-over assertions; they do
  **not** prove equivalence with the old class, so a port that drops an uncovered branch passes green.
  Therefore, before deleting each host MOVE class, gate it on a **mechanical parity check**: either a
  transitional differential harness that drives a representative set of calls through *both* the old
  proxy path and the new local path and asserts identical bridge-message output (method string +
  params) and identical return shaping, or — where a differential harness is too heavy — an
  **enforced branch-coverage audit** of the ported tests against the host source (every validation
  branch, default, and error path pinned). The differential harness is throwaway and is removed in
  Phase 4 teardown. (RECONCILE accessors do not need this — their host copy is already unreachable —
  but their merge decisions are governed by §3 and the direction-aware rule instead.)

---

## 7. Follow-ups (out of scope, unblocked or motivated by this work)

1. **Bridge-level input hardening** — move load-bearing caps/validation into bridge `do*` wrappers
   (they are the real trust boundary). **Framing:** these caps (`getMessages` ≤ 100,
   `removeUsersFromRoom` ≤ 50, …) are *already* bypassable **today**, pre-migration — app code runs
   via `new Function` in the runtime's own JS realm (globals are merely shadowed, not a security
   boundary; see `construct.ts`) and can reach the messenger to emit arbitrary `bridges:*` messages.
   So this migration introduces **no new exposure**; it only makes the existing advisory-ness visible.
   This is therefore an independent security-hardening item, decoupled from and non-blocking for this
   refactor — track it on its own, not as a tail of the migration.
2. **Replace the restart registration guard** with an explicit `reinitialize` request so the
   subprocess knows not to re-send registrations, removing controller-state-dependent message
   dropping.
3. **`messenger.sendRequest` timeout** — the runtime-side TODO becomes more prominent once all
   accessor traffic flows through it.
4. **Drop the legacy `_accessors` threading** through `AppApi.runExecutor`,
   `AppSlashCommand.runTheCode`, `AppVideoConfProvider.runTheCode`,
   `AppOutboundCommunicationProvider.runTheCode` signatures.
5. **Consolidated host↔subprocess protocol/SDK** — a single typed manifest of every host-bound method
   and its accepted params (the §5.2 explicit method/exception list is the seed), replacing today's
   hand-rolled message strings and per-param normalization judgment with a declared contract. A
   phase *after* this migration, not a prerequisite; this work should produce the explicit list, the
   SDK formalizes it.

---

## 8. Phased implementation plan

**A phase is a milestone, not a single PR.** Each phase is independently shippable and keeps both
test suites (`test:node`/`test:deno`/`test:base-runtime`) green, but the *unit of merge* is the
accessor, not the phase — Phases 1 and 2 in particular are landed as a **series of per-accessor (or
tight cohesive-group, e.g. the three `Scheduler*` pieces) PRs**, so blast radius per merge is one
accessor family rather than a whole family of thirteen. This matters because the migration flips
*live production behavior* for MOVE accessors with no rollback but `git revert`, and the unit of
revert equals the unit of merge. Phases 0, 3, and 4 have genuinely atomic units (the facade;
`AppResourceBridge` + guard; the teardown) and may stay coarser.

Host accessor tests in `packages/apps/tests/server/accessors/` are ported to
`base-runtime/src/lib/accessors/tests/` *in the PR that moves the accessor*, and the host class + its
tests are deleted in that same PR — gated, for MOVE accessors, on the parity check (§6).

### Phase 0 — Foundations (no behavior change) — ✅ landed

1. ✅ Add `RemoteBridges` facade (§5.1) with tests (message-string generation, `do*` gate, error
   formatting). The facade does **not** auto-inject `'APP_ID'` — identity stays an explicit
   positional arg (§5.1). → `base-runtime/src/lib/bridges/RemoteBridges.ts` (+ tests).
2. ✅ Produce the **APP_ID exception list** (§5.2) — the audited set of `do*` params where the appId
   is an app-supplied argument, not caller identity (known seed: the three `ModerationBridge`
   methods). → `docs/proposals/apps-accessor-consolidation/base-runtime-app-id-exceptions.md`. The audit surfaced a **second** exception
   category (bucket C): the host's sentinel substitution rewrites only *top-level positional* params,
   so a nested identity field like `Http.doCall`'s payload `appId` cannot use the sentinel and keeps
   the resolved id.
3. ✅ Refactor existing runtime accessors (`Http`, `Notifier`, `ModifyCreator`, `ModifyUpdater`,
   `ModifyExtender`, `roomFactory`) onto `RemoteBridges`; normalize every *caller-identity* param to
   `'APP_ID'` (§5.2), leaving argument-appIds raw per the exception list. Each accessor builds its
   facade from a `(request) => this.senderFn(request)` thunk so instance-level `senderFn` test
   stubs stay intercepted; accessors that still hold `accessor:*` sub-proxies (`ModifyCreator`,
   `ModifyUpdater`) keep `senderFn` for those until their Phase-2 port.
4. ✅ **Duplicate** `UIHelper` into `base-runtime/src/lib/` so the runtime stops importing the
   `apps/dist` path; leave the `src/server/misc/UIHelper.ts` copy for the still-living host accessors
   (deleted in Phase 4). No cross-package import, no build-order flip (§5.3).
5. ✅ Stand up the transitional **parity harness** scaffolding (§6) used to gate MOVE-accessor
   deletions in Phases 1–2. → `base-runtime/src/lib/accessors/tests/helpers/parityHarness.ts` (a
   recording `sendRequest` that captures ordered `{method, params}` traffic so a port can be pinned
   against its host counterpart's documented bridge calls; removed in Phase 4 teardown).
6. ✅ Drift decisions (§3) and the direction-aware merge rule recorded in this document.
   **CHANGELOG note:** `@rocket.chat/apps` is a `private` package and has never carried a changeset;
   Phase 0 is an internal, behavior-preserving refactor, so no changeset is added — this document and
   `base-runtime-app-id-exceptions.md` are the recorded contract.

### Phase 1 — Reader family + Persistence + Environment (server-side settings)

*Landed as one PR per accessor (or tight group); each PR ports the accessor, flips its `mod.ts`
proxy entry to local, passes the §6 parity check, then deletes the host class + its tests.*

1. Port to base-runtime: `MessageRead`, `RoomRead`, `UserRead`, `PersistenceRead`, `LivechatRead`,
   `UploadRead`, `CloudWorkspaceRead`, `VideoConferenceRead`, `OAuthAppsReader`, `ContactRead`,
   `ThreadRead`, `RoleRead`, `ExperimentalRead`, `ServerSettingRead`, `EnvironmentalVariableRead`,
   `ServerSettingUpdater`, `ServerSettingsModify`, `Persistence`, and the `Reader` /
   `EnvironmentRead` / `EnvironmentWrite` facades (except the app-settings members, which stay
   proxied until Phase 3).
2. Replace the corresponding `proxify(...)` entries in `mod.ts` (`getReader`, `getPersistence`,
   `getEnvironmentRead`/`getEnvironmentWrite` server-settings/env-var members,
   `getConfigurationModify:serverSettings`).
3. Delete the host classes + prune `AppAccessorManager` construction accordingly; port tests.

### Phase 2 — Modify family completion

*Same cadence as Phase 1: one PR per accessor (or tight group), parity-checked before the host class
is deleted. RECONCILE members (`ModifyCreator`/`ModifyUpdater`/`ModifyExtender`/`Notifier`) follow §3
+ the direction-aware merge rule instead of the parity check.*

1. Port: `ModifyDeleter`, `MessageUpdater`, `LivechatUpdater`, `UserUpdater`, `LivechatCreator`,
   `UploadCreator`, `EmailCreator`, `ContactCreator`, `UIController`, `SchedulerModify`,
   `OAuthAppsModify`, `ModerationModify`, `Modify` facade.
2. Remove the remaining `proxify` entries in `getModifier` and the sub-creator/sub-updater proxies
   inside runtime `ModifyCreator`/`ModifyUpdater`.
3. Delete host classes; port tests. After this phase, `getReader`/`getModifier`/`getPersistence`/
   `getHttp` generate **zero** `accessor:*` traffic.

### Phase 3 — Registration surface via `AppResourceBridge`

1. Host: implement `AppResourceBridge` (§4) + internal-bridge lookup in `handleBridgeMessage` +
   `restarting` guard for registration methods. Unit-test the guard and throw-vs-silent permission
   behaviors.
2. Runtime: rewrite `getConfigurationExtend` / `getConfigurationModify:slashCommands` /
   `SettingRead` / `SettingUpdater` / `SettingsExtend` members as local classes calling
   `RemoteBridges.getAppResourceBridge()`, preserving the `AppObjectRegistry` stash-then-forward
   wrappers; replace `accessor:api:listApis` with `doListApis`.
3. Delete the host `*Extend`/`SlashCommandsModify`/`SettingRead`/`SettingUpdater` accessors; port tests.

### Phase 4 — Teardown

1. Replace `AppListenerManager.executePostMessageSent`'s `getReader(...).getAppUser()` with
   `bridges.getUserBridge().doGetAppUser(appId)`.
2. Delete `handleAccessorMessage`, `ALLOWED_ACCESSOR_METHODS`, `isValidOrigin`,
   `getAccessorForOrigin`, and the `accessor:` branch in `handleIncomingMessage`.
3. Delete `src/server/accessors/` entirely (including dead `AppAccessors`, `Http`), delete
   `AppAccessorManager` (and its `purifyApp` call in `AppManager`), remove `proxify` from `mod.ts`,
   and drop the now-unused `getAccessorManager()` threading in managers (follow-up #4 can ride
   along).
4. Delete the `src/server/misc/UIHelper.ts` copy (its last importers are gone with the host
   accessors), leaving the base-runtime copy as the single source of truth; remove the transitional
   parity harness (§6).
5. CHANGELOG entry; update any architecture docs referencing the accessor message category.

**End state:** `BaseRuntimeSubprocessController` handles exactly one app-originated RPC category —
`bridges:*` — with a single dispatcher, a single permission model, and a single accessor
implementation living in `packages/apps/base-runtime`.
