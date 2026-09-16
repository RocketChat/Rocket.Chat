# Execution report: Apps service centralization

> Companion to [`apps-service-centralization.md`](./apps-service-centralization.md)
> (the plan) and [`../proposals/apps-service-centralization.md`](../proposals/apps-service-centralization.md)
> (the design). This records **what was actually done**, where reality diverged
> from the plan, and how it was verified.

- **Branch:** `chore/apps-service-centralized`
- **Status:** Complete — all four commits landed; build, typecheck, lint, and unit tests green.
- **Date:** 2026-06-24

## Commits (in order)

| # | SHA | Subject |
|---|-----|---------|
| 1 | `ff23cd542c` | `feat(apps): scaffold IAppsEngine facade and expand AppsEngineService` |
| 2 | `567063a9fa` | `refactor(apps): route external callers through the Apps facade` |
| 3 | `819dc01a3e` | `refactor(core-services): move the apps-engine query surface into @rocket.chat/apps` |
| 4 | `4f91b0c06a` | `refactor(apps): drop the deprecated Apps.self alias` |

### Commit 1 — facade scaffold + service expansion
- New `packages/apps/src/IAppsEngine.ts`: `isLoaded`/`isInitialized`, `triggerEvent`,
  the four ex-core-services query methods, and the `videoConfProviders` (7) /
  `outboundProviders` (2) namespaces. `AppStatusReport` lives here. Provider method
  signatures mirror the manager signatures exactly, so both the backing impl and the
  video-conf/outbound callers typecheck without casts.
- `orchestrator.ts`: `Apps` became a facade object delegating to an injected
  `IAppsEngine`. Added `registerAppsEngine()` and an internal `getOrchestrator()`
  accessor; kept `registerOrchestrator()`. `.self` retained as a deprecated alias
  (removed in commit 4).
- `AppsEngineService` now implements the full `IAppsEngine`, reading a direct
  orchestrator reference via a private `orch` getter (`getOrchestrator()`) instead of
  `Apps.self`. Injected as the facade backing in `server/services/startup.ts`.

### Commit 2 — external callers + escape hatches
- Mechanical codemod of the ~34 listed files (`Apps.self?.triggerEvent`/`isLoaded` →
  `Apps.triggerEvent`/`isLoaded`), preserving `result ?? original`, `void`, and
  `.catch` semantics.
- Escape hatches: video-conf → `Apps.videoConfProviders.*`, outbound →
  `Apps.outboundProviders.*`, auth logger → `SystemLogger`. Error strings preserved
  (`apps-engine-not-loaded`, `no-videoconf-provider-app` (= `availabilityErrors.NO_APP`),
  `apps-engine-not-configured-correctly`).

### Commit 3 — core-services extraction
- Deleted `packages/core-services/src/types/IAppsEngineService.ts`; removed the
  `Apps = proxify('apps-engine')` export, the `IAppsEngineService` type export, the
  `AppStatusReport` re-export, and the `@rocket.chat/apps` devDependency.
- Re-pointed all consumers + tests to `@rocket.chat/apps`.

### Commit 4 — cleanup
- Removed `.self` and the deprecated-alias type from the facade; migrated the settings
  bridge's lone `Apps.self?.getManager()` to its existing `this.orch`.

## Deviations from the plan (handoff caller lists were incomplete)

The plan's `triggerEvent`/`isLoaded` codemod list and its core-services consumer list
were not exhaustive. The facade type change surfaced the gaps as compile errors, each
handled as follows:

1. **Extra orchestrator-internal callers (used the old proxy's blanket delegation).**
   The pre-refactor `@rocket.chat/apps` `Apps` proxy delegated *every* orchestrator
   method, so some files called `Apps.getManager()` / `Apps.initialize()` /
   `Apps.getStorage()` directly (not via `.self`). These were not in the plan:
   - `app/statistics/server/lib/getAppsStatistics.ts` — a **runtime** consumer
     (metrics). Re-expressed using the serializable facade methods
     (`getAppsStatusLocal()` + `getApps({ installationSource })`). No interface growth.
   - `server/startup/migrations/v294.ts`, `v307.ts` — **one-time, node-local**
     migrations doing `signApp` + raw storage rewrites. These will never cross a
     service boundary (a future apps service migrates its own storage), so forcing
     them through the serializable facade is wrong. They use the internal
     `getOrchestrator()` accessor instead of `Apps.self`.
   - `ee/server/lib/apps/disableAppsWithAddonsCallback.ts` — already imported the
     orchestrator **instance** from the impl dir (`ee/server/apps`), not the facade,
     so it was unaffected and left untouched.

2. **Extra `AppStatusReport` importers** not in the plan's commit-3 list, all
   re-pointed to `@rocket.chat/apps`: `ee/server/sdk/types/IInstanceService.ts`,
   `ee/server/apps/communication/rest.ts`, `ee/lib/misc/formatAppInstanceForRest.ts`.

3. **Extra test that mocked the facade**, not listed in the plan:
   `app/api/server/lib/eraseTeam.spec.ts` (co-located, mocked `Apps.self`). Its three
   mocks were flattened from `Apps: { self: {...} }` to `Apps: {...}` to match the new
   facade shape. Folded into commit 2 (it is codemod fallout). The
   `service.tests.ts` mock was rewritten to stub `getOrchestrator()` instead of
   `Apps.self`.

4. **`triggerEvent` return type.** The proposal sketched `Promise<unknown>`, but real
   callers merge the result into typed payloads (`createRoom` does
   `delete eventResult._USERNAMES`; `mailer` does `Email.sendAsync(eventResult || email)`).
   `unknown` breaks them. Kept `...payload: unknown[]` but returns `Promise<any>` to
   match the orchestrator's passthrough contract and keep the codemod truly mechanical.

5. **Prettier reflow.** Dropping `Apps.self?` shortened one `createRoom.ts`
   `triggerEvent` call below the print width; prettier reflowed it to a single line
   (folded into commit 2).

### Note on `eslint --fix`

A broad `eslint --fix` over the touched files also "fixed" unrelated pre-existing
**warning**-level issues — it stripped *necessary* `as number` casts in
`FileUpload.ts` (which then broke `tsc`) and rewrote unrelated `x && x._id` →
`x?._id` in three livechat files. Those spurious edits were reverted; only the
import-ordering/merge and the legitimate codemod-induced reflow were kept.

## Verification

| Check | Command | Result |
|---|---|---|
| Build | `yarn turbo run build --filter=@rocket.chat/apps --filter=@rocket.chat/core-services` | ✅ pass |
| Typecheck | `tsc --noEmit --skipLibCheck` (meteor) | ✅ only 2 **pre-existing, unrelated** errors (`client/providers/MediaCallProvider.tsx`, `client/views/root/hooks/useDesktopUserRoles.ts`) — confirmed present on a clean baseline |
| Lint | `eslint` over all touched files | ✅ **0 errors** (warnings only, all pre-existing-style) |
| Unit tests | `mocha --config ./.mocharc.js` | ✅ 1941 passing, 0 failing |

Note: `meteor lint` could not run (no `meteor` binary in this environment); the `tsc`
portion of `typecheck` was run directly.

### Guard greps (all pass)

- No external `Apps.self` in code (the only match is an explanatory **comment** in
  `service.tests.ts`).
- `core-services/src` has no `proxify<IAppsEngineService>` / `IAppsEngineService`.
- `@rocket.chat/apps` has no runtime dep on `@rocket.chat/core-services`;
  `core-services` has no dep/devDep on `@rocket.chat/apps`.
- `IAppsEngine.ts` exposes no `getManager` / `getStorage` / `getRocketChatLogger`.

## Not exercised here

- The dedicated API/integration apps tests (`.mocharc.api.apps.js`, the
  `node-runtime` CI step) require a running Rocket.Chat instance + DB and were not run
  in this environment. The apps-engine unit tests (`service.tests.ts`) and
  `canEnableApp.spec.ts` — the unit coverage for the changed code — do pass.
