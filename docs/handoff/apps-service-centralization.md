# Handoff: Implement Apps service centralization

> **For the executing agent.** Design is approved — see
> [`docs/proposals/apps-service-centralization.md`](../proposals/apps-service-centralization.md)
> for rationale. This document is the step-by-step execution plan. Do **not**
> re-litigate the design; if something is genuinely blocked, surface it.

- **Repo / worktree:** `/work/RocketChat/rc-worktrees/node-runtime`
- **Branch:** `chore/apps-service-centralized` (already checked out)
- **Delivery:** single PR, **separate logical commits** (one per step below).

## Goal in one line

Replace every external entry point into Apps-Engine with a single injectable,
serializable facade `Apps` exported from `@rocket.chat/apps`, so apps execution can
later move to a microservice without touching consumers.

## Success criteria

1. No file outside `apps/meteor/app/apps/` and `apps/meteor/ee/server/apps/` imports
   anything apps-related except the `Apps` facade from `@rocket.chat/apps`.
2. `@rocket.chat/core-services` no longer exports `Apps` / `IAppsEngineService` /
   `AppStatusReport`, and no longer lists `@rocket.chat/apps` as a devDependency.
3. `@rocket.chat/apps` gains **no** runtime dependency on `@rocket.chat/core-services`.
4. The public facade exposes **no** `getManager` / `getStorage` / `getRocketChatLogger`.
5. Build, typecheck, lint, and apps tests pass (commands at the bottom).

---

## Commit 1 — Scaffold the facade + expand `AppsEngineService` (additive, no behavior change)

**In `packages/apps`:**

1. Define `IAppsEngine` (new file, e.g. `packages/apps/src/IAppsEngine.ts`) per the
   proposal. Move `AppStatusReport` here (it currently lives in
   `packages/core-services/src/types/IAppsEngineService.ts`).
2. Rework `packages/apps/src/orchestrator.ts`:
   - Keep `registerOrchestrator()` for the orchestrator reference.
   - Add a `registerAppsEngine(impl: IAppsEngine)` injection point.
   - Make the exported `Apps` delegate to the injected `IAppsEngine` impl, with the
     not-loaded guard folded in (`triggerEvent` → `undefined`; queries → `undefined`/empty).
   - **Temporarily** keep `.self` as a deprecated alias (removed in Commit 4).
3. Export `IAppsEngine` + `AppStatusReport` from `packages/apps/src/index.ts`.

**In `apps/meteor`:**

4. Expand `AppsEngineService` (`apps/meteor/server/services/apps-engine/service.ts`) to
   implement the **full** `IAppsEngine`:
   - Add `triggerEvent`, `isLoaded`.
   - Add `videoConfProviders.*` (7 methods) and `outboundProviders.*` (2 methods),
     delegating to the orchestrator's `getVideoConfProviderManager()` /
     `getOutboundCommunicationProviderManager()`.
   - Refactor it to use a **direct orchestrator reference** (set when the orchestrator
     registers) instead of the global `Apps.self`.
5. At startup, inject the `AppsEngineService` instance as the facade backing
   (`registerAppsEngine(...)`), alongside the existing `registerOrchestrator(...)` call
   in `apps/meteor/ee/server/apps/orchestrator.js` / startup.

*At the end of Commit 1 nothing else changes — `.self` still works, all callers untouched.*

---

## Commit 2 — Codemod external callers + rewrite the 3 escape hatches

### 2a. Mechanical codemod (`Apps.self?.X` → `Apps.X`)

These ~34 files use only `triggerEvent` / `isLoaded` and are a mechanical rewrite.
**Preserve** `result ?? original` fallbacks and `void Apps...` fire-and-forget calls.

```
apps/meteor/app/api/server/lib/eraseTeam.ts
apps/meteor/app/api/server/v1/commands.ts
apps/meteor/app/file-upload/server/lib/FileUpload.ts
apps/meteor/app/lib/server/functions/acceptRoomInvite.ts
apps/meteor/app/lib/server/functions/addUserToRoom.ts
apps/meteor/app/lib/server/functions/createDirectRoom.ts
apps/meteor/app/lib/server/functions/createRoom.ts
apps/meteor/app/lib/server/functions/deleteMessage.ts
apps/meteor/app/lib/server/functions/deleteUser.ts
apps/meteor/app/lib/server/functions/removeUserFromRoom.ts
apps/meteor/app/lib/server/functions/saveUser/saveUser.ts
apps/meteor/app/lib/server/functions/sendMessage.ts
apps/meteor/app/lib/server/functions/updateMessage.ts
apps/meteor/app/lib/server/methods/deleteUserOwnAccount.ts
apps/meteor/app/livechat/server/lib/closeRoom.ts
apps/meteor/app/livechat/server/lib/departmentsLib.ts
apps/meteor/app/livechat/server/lib/guests.ts
apps/meteor/app/livechat/server/lib/Helper.ts
apps/meteor/app/livechat/server/lib/QueueManager.ts
apps/meteor/app/livechat/server/lib/rooms.ts
apps/meteor/app/livechat/server/lib/RoutingManager.ts
apps/meteor/app/mailer/server/api.ts
apps/meteor/app/message-pin/server/pinMessage.ts
apps/meteor/app/message-star/server/starMessage.ts
apps/meteor/app/reactions/server/setReaction.ts
apps/meteor/app/statistics/server/lib/getAppsStatistics.ts
apps/meteor/app/threads/server/methods/followMessage.ts
apps/meteor/app/threads/server/methods/unfollowMessage.ts
apps/meteor/server/lib/eraseRoom.ts
apps/meteor/server/lib/moderation/reportMessage.ts
apps/meteor/server/methods/logoutCleanUp.ts
apps/meteor/server/methods/removeUserFromRoom.ts
apps/meteor/server/methods/saveUserProfile.ts
apps/meteor/server/services/messages/service.ts
```

