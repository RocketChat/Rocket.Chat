# Proposal: a runtime-orchestrator boundary for the apps service

- **Status:** Alternative under evaluation
- **Date:** 2026-08-14
- **Relation:** alternative to §5 of
  [`docs/proposals/apps-microservice-epic.md`](./apps-microservice-epic.md). That document owns the
  goal, the deployment-mode analysis (§3), the blocker list B1–B20 and the subtask table. This
  document only states where the boundary moves and what changes as a result. Read the epic first.
- **Shared dependency:** ADR 0002 (`docs/adr/0002-apps-subprocess-protocol.md`, branch
  `claude/runtime-sdk-ipc-protocol-kpae6r`). Both boundaries need its PR 0.

## 1. The proposal

The epic puts the process boundary **between the bridges and the AppManager** (epic §5). This
document puts it **below the AppManager, around the app subprocesses**.

A new service owns one job: it starts a subprocess for each app, it keeps that subprocess alive, and
it relays messages in both directions. It holds no AppManager, no bridges, no converters, no
storage and no models.

In package terms, `packages/apps/src/server/runtime/` plus `base-runtime/`, `node-runtime/` and
`deno-runtime/` move to a new `packages/apps-runtime`. Everything else stays in
`packages/apps`. The package boundary and the process boundary are the same line.

## 2. The seam already exists in the code

This is the argument for the boundary. The interface is declared, narrow and already injectable.

| Fact | Evidence |
|---|---|
| The inbound contract is **5 methods**: `setupApp`, `sendRequest`, `stopApp`, `getStatus`, `getAppId` | `packages/apps/src/server/runtime/IRuntimeController.ts` |
| Every monolith→app path funnels into `sendRequest`. Nothing else reaches an app | `ProxiedApp.call` maps every `AppMethod` to `app:<method>` — `ProxiedApp.ts:64-86` |
| The transport is **already a constructor parameter**. `AppRuntimeManager` takes `runtimeFactory` and selects it from `APPS_ENGINE_RUNTIME_BACKEND` | `managers/AppRuntimeManager.ts:25-37` |
| The controller pulls exactly **four** things from the AppManager | `BaseRuntimeSubprocessController.ts:114` (`getTempFilePath`), `:127` (`getLogStorage`), `:128` (`getBridges`), `:131` (`getAppResourceBridge`) |
| Only **one** event crosses back into the AppManager side | `ProxiedApp.ts:30` — `processExit`, which clears the memoised `getStatus` |
| The AppManager touches the runtime at **6 call sites** | `AppCompiler.ts:24` (`startRuntimeForApp`); `AppManager.ts:618,716,771,825` (`stopRuntime`); `ProxiedApp.ts:30` |

So the inbound half is a third factory. `remoteRuntimeFactory` returns an `IRuntimeController` that
proxies over the broker. `AppManager`, `ProxiedApp` and `AppCompiler` do not change.

