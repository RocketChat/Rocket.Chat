# Proposal: Centralize Apps interaction behind a single facade in `@rocket.chat/apps`

- **Status:** Approved design (pending implementation)
- **Branch:** `chore/apps-service-centralized`
- **Author:** Douglas Gubert
- **Date:** 2026-06-23

## Motivation

Apps-Engine functionality is reached from `apps/meteor` through **two different
entry points** plus assorted deep imports:

1. `@rocket.chat/apps` → `Apps` — the in-process **orchestrator proxy** with a
   `.self` accessor, used as `Apps.self?.triggerEvent(...)` (~38 external files).
2. `@rocket.chat/core-services` → `Apps` — a `proxify<IAppsEngineService>('apps-engine')`
   **RPC proxy** with 5 query methods (4 source consumers + 2 tests).

Several callers also reach *through* the orchestrator into live objects
(`getManager()`, `getStorage()`, `getRocketChatLogger()`), which cannot cross a
process boundary.

To allow apps **execution** to later move into its own microservice, all external
access must funnel through a single, **serializable, injectable** interface. Once
that boundary exists, swapping the in-process implementation for an RPC client is a
one-line change that no consumer ever sees.

## Current state (as of this branch)

- `packages/apps/src/orchestrator.ts` already exports `Apps` as a `Proxy` over an
  injected `IAppServerOrchestrator`, registered via `registerOrchestrator()`. The
  package is a **leaf** (depends on `apps-engine`, `core-typings`, `model-typings`,
  `ui-kit`; **not** on `core-services`).
- The orchestrator lives in `apps/meteor/ee/server/apps/orchestrator.js`; bridges in
  `apps/meteor/app/apps/server/bridges/*`; converters in `.../converters/*`. All are
  deeply coupled to Meteor + `@rocket.chat/models` and **cannot** move into a leaf
  package now.
- `apps/meteor/server/services/apps-engine/service.ts` (`AppsEngineService`,
  registered on the broker as `apps-engine`) already implements the 5 query methods by
  reaching into `Apps.self?.getManager()` / `getStorage()`.
- `core-services` has `@rocket.chat/apps` only as a **devDependency** (type-only); no
  runtime import. `core-services` runtime deps do **not** include apps, so
  `apps → core-services` would be acyclic — but is intentionally avoided (see D4).

### Method surface used by external callers

| Method | External call sites | Disposition |
|---|---|---|
| `triggerEvent` | 59 calls | Core facade method |
| `isLoaded` / `isInitialized` | 11 / 2 | Core facade methods |
| `getManager()` → video-conf provider manager | `video-conference/service.ts` | → `videoConfProviders.*` (7 methods) |
| `getManager()` → outbound provider manager | `ee/.../outbound.ts` | → `outboundProviders.*` (2 methods) |
| `getRocketChatLogger()` | `authentication/server/startup/index.js` | → local `SystemLogger` |
| `getManager()/getStorage()` (everything else) | `apps-engine/service.ts` only | Internal to the facade backing |

## Design decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **Facade/interface boundary**, not physical relocation. | Orchestrator/bridges/converters depend on Meteor + `models`; they cannot live in a leaf package. The facade is what consumers see; implementation stays injected and moves to the microservice later. |
| D2 | **Scope = external callers only.** | Bridges/converters/orchestrator *are* the implementation behind the facade. Success metric: nothing outside `apps/meteor/app/apps/` + `apps/meteor/ee/server/apps/` imports apps internals directly. |
| D3 | **Strictly serializable/async contract.** No `getManager`/`getStorage`/`getRocketChatLogger` on the public surface. | These return live objects that cannot cross a process boundary — exactly the leak that blocks isolation. The 3 escapes become explicit, serializable methods. |
| D4 | **Injection seam; `@rocket.chat/apps` stays a leaf** (no runtime dep on `core-services`). | Reuses the existing `registerOrchestrator()` pattern. Avoids bloating a heavy, widely-imported, client-touched package with `core-services → models`. The `proxify('apps-engine')` wiring becomes host-side injection. |
| D5 | **Replace the `Apps` export** (keep the name) with the unified facade; remove `.self`; fold the not-loaded guard inside. | Minimizes import churn (only call expressions change). `triggerEvent` already returns `undefined` when not loaded; callers rely on `result ?? original`, so passthrough semantics are preserved inside the facade. |
| D6 | **Move nothing from `core-typings`.** | The marketplace types (`App`, `AppCategory`, `AppScreenshot`, …) are REST/UI data shapes consumed by `rest-typings` + ~33 client files. Moving them into the heavy execution package would invert dependency weight. They are not part of the execution boundary. |
| D7 | **`core-services` extraction = apps-engine facade only.** | Move `IAppsEngineService` + `AppStatusReport` into apps; delete the `Apps` proxy + apps devDep. Leave `UiKitCoreApp` (next candidate) and the `apps.*` `EventSignatures` (shared broker vocabulary) in place. |
| D8 | **One contract `IAppsEngine`**, implemented by both the facade backing and `AppsEngineService`. | The contract, the in-process impl, and the future RPC impl are the same interface. Direct in-process calls today (no broker overhead on the 59 `triggerEvent`s); future microservice swap = replace the injected impl with an `api.call`-backed proxy of the identical interface. |
| D9 | **Single PR, separate logical commits.** | Keeps the change atomic and consistent while keeping history reviewable. |

