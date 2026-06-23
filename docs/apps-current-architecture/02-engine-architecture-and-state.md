# Apps v1 — Engine Architecture & App State Management (`@rocket.chat/apps`)

> Snapshot of the **current** implementation. The app-facing *types* live in `@rocket.chat/apps-engine`
> (see `01-app-facing-sdk.md`); the actual *engine* — lifecycle, state, storage, managers — lives in
> `@rocket.chat/apps` (`packages/apps/src/server/`), which is what this document covers.

## 1. The big picture

```
@rocket.chat/apps  (the engine)
├── AppManager ............ the god-object orchestrator
├── ProxiedApp ............ per-app wrapper: holds status + storage + runtime handle
├── managers/ ............. ~16 specialized managers (listeners, settings, commands, api, …)
├── storage/ ............. metadata / source / log persistence (abstract; host implements)
├── bridges/ ............. host API surface (see 03-runtime-and-bridges.md)
├── compiler/ ............ unzip → parse → instantiate (see 03)
└── runtime/ ............. Deno/Node subprocess sandboxes (see 03)
```

The host (Rocket.Chat) wires everything together through `IAppServerOrchestrator`
(`src/IAppServerOrchestrator.ts:10`) and the global `Apps` proxy (`src/orchestrator.ts`). The host
supplies the concrete storage and bridge implementations; the engine supplies the orchestration.

---

## 2. `AppManager` — the orchestrator (`src/server/AppManager.ts`)

The design doc's complaint that "`AppManager` has too many responsibilities" is accurate and
measurable. A single class owns:

1. **The app container** — `apps: Map<string, ProxiedApp>` (`AppManager.ts:76`).
2. **The full lifecycle** — `load`, `enableAll`, `enable`/`disable`, `add` (install), `update`,
   `remove` (uninstall), plus `loadOne`.
3. **Instantiation of ~16 sub-managers** (constructor, `AppManager.ts:90-114`).
4. **Storage coordination** — metadata, source, logs.
5. **Compilation & runtime management** — via parser, compiler, `AppRuntimeManager`.
6. **State transitions** — deciding when an app moves between `AppStatus` values.
7. **License & installation validation**.
8. **App-user management** — `createAppUser` / removal (`AppManager.ts:1181`).
9. **Updates & migrations**.
10. **Bridge fan-out** — `doAppAdded`/`doAppRemoved`/`doAppStatusChanged`.

### 2.1 Sub-managers held by `AppManager`

| Field (`AppManager.ts`) | Manager | Role |
|---|---|---|
| `:90` `accessorManager` | `AppAccessorManager` | builds & caches per-app accessor instances |
| `:92` `listenerManager` | `AppListenerManager` | routes events to apps; essential-event locking |
| `:94` `commandManager` | `AppSlashCommandManager` | slash-command registry & arbitration |
| `:96` `apiManager` | `AppApiManager` | app HTTP endpoint registry/dispatch |
| `:98` `externalComponentManager` | `AppExternalComponentManager` | external UI components |
| `:100` `settingsManager` | `AppSettingsManager` | app settings get/update |
| `:102` `licenseManager` | `AppLicenseManager` | marketplace license validation |
| `:104` `schedulerManager` | `AppSchedulerManager` | scheduled jobs (status-gated) |
| `:106` `uiActionButtonManager` | `UIActionButtonManager` | UI action buttons |
| `:108` `videoConfProviderManager` | `AppVideoConfProviderManager` | video conf providers |
| `:110` `outboundCommunicationProviderManager` | `AppOutboundCommunicationProviderManager` | outbound providers |
| `:112` `signatureManager` | `AppSignatureManager` | app signing/verification |
| `:114` `runtime` | `AppRuntimeManager` | subprocess runtime lifecycle |

(Plus `AppPermissionManager`, used statically by bridges.)

---

## 3. App state management — the core topic

### 3.1 Where state lives

App state is split across **three** locations, which is itself a source of complexity:

1. **`IAppStorageItem.status`** — the persisted status in the DB (survives restarts).
2. **`ProxiedApp.storageItem`** — the in-memory mirror of that DB record.
3. **The subprocess runtime** — the *live* status as the running app sees it, fetched via
   `appRuntime.getStatus()`.