The outbound half is the epic's relay, unchanged in shape: `apps-host.invokeBridge({ appId, method,
params })`, with the monolith-side responder that runs AJV and the ADR 0002 invoker table.

## 3. Topology

```
apps/meteor (monolith)                       apps-runtime service
├─ AppManager, all managers, compiler        ├─ AppRuntimeManager
├─ storage (GridFS, logs, metadata)          ├─ BaseRuntimeSubprocessController per app
├─ 28 bridges + AppResourceBridge            ├─ LivenessManager per app
├─ converters, marketplace, REST, UIKit      └─ 1 subprocess per app (node|deno), msgpack pipe
├─ apps-host.invokeBridge responder      ←──────┘  relay
└─ remoteRuntimeFactory  ──────────────────────→  apps-runtime.{setup,send,stop,getStatus}
```

## 4. The property that makes it attractive

**Neither new leg is a new serialization surface.**

Epic §3 records that the inbound direction passes live objects today, and that B12, B16 and subtask
13 exist to close that gap. This boundary sits **after** `ProxiedApp.call`, at a point where the
payload already crosses msgpack on its way into the subprocess. Both new legs land on ground that is
already serialization-disciplined.

It goes further. The service never has to read an inbound payload — it routes by `appId` alone. So
the inbound leg can forward the msgpack frame **as opaque bytes** straight into the pipe. The epic's
§5 relay states it cannot be a byte pipe, because it must decode the frame to read `method`. Here
only the outbound direction needs a classify step (`bridges:*` request, versus result, versus a
`ready`/`pong`/`uncaughtException` notification), and even there `params` and `result` can stay
opaque if the monolith responder extracts the log entries.

Consequence: subtask 13 shrinks from "pin 48 event types" to a delta check against what msgpack
already does.

## 5. What this boundary removes from the epic

The AppManager stays next to its callers, so the following stop being boundary work.

| Epic item | Why it dissolves |
|---|---|
| B4, B5, B8 | WebApp mounts, UIKit and the `slashCommands.commands` registry stay in-process with the managers they mutate |
| B9 | The settings bridge keeps its direct `Settings` model access |
| B13 | `canEnableApp` and the `License.onModule` hooks stay in-process |
| B15 | Converters stay next to `Messages`, `Rooms` and `Users`. No cross-wire fan-out |
| Subtasks 4–9 | No inbound facade to build. The inbound contract is `IRuntimeController` |
| Subtasks 15, 16, 17, 18, 19 | Storage, scheduler, orchestrator, marketplace and converters do not move |
| Subtasks 26, 27 | No settings client and no license client. B20's `EnterpriseCheck` question still applies to the new service |
| Subtask 45 | Nothing to promote — see §7 |

Phase 1 and Phase 3 of the epic exist because the AppManager moves. They become optional cleanup
rather than prerequisites.

## 6. New blockers this boundary creates

These are specific to this design. They do not appear in the epic's B1–B20.

| # | Blocker | Location |
|---|---|---|
| R1 | **Routing and affinity.** `IRuntimeController` is a stateful handle. Over a broker it becomes `appId` plus a placement registry, and `LocalBroker.call` discards `CallingOptions`, so `nodeID` targeting is unavailable in monolith mode (epic B19). N monolith replicas each want their own runtime, so the cluster holds N×M subprocesses over K service replicas, with N×M affinity entries and a failover path when a replica dies | `packages/core-services/src/LocalBroker.ts:31-34`; `AppRuntimeManager.subprocesses` |
| R2 | **The `storageItem` snapshot goes stale.** `restartApp` replays `app:setStatus` and `app:onEnable` from `this.storageItem`, which is the AppManager's live object today and a pushed copy after the split. A settings change in the monolith does not reach it | `BaseRuntimeSubprocessController.ts:110,268-272`; restart path at `LivenessManager.ts:246` |
| R3 | **Error codes die on the inbound leg.** `ProxiedApp.call` branches on `e.code` for `AppsEngineException.JSONRPC_ERROR_CODE`, for `JSONRPC_METHOD_NOT_FOUND` and for the `-32000…-32999` range. `CustomRegenerator` whitelists only `Meteor.Error`, so every app error collapses to a plain moleculer error. This is B11 extended to a leg the epic keeps local | `ProxiedApp.ts:69-84`; `network-broker/src/index.ts:36-62` |
| R4 | **EJSON defeats the msgpack extension codec.** `BUFFER_HANDLER_EXT` restores a real `Buffer` for the subprocess. An EJSON hop upstream converts the `Buffer` to a `Uint8Array` first, so `object instanceof Buffer` is false and the extension never fires. `FUNCTION_DISABLER_EXT` has no EJSON equivalent either. A byte pipe, or `SERIALIZER=MsgPack` with the same `ExtensionCodec`, avoids this; the EJSON default does not | `runtime/base/codec.ts:7-33`; epic §3 |
| R5 | **All 152 bridge methods cross, not 137.** `AppResourceBridge` fronts the AppManager registries, which are now remote, so the local branch in `handleBridgeMessage` disappears. The 15 extra methods are startup-time registrations, so the added cost is small. The `state === 'restarting'` suppression of `REGISTRATION_METHODS` stays service-side and still works | `BaseRuntimeSubprocessController.ts:412-426`; `bridges/AppResourceBridge.ts:46` |
| R6 | **Log writes need an owner.** `handleResultMessage` writes `logStorage.storeEntries` on every request that returns logs. Either the service takes its own Mongo connection for the apps-owned log collection, or the monolith responder extracts the logs from the forwarded result frame. The second choice keeps the service stateless and keeps the byte pipe | `BaseRuntimeSubprocessController.ts:497-519` |
| R7 | **Contradictory timeout ordering.** The inbound broker call must outlast `getRuntimeTimeout()`, because it waits on the subprocess. The outbound relay call must expire before it, so a bridge write does not outlive the caller. One global `REQUEST_TIMEOUT` cannot satisfy both, and `LocalBroker` discards per-call options (R1) | `BaseRuntimeSubprocessController.ts:29-41`; `LocalBroker.ts:31-34` |

## 7. Cost comparison

Both boundaries cost **two hops** per accessor call and two per event. They tie on the floor.

The epic's boundary wins the ceiling. It can promote the 48 read-shaped bridge methods into the
service, where `registerServiceModels` and the converters resolve them locally (epic subtask 45),
which removes both hops for those methods. This boundary has no local state to resolve against, so
two hops is permanent. Duplicating models and converters into the runtime service would fix it and
would also end the "thin orchestrator" premise.

## 8. It composes with the epic's boundary

This move is a strict prefix. If the AppManager later crosses the same broker, the runtime seam
survives as a package boundary and its transport collapses back to in-process —
`remoteRuntimeFactory` becomes `nodeRuntimeFactory` again. Nothing is discarded.

Two conditions preserve that property:

1. Express the seam as `IRuntimeController` plus an injected outbound sender. Do not let the remote
   transport leak into `AppManager` or `ProxiedApp`.
2. Move the shared constants and the bridge-name union into `packages/apps/protocol/` (ADR 0002
   PR 0). `ProxiedApp` imports `JSONRPC_METHOD_NOT_FOUND` from the controller today, which is a
   dependency in the wrong direction once the packages split.

## 9. Subtask deltas against the epic

Reuse without change: **10, 11, 21, 24, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43,
44**. Subtask 22 stays but carries all 152 methods (R5).

Drop or defer: **4, 5, 6, 7, 8, 9, 15, 16, 17, 18, 19, 25, 26, 27, 45**. The blockers behind them
(B1, B4, B5, B8, B9, B13, B15) remain in the codebase as coupling. They stop being release-blocking.

New work: **R1–R7**, plus the package extraction and the app-package distribution path — the service
needs `IParseAppPackageResult.files` at `setupApp`, and again at every restart.

## 10. The question that decides it

**R1.** Which process owns a given app's subprocess, and how does a call reach it?

Three answers, and the choice is not a refactor:

- **Sidecar** — pin each monolith replica to one runtime replica. Simplest, and apps scale with
  monolith replicas again, which is the outcome the epic's §1 exists to prevent.
- **Placement registry** — nodeID-targeted calls plus failover. Needs `LocalBroker` to gain
  `nodeID` targeting, which is epic subtask 43 promoted from optional to blocking.
- **One subprocess per app cluster-wide** — M subprocesses instead of N×M, and the better end
  state. It changes app lifecycle from per-node to cluster-global, and bridge callbacks then land on
  an arbitrary monolith replica. The node-local registries (B4, B8) already sync over broker events,
  so this may hold, but it needs its own analysis.

The epic's boundary has an easier version of this question, because the AppManager travels with the
runtime and one service replica owns both for its set of apps.

## 11. Recommendation

Choose by driver, not by cost.

- If the driver is epic §1 as written — decouple apps scaling from monolith scaling — this boundary
  reaches it directly and skips Phases 1 and 3.
- If the driver is ownership, so the apps stack becomes an independently releasable artifact, this
  boundary does not serve it. The monolith still loads the AppManager, the 28 bridges, the compiler,
  esbuild and the marketplace client.

There is a third argument for it. This boundary is the natural trust boundary: ADR 0002 decision 13
already treats the subprocess as untrusted, and here the process line sits immediately around the
untrusted code. An app that escapes its subprocess lands in a service that holds pipes and one
broker credential. Under the epic's boundary it lands in a service that holds the AppManager, the
storage credentials and a Mongo connection.

Settle R1 before anything else. It is the only item that can invalidate the design.