## The `IAppsEngine` interface (in `@rocket.chat/apps`)

```ts
interface IAppsEngine {
  // lifecycle / status
  isLoaded(): boolean;
  isInitialized(): boolean;

  // hook dispatch — returns undefined when not loaded (passthrough preserved)
  triggerEvent(event: AppEvents, ...payload: unknown[]): Promise<unknown>;

  // ex-core-services query surface (was IAppsEngineService)
  getApps(query: IGetAppsFilter): Promise<IAppInfo[] | undefined>;
  getAppStorageItemById(appId: string): Promise<IAppStorageItem | undefined>;
  getAppsStatusLocal(): Promise<{ appId: string; status: AppStatus }[]>;
  getAppsStatusInNodes(): Promise<AppStatusReport>;

  // serializable replacements for the live-object escapes (D3)
  videoConfProviders: {
    isFullyConfigured(providerName: string): Promise<boolean>;
    getVideoConferenceInfo(providerName: string, call: ..., user?: ...): Promise<...>;
    generateUrl(providerName: string, callData: ...): Promise<string>;
    customizeUrl(providerName: string, callData: ..., userData: ..., options: ...): Promise<string>;
    onNewVideoConference(providerName: string, call: ...): Promise<void>;
    onVideoConferenceChanged(providerName: string, call: ...): Promise<void>;
    onUserJoin(providerName: string, call: ..., user?: ...): Promise<void>;
  };
  outboundProviders: {
    getProviderMetadata(appId: string, type: string): Promise<...>;
    sendOutboundMessage(appId: string, type: string, message: IOutboundMessage): Promise<...>;
  };
}
```

> Sub-namespaces (`videoConfProviders` / `outboundProviders`) keep the root cohesive
> rather than flattening 9 provider methods onto it (agreed in grilling).
> The `AppStatusReport` type moves here from `core-services`.

## Implementation shape

- `Apps` (exported from `@rocket.chat/apps`) becomes a `Proxy`/object delegating to an
  injected `IAppsEngine` implementation. The not-loaded guard lives in the facade:
  `triggerEvent` returns `undefined`, queries return `undefined`/empty.
- `AppsEngineService` (meteor) implements the **full** `IAppsEngine` (expanded with
  `triggerEvent` + the two provider namespaces), reading a **direct orchestrator
  reference** instead of the global `Apps.self`. Its instance is injected as the facade
  backing at startup. It remains registered on the broker as `apps-engine`, so the RPC
  contract for a future microservice is available for free.
- `Meteor.Error('error-essential-app-disabled')` is thrown by the injected orchestrator
  (meteor side); the leaf facade stays Meteor-free.

## Out of scope / future work

- **`UiKitCoreApp`** (`uikit-core-app` service): the immediate next candidate to move
  the same way (5 core-apps module consumers + EE communication).
- **Marketplace type domain**: if centralization is later desired, a new
  zero-runtime-dep `@rocket.chat/apps-typings` package or a types-only subpath — never
  folded into the heavy execution package.
- **Physical relocation** of orchestrator/bridges/converters (requires severing Meteor
  + `models` coupling first).
- **Routing `triggerEvent` through the broker** in monolith mode (kept as a direct
  injected call for now to avoid hot-path overhead).

## Risks

- Hot-path code (`sendMessage`, `createRoom`, file upload) — the `triggerEvent` codemod
  must preserve `result ?? original` fallbacks and fire-and-forget (`void`) semantics.
- The provider-manager rewrites (video-conf, outbound) change indirection but must keep
  the existing error strings (`apps-engine-not-loaded`, `NO_APP`, `NOT_CONFIGURED`,
  `apps-engine-not-configured-correctly`).
- Ensure no file imports both `Apps` symbols simultaneously before the core-services
  deletion.