### 3.2 `ProxiedApp` — the per-app state holder (`src/server/ProxiedApp.ts`)

`ProxiedApp` wraps a running app and is the authority on its status:

- **`storageItem: IAppStorageItem`** (`ProxiedApp.ts:25`) — mutable mirror of the DB record.
- **`previousStatus: AppStatus`** (`ProxiedApp.ts:19`) — set in the constructor from
  `storageItem.status`. This is **the status the app had at last load** and is the key signal for
  "should I re-enable this on boot?"
- **`latestLicenseValidationResult`** (`ProxiedApp.ts:21`).

Status methods:

- **`getStatus()`** (`ProxiedApp.ts:88`) — **memoized (5-min cache)** call into the subprocess
  (`appRuntime.getStatus()`). The current status is therefore *owned by the running app*, not by the
  manager — a notable design choice with cache-coherence implications.
- **`setStatus(status, silent)`** (`ProxiedApp.ts:90`):
  1. `app.call(AppMethod.SETSTATUS, status)` — push the status into the subprocess.
  2. invalidate the `getStatus` memo.
  3. unless `silent`, notify the host via `AppActivationBridge.doAppStatusChanged()`.
- **`getPreviousStatus()`** (`ProxiedApp.ts:49`).
- **`validateLicense()`** (`ProxiedApp.ts:155`) / **`validateInstallation()`** (`ProxiedApp.ts:147`)
  — delegate to `AppLicenseManager` / `AppSignatureManager`; throw on failure, which the manager maps
  to the matching `*_DISABLED` status.

> Note: persisting status to the DB is done by `AppManager` via
> `appMetadataStorage.updateStatus(_id, status)` and by mutating `storageItem.status` — so a status
> change touches **all three** locations (subprocess, in-memory item, DB).

### 3.3 The status model

The `AppStatus` enum (defined in apps-engine, see `01-app-facing-sdk.md` §1.2) is a **single flat
enum that overloads three concerns**:

- *desired state* — enabled vs disabled,
- *transition origin* — `AUTO_ENABLED` vs `MANUALLY_ENABLED`, `MANUALLY_DISABLED` vs `DISABLED`,
- *error cause* — `COMPILER_ERROR_DISABLED`, `INVALID_LICENSE_DISABLED`,
  `INVALID_INSTALLATION_DISABLED`, `INVALID_SETTINGS_DISABLED`, `ERROR_DISABLED`.

There is **no separate "desired state" vs "running state"** representation — the closest proxy is the
`previousStatus`/`getStatus()` pair, which is *load-time* memory, not a declared target. This is
exactly the gap the v2 design doc closes with "two desired states (enabled/disabled) + a runtime
reconciler."

### 3.4 Lifecycle flows (state transitions)

**Boot: `load()` → `enableAll()`** (`AppManager.ts:280` and following)

```
load()
  retrieveAll() from metadata storage           // each carries its last-persisted status
  for each: fetch source → parse → compiler.toSandBox()   // spawns subprocess
            (on compile failure → ProxiedApp with EmptyRuntime, COMPILER_ERROR_DISABLED)
  isLoaded = true

enableAll()
  for each app:
    if isDisabled(status): validateLicense(); skip            // stays disabled
    else: initializeApp(app)                                   // → INITIALIZED
  for each app: check required settings → INVALID_SETTINGS_DISABLED if missing
  for each app:
    if not disabled AND previousStatus was enabled: enableApp(app)   // → *_ENABLED
    else: listenerManager.lockEssentialEvents(app)
```

The decisive rule: **an app is re-enabled on boot iff its `previousStatus` was an enabled state.**
That's how "disabled" survives restarts.

**`initializeApp()`** (`AppManager.ts:1053`): validateLicense → validateInstallation →
`app.call(INITIALIZE)` → `setStatus(INITIALIZED)` → registerCommands. Any throw ⇒ purge config +
`setStatus(ERROR_DISABLED | specific *_DISABLED)`.

**`enableApp()`** (`AppManager.ts:1131`): validateLicense → validateInstallation →
`enable = app.call(ONENABLE)`. If `enable === true`: register external components / APIs / listeners
/ providers, release essential-event locks, `setStatus(MANUALLY_ENABLED)`. If `false`: `setStatus`
disabled + purge. Throw ⇒ error-disabled.