Since the facade is always defined, `Apps.self?.triggerEvent(e, x)` → `await Apps.triggerEvent(e, x)`
(drop the `?.`). The facade returns `undefined` when not loaded, so existing fallbacks
keep working. Verify each `await` / `void` site individually — do not blind-replace.

### 2b. Escape-hatch rewrites (manual, behavior-preserving)

- **`apps/meteor/server/services/video-conference/service.ts`** — replace
  `getProviderManager()` (lines ~900–911) and its 7 call sites with
  `Apps.videoConfProviders.*`: `isFullyConfigured` (line ~580), `getVideoConferenceInfo`
  (~201), `generateUrl` (~935), `customizeUrl` (~1011), `onNewVideoConference` (~1029),
  `onVideoConferenceChanged` (~1047), `onUserJoin` (~1065). Keep error strings
  `apps-engine-not-loaded`, `NO_APP`, `NOT_CONFIGURED`.
- **`apps/meteor/ee/app/livechat-enterprise/server/api/lib/outbound.ts`** — replace
  `getProviderManager()` with `Apps.outboundProviders.getProviderMetadata` (line ~43)
  and `sendOutboundMessage` (line ~65). Keep `apps-engine-not-loaded` /
  `apps-engine-not-configured-correctly`.
- **`apps/meteor/app/authentication/server/startup/index.js`** — replace the single
  `Apps.self?.getRocketChatLogger().error(...)` (line ~403) with the file's own
  `SystemLogger` (or a local logger). Do **not** add a logger method to the facade.

---

## Commit 3 — Move the core-services query proxy into apps

1. Move `IAppsEngineService`'s method set into `IAppsEngine` (already done in Commit 1)
   and delete `packages/core-services/src/types/IAppsEngineService.ts`.
2. In `packages/core-services/src/index.ts`: remove
   `export const Apps = proxify<IAppsEngineService>('apps-engine');`, the
   `IAppsEngineService` import, and the `AppStatusReport` re-export.
3. Remove `@rocket.chat/apps` from `packages/core-services/package.json` devDependencies
   (confirm no remaining references first).
4. Re-point these consumers from `@rocket.chat/core-services` to `@rocket.chat/apps`
   (method names unchanged; calls were already `await Apps.getApps(...)`):
   ```
   apps/meteor/ee/app/license/server/canEnableApp.ts
   apps/meteor/ee/app/license/server/lib/getAppCount.ts
   apps/meteor/ee/lib/misc/fetchAppsStatusFromCluster.ts
   apps/meteor/ee/server/local-services/instance/service.ts
   apps/meteor/tests/unit/app/license/server/canEnableApp.spec.ts   (type import)
   apps/meteor/tests/unit/server/services/apps-engine/service.tests.ts (type import)
   ```
   **Before doing so**, check none of these (or any file) imports `Apps` from *both*
   `@rocket.chat/core-services` and `@rocket.chat/apps` — if so, merge the import.

---

## Commit 4 — Cleanup

1. Remove `.self` and the deprecated alias from `packages/apps/src/orchestrator.ts`.
2. Grep the repo to confirm zero remaining `Apps.self` references outside the
   implementation dirs (and ideally inside too, if the bridges were migrated to a direct
   ref — but bridges are out of scope, so leave their internal `this.orch` usage alone).

---

## Verification

```bash
cd /work/RocketChat/rc-worktrees/node-runtime

# build the touched packages
yarn turbo run build --filter=@rocket.chat/apps --filter=@rocket.chat/core-services

# typecheck meteor
yarn workspace @rocket.chat/meteor run typecheck

# lint touched areas
yarn workspace @rocket.chat/meteor run lint

# apps tests (dedicated config + node-runtime CI step added on this branch)
yarn workspace @rocket.chat/meteor run testunit -- --config .mocharc.api.apps.js   # adjust as needed
```

### Guard greps (should return nothing outside impl dirs)

```bash
# no external .self usage
grep -rE "Apps\.self" apps/meteor --include='*.ts' --include='*.js' \
  | grep -vE "(apps/meteor/app/apps/|apps/meteor/ee/server/apps/)" | grep -v node_modules

# core-services no longer exports Apps
grep -nE "proxify<IAppsEngineService>|IAppsEngineService" packages/core-services/src

# apps must NOT depend on core-services at runtime
node -e "const p=require('./packages/apps/package.json'); console.log(p.dependencies['@rocket.chat/core-services']||'OK: no dep')"

# no public live-object escapes on the facade
grep -nE "getManager|getStorage|getRocketChatLogger" packages/apps/src/IAppsEngine.ts
```

## Gotchas

- `AppsEngineService` appears in the caller list but **is** the facade backing — do not
  codemod it like an external caller; refactor it to a direct orchestrator ref (Commit 1).
- `getAppsStatusInNodes` does cluster fan-out via the broker — keep that logic in
  `AppsEngineService`, not the orchestrator.
- The leaf rule (D4) is load-bearing: never `import ... from '@rocket.chat/core-services'`
  inside `packages/apps/src`. The `proxify` wiring stays host-side.
- Preserve `Meteor.Error('error-essential-app-disabled')` propagation — it is thrown by
  the injected orchestrator, not the facade.
- Bridges/converters internal `this.orch.getManager()` calls are **out of scope** — leave
  them untouched.