**Install (`add`)** (`AppManager.ts:568`): unpackage → build `IAppStorageItem` with initial status
`MANUALLY_ENABLED`/`MANUALLY_DISABLED` → store source → create app user → sign → persist metadata →
compile → `ONINSTALL` hook → if enabling, `runStartUpProcess` (init + enable) else `initializeApp`.

**Disable (`disable`)** (`AppManager.ts:485`): if enabled, `app.call(ONDISABLE)` →
`purgeAppConfig(app, {keepScheduledJobs, keepSlashcommands, keepOutboundProviders})` (cancels jobs,
unregisters commands/listeners/apis/components/providers, `purifyApp` accessors, clears buttons, then
re-locks essential events) → `setStatus(status)` → `validateLicense()`.

**Update (`update`)** (`AppManager.ts:716`): disable old (silent) → store new source → sign + persist
→ stop old runtime → compile new → create app user → if old was enabled re-run startup else
initialize → `ONUPDATE` hook.

**Remove (`remove`)** (`AppManager.ts:676`): `ONUNINSTALL` → `removeLocal` (disable, purge config,
remove app user, purge persistence, drop metadata + source, stop runtime, delete from map) →
`doAppRemoved`.

**License refresh** (`updateAppsMarketplaceInfo`): re-validate each loaded app; an app stuck in
`INVALID_LICENSE_DISABLED` that is now valid is flipped to plain `DISABLED` (so it can be re-enabled),
and a newly-invalid app is purged and set to `INVALID_LICENSE_DISABLED`.

---

## 4. Storage (`src/server/storage/`)

All storage classes are **abstract** — the engine defines the contract, the host implements the
MongoDB-backed concrete versions.

### 4.1 `IAppStorageItem` (`storage/IAppStorageItem.ts:8`) — the persisted record

```typescript
interface IAppStorageItem {
  _id?: string;
  id: string;                                  // app id from manifest
  createdAt?: Date; updatedAt?: Date;
  status: AppStatus;                           // ← persisted lifecycle state
  info: IAppInfo;                              // manifest snapshot
  installationSource: AppInstallationSource;   // 'marketplace' | 'private'
  sourcePath?: string;                         // where the package bytes live
  languageContent: { [k: string]: object };   // i18n
  settings: { [id: string]: ISetting };        // settings WITH current values
  implemented: { [int: string]: boolean };     // declared event interfaces
  marketplaceInfo?: IMarketplaceInfo[];        // license/subscription
  permissionsGranted?: Array<IPermission>;     // admin-consented permissions
  signature?: string;                          // JWT integrity signature
  migrated?: boolean;
}
```

Key point for the v2 discussion: **status, settings values, and granted permissions are all stored on
this single record.** There is no separate "desired state" document — `status` *is* both the desired
and the last-known state.

### 4.2 The three storage abstractions

- **`AppMetadataStorage`** (`storage/AppMetadataStorage.ts`) — the `IAppStorageItem` records.
  `create`, `retrieveOne`, `retrieveAll` (used by `load()`), `updateStatus`, `updateSetting`,
  `updatePartialAndReturnDocument`, `updateAppInfo`, `updateMarketplaceInfo`, `remove`.
- **`AppSourceStorage`** (`storage/AppSourceStorage.ts`) — the app package bytes (zip).
  `store → sourcePath`, `fetch → Buffer`, `update`, `remove`.
- **`AppLogStorage`** (`storage/AppLogStorage.ts`) — app log entries. `storeEntries`,
  `getEntriesFor`, `removeEntriesFor`, `findPaginated`.

> **v2 friction:** "logs split across DB and console." App logs go to `AppLogStorage` (DB) while
> engine/runtime errors land on the server console — the troubleshooting split the design doc flags.

---

## 5. Managers (`src/server/managers/`) and their relationship to state

Most managers maintain **two-tier registries**: "what the app *declares*" vs "what is *active right
now*". Enable moves declarations into the active set; disable removes them. This is how disabled apps
stop receiving events/commands/api calls without losing their definitions.

### 5.1 `AppListenerManager` — event dispatch (`managers/AppListenerManager.ts`)

The most state-sensitive manager. Fields:
- `listeners: Map<AppInterface, string[]>` (`:253`) — interface → app ids that handle it.
- `lockedEvents: Map<string, Set<string>>` (`:263`) — events blocked because a **disabled essential
  app** declared them essential.

Behavior:
- `registerListeners(app)` / `unregisterListeners(app)` (`:278`/`:290`) — called on enable/disable;
  only **enabled** apps appear in `listeners`.
- `lockEssentialEvents(app)` / `releaseEssentialEvents(app)` (`:315`/`:299`) — manage `lockedEvents`.
- `executeListener(int, data)` (`:348`) — first checks `isEventBlocked()` → throws
  `EssentialAppDisabledException` if an essential app for that event is disabled; otherwise dispatches
  to each registered app via `app.call(AppMethod.EXECUTE*)`.

So there are **two disabled-app behaviors**: ordinary disabled apps are simply absent from
`listeners` (event silently skips them); a disabled **essential** app *blocks the event entirely*.

> This essential-event locking is unique to v1 and has no analog in the v2 design doc yet — worth
> flagging in the discussion (it's the closest v1 has to "fail-closed").

### 5.2 Other managers (state-relevant notes)

- **`AppAccessorManager`** — caches accessor instances per app; `purifyApp(appId)` (`:93`) drops them
  all on disable/remove.
- **`AppSettingsManager`** — `updateAppSetting` runs `ON_PRE_SETTING_UPDATE` → persist →
  `doOnAppSettingsChange` bridge → `ONSETTINGUPDATED`.
- **`AppSchedulerManager`** — `wrapProcessor` (`:43`) gates job execution on live status: a job won't
  run if `isNotToRunJob(status, previousStatus)` — i.e. disabled apps' jobs are suppressed even if the
  scheduler fires.
- **`AppApiManager`** — `executeApi` (`:107`) returns 404 if the owning app isn't enabled.
- **`AppSlashCommandManager`** — arbitration maps (`touchedCommandsToApps`,
  `canCommandBeTouchedBy`) ensure only one app owns a given command.
- **`UIActionButtonManager`** / **`AppExternalComponentManager`** / **`AppVideoConfProviderManager`** /
  **`AppOutboundCommunicationProviderManager`** — all keep "declared" vs "active (enabled)" sets and
  filter to enabled apps when queried.
- **`AppLicenseManager`** — `validate` (`:24`) decrypts the marketplace JWT, checks app-id match,
  expiration, and seat count; populates a result object the manager turns into status.
- **`AppSignatureManager`** — `signApp`/`verifySignedApp` over a checksum of app fields.
- **`AppRuntimeManager`** — `startRuntimeForApp`/`stopRuntime`; selects Deno vs Node (see `03`).

---

## 6. Takeaways for the v2 discussion

- **State is triplicated** (subprocess ⟷ in-memory `storageItem` ⟷ DB), kept in sync manually via
  `setStatus`; `getStatus()` even round-trips to the subprocess (memoized 5 min). A v2 reconciler with
  an explicit *desired vs running* split would replace this ad-hoc synchronization.
- **One flat 12-value `AppStatus`** conflates desired state, origin, and error cause; the only
  "desired state" signal is `previousStatus` captured at load.
- **`AppManager` is a genuine god object** — container + lifecycle + 16 managers + storage + runtime +
  validation + user management. The design doc's "AppManager decomposition" maps directly onto the
  manager list in §2.1 plus storage/runtime/bridge boundaries.
- **Enable/disable is a manual fan-out** across ~8 managers (register/unregister listeners, apis,
  commands, components, providers, buttons, accessors, jobs). There's no single reconcile step; each
  call site re-implements the fan-out (`enableApp`, `disableApp`, `purgeAppConfig`).
- **Essential-event locking** is the only existing fail-closed mechanism and is event-scoped, not
  app-scoped — different from the v2 "fail-closed for the action + escalate to disable" proposal.
- **Storage is a single record per app** carrying status + settings + granted permissions; no separate
  desired-state document exists to build a reconciler on yet.
