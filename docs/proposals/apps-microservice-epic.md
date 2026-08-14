# Epic: Isolate Apps-Engine execution into a microservice

- **Status:** Scoping / backlog seed
- **Date:** 2026-08-13
- **Revised:** 2026-08-14 — deployment-mode review (§3, B11 narrowed, B16–B20, subtasks 41–44)
- **Revised:** 2026-08-14 — reverse channel restated as a relay (§5 rewritten, §6 rows 2/13/17+19
  and the ordering constraint corrected, subtask 20 dropped, 22 rescoped, 45 added)
- **Related:** [`docs/apps-engine-migration.md`](../apps-engine-migration.md) (phase overview),
  [`docs/adr/0001-app-accessor-logic-in-base-runtime.md`](../adr/0001-app-accessor-logic-in-base-runtime.md),
  ADR 0002 (`docs/adr/0002-apps-subprocess-protocol.md`, on branch
  `claude/runtime-sdk-ipc-protocol-kpae6r`),
  [`docs/proposals/apps-converters-zod/README.md`](./apps-converters-zod/README.md),
  branch `chore/apps-service-centralized` (facade design + handoff + execution report)

## 1. Goal

Move apps execution out of the Meteor monolith into its own service, so apps scaling is
decoupled from monolith scaling. Everything the monolith and the apps stack say to each
other must become a **serializable message over the service broker**.

Prerequisite for that: as much apps code as possible lives in `@rocket.chat/apps`, and the
remaining host coupling is expressed as **two explicit RPC contracts** rather than direct
in-process calls.

## 2. Where we are today

### Already landed on `develop`

| Done | Evidence |
|---|---|
| `@rocket.chat/apps-engine` narrowed to a definition-only public package | `files: ["definition/**"]`; `src/` contains only `definition/` |
| `@rocket.chat/apps` owns AppManager, managers, compiler, storage interfaces, runtimes | `packages/apps/src/server/**`, `base-runtime/`, `node-runtime/`, `deno-runtime/` |
| Accessor logic consolidated into the base-runtime; **one** app→host RPC category | ADR 0001; `BaseRuntimeSubprocessController.handleBridgeMessage`, `bridges:<Bridge>:<method>` |
| Node runtime is the default backend (deno still selectable) | `AppRuntimeManager`, `APPS_ENGINE_RUNTIME_BACKEND = 'node'` |
| Converters being migrated to zod codecs | phases 0–5 landed (PR #41205) |
| **`apps-engine` is already a broker service that runs in both deployment modes** | `AppsEngineService extends ServiceClassInternal`, `name = 'apps-engine'`, registered on every monolith node (`server/services/apps-engine/service.ts:20-21`, `server/services/startup.ts:39`); 5 query methods + 6 broker event handlers; node-addressed fan-out in `getAppsStatusInNodes` (`:201`) |
| **Apps cluster sync already runs on broker events** | `api.broadcast('apps.added'\|'apps.removed'\|'apps.updated'\|'apps.statusUpdate'\|'apps.settingUpdated'\|'command.*'\|'actions.changed')` from `communication/websockets.ts:158-213`, declared in `EventSignatures` (`core-services/src/events/Events.ts:297-301`), consumed by `AppsEngineService` (sync the local AppManager) and by `listeners.module.ts:473-505` (fan out to the `streamApps` client streamer) |

### In flight, **not merged**

- **`chore/apps-service-centralized`** — the `IAppsEngine` facade, the `Apps.self?.x` → `Apps.x`
  codemod, and the removal of the `core-services` `Apps` proxy. `develop` still has **108
  `Apps.self` references across 42 files**. See subtask 1: the proxy is the existing
  mode-transparent call path and should be absorbed, not deleted.
- **`claude/runtime-sdk-ipc-protocol-kpae6r`** — ADR 0002 (accepted, **not implemented**) plus an
  eight-PR delivery plan to extract the host↔subprocess protocol into `packages/apps/protocol/`.
  Docs only today. It is the largest de-risking of this epic currently in flight — see §6.

### Current topology

```
apps/meteor (monolith)
├─ 69 triggerEvent call sites in 36 files, 48 distinct AppEvents
├─ @rocket.chat/apps  → `Apps` Proxy (in-process, leaks live objects: .self, getManager, getStorage, getRocketChatLogger)
├─ @rocket.chat/core-services → `Apps` = proxify('apps-engine')  (5 query methods; dispatched by
│     whichever broker is installed — in monolith mode this *is* an in-process call, see §3)
└─ ee/server/apps/orchestrator.ts  AppServerOrchestrator (448 LOC, Meteor + @rocket.chat/models + settings)
   ├─ storage/           5 classes (GridFS via meteor/mongo MongoInternals)
   ├─ communication/     rest.ts 1314 LOC / 26 routes + 6 handler modules · uikit.ts 359 · websockets.ts 214
   ├─ marketplace/       MarketplaceAPIClient, fetch*, appInstall, appRequestsCron
   ├─ app/apps/server/converters/   11 converters, read Messages/Rooms/Users from Mongo
   └─ app/apps/server/bridges/      28 bridges, ~3.6k LOC, 48 distinct monolith function imports
      └─ AppManager → AppRuntimeManager → 1 subprocess per app (node|deno), msgpack over a pipe
```

### The two directions that must cross the boundary

**Inbound — monolith → apps.** `triggerEvent` (69 sites), app-management REST (26 routes),
UIKit interaction, slash-command execution + previews, app-provided HTTP endpoints
(`/api/apps/public|private/:appId`), video-conf providers (7 methods), outbound providers
(2), external components / action buttons, status & statistics queries.

**Outbound — apps → monolith.** **152 `do*` declarations** (127 unique names) across 27 bridge
classes, reachable through the 28 `AppBridges` getters **plus `AppResourceBridge`** — an
engine-owned bridge that fronts the AppManager registries and carries 15 of the 152. Good news:
ADR 0001 already funnels every one of them through a *single* dispatcher
(`handleBridgeMessage`, `bridges:<Bridge>:<method>`), so the reverse channel is one generic
RPC, not 152 endpoints. Only 137 of them ever leave the apps service — see §5.

## 3. Deployment modes: one service, two brokers

The service broker is **local in monolith mode and network in microservices mode**, and the
choice is made once at bootstrap by which broker gets installed into the `api` singleton. Every
`core-services` service already lives with this, `apps-engine` included. This section is the
frame for the rest of the epic: several subtasks below were written as if the split introduced a
mode distinction that the codebase has had all along.

| | monolith | microservices |
|---|---|---|
| Broker | `new LocalBroker()` — `server/startup/localServices.ts:5-11` | moleculer `startBroker()` — `ee/server/startup/index.ts:15-21`, gated on `isRunningMs()` (`TRANSPORTER` matches `^(nats\|TCP)`) |
| Registration | `registerServices()` registers everything; the `!isRunningMs()` block adds the services that otherwise run standalone — `server/services/startup.ts:39,68-81` | each standalone process registers its own service — e.g. `ee/apps/authorization-service/src/service.ts` |
| `call()` | `this.methods.get(method)?.(...data)` — a direct function call: **arguments by reference, no serialization** (`LocalBroker.ts:32-53`) | EJSON over NATS/TCP (`network-broker/src/index.ts:14,64-72`) |
| `broadcast()` | local emit **plus** `onBroadcast` → `StreamerCentral` → DDP fan-out to the other monolith instances (`localServices.ts:7-9`) | `broker.broadcast` to every subscriber of the event name, on any node |
| `nodeID` targeting | **unsupported** — `CallingOptions` is discarded with a warning (`LocalBroker.ts:33-35`) | supported |
| Unknown method / absent service | resolves `undefined` (optional chaining, `LocalBroker.ts:48`) | **returns** `new Error('method-not-available')` as a value (`NetworkBroker.ts:58-60`); `undefined` before `start()` (`:38-40`) |
| Default service deps | `['settings']` (`LocalBroker.ts:30`) | `['settings', 'license']` (`NetworkBroker.ts:27`) |
| `EnterpriseCheck` mixin | n/a | applied to every **non-internal** service; `broker.fatal()` when the `scalability` module is invalid twice (`NetworkBroker.ts:106`) |
| Caller | `proxify<T>(ns)` → `api.call('ns.method', args)` | identical |

Four consequences for this epic:

1. **The split needs no flag and no second client implementation.** The repo's convention is one
   `ServiceClass` implementation registered into whichever broker exists, with callers going
   through `proxify` and never knowing which. What varies by mode is *where the service is
   registered* — not which client the monolith holds. Subtasks 25 and 38 were written as
   "in-process impl vs RPC impl behind a flag"; they are restated below.
2. **The permissive mode is the one CI runs.** Under `LocalBroker` nothing is serialized, so the
   entire class of bugs Phase 2 exists to find is invisible in monolith mode. Any contract test
   that only runs there proves nothing about the wire (subtasks 13, 35, 36, 42).
3. **Cross-node *broadcast* already works in monolith mode; cross-node *calls* do not.** This is
   why `getAppsStatusInNodes` throws `'Getting apps status in cluster is only available in
   microservices mode'` (`apps-engine/service.ts:203`) and why monolith node fan-out runs over a
   **second, independent moleculer `ServiceBroker`** in `ee/server/local-services/instance/service.ts:79-119`
   (TCP/NATS, its own EJSON serializer, gated on the `scalability` license module), whose
   `matrix.getAppsStatus` action calls `Apps.getAppsStatusLocal()`. `fetchAppsStatusFromCluster.ts:7`
   is the `isRunningMs()` branch that picks between the two. See B19 and subtask 43.
4. **Failure is a returned value, not a throw, in both modes — and a different value in each.**
   See B17.

### What crossing the wire actually does to a payload

`SERIALIZER` defaults to `EJSON` (`network-broker/src/index.ts:14`; `MsgPack` is commented out).
Verified round-trip behaviour:

| Value | After `EJSON.parse(EJSON.stringify(x))` |
|---|---|
| `Date`, `RegExp` | survive |
| `Buffer` | `Uint8Array` — `Buffer.isBuffer()` is false, so `.toString('base64')` and friends are gone |
| `undefined` object key | dropped; `undefined` inside an array becomes `null` |
| `Set`, `Map` | `{}` |
| class instance | plain object — methods and `instanceof` gone |
| `Error` **as payload data** | `{}` — `message` and `stack` are non-enumerable, so *nothing* survives |

Thrown errors are a separate, better-behaved path: moleculer's `CustomRegenerator`
(`network-broker/src/index.ts:36-62`) reconstructs `Meteor.Error` with `reason`, `details` and
`isClientSafe`. Custom apps-engine error classes are not whitelisted and arrive as plain
moleculer errors.

The `Error`-as-data row is the same finding ADR 0002 decision 8 records for msgpack
("own-enumerable props only"). It holds on the monolith↔service leg too — one more reason for
subtask 12 to mirror that taxonomy rather than invent a second one.

### The subprocess leg is always serialized

Only the monolith↔service legs change with the deployment mode. The apps-service↔subprocess leg
is msgpack over a pipe in every topology (`packages/apps/src/server/runtime/base/codec.ts`), so:

- The **outbound** direction is largely serialization-safe by construction — every app→host
  bridge param already crossed msgpack before any bridge sees it, and every bridge return value
  crosses msgpack on the way back. What network mode adds is EJSON *on top of* msgpack for the
  middle hop (double encode — relevant to subtasks 22 and 37), plus EJSON's own type collapses
  applied first: a bridge returning a `Buffer` hands msgpack a `Uint8Array` in network mode.
- The **inbound** direction is where by-reference passing exists today: `triggerEvent` payloads
  reach the AppManager as live objects and are only serialized on the way into the subprocess.
  That is the leg B12 and subtask 13 are about.

## 4. Blockers found (concrete)

| # | Blocker | Location |
|---|---|---|
| B1 | Live-object escapes on the public surface (`.self`, `getManager()`, `getStorage()`, `getRocketChatLogger()`) | 108 refs / 42 files |
| B2 | `deasyncPromise` — sync-over-async, cannot cross a process boundary | `bridges/livechat.ts:46` (`online()`), `bridges/internal.ts:15` (`getUsernamesOfRoomById`) |
| B3 | `IPreFileUpload` ships the whole file `content` buffer through `triggerEvent` | `server/lib/media/file-upload/lib/FileUpload.ts:203` |
| B4 | App HTTP endpoints are Express routers mounted on Meteor's `WebApp.rawConnectHandlers` | `bridges/api.ts`, `bridges/router.ts` |
| B5 | `/api/apps/ui.interaction/` mounted on `WebApp` and calls `Apps.getConverters()` directly | `communication/uikit.ts` |
| B6 | Agenda built on `MongoInternals.defaultRemoteCollectionDriver()` | `bridges/scheduler.ts:8,41` |
| B7 | GridFS source storage uses `MongoInternals` | `storage/AppGridFSSourceStorage.ts` |
| B8 | Slash commands mutate the monolith's in-memory `slashCommands.commands` registry | `bridges/commands.ts` |
| B9 | Settings bridge reads the `Settings` model and writes via `updateAuditedByApp` / `notifyOnSettingChanged` | `bridges/settings.ts` |
| B10 | Client fan-out via Meteor streamers (`streamApps`). Cluster fan-out is **already** on broker events — what remains in `websockets.ts` is a dead streamer-listener path (see subtask 21) | `communication/websockets.ts` |
| B11 | Bridge errors are stringly-typed (JSON-RPC `-32000`). **Narrower than first assessed:** `Meteor.Error` *does* survive the broker via `CustomRegenerator`, so `Meteor.Error('error-essential-app-disabled')` is not itself a blocker; custom error classes and errors carried as payload data are (§3) | `BaseRuntimeSubprocessController`, `ee/server/apps/orchestrator.ts` |
| B12 | `Pre*` events mutate live Mongo docs and rely on `result ?? original` at 69 call sites — and the mutation reaches the caller's object only under `LocalBroker` | all `triggerEvent` consumers |
| B13 | License checks are in-process (`canEnableApp`, `License.onModule/onInvalidateLicense/onRemoveLicense`) | `ee/server/lib/license/canEnableApp.ts`, `ee/server/apps/startup.ts` |
| B14 | Node-local-only consumers that must **not** be forced through the wire: migrations `v294`/`v307` (`signApp` + raw storage rewrites) | `server/startup/migrations/` |
| B15 | Converters do DB fan-out while building payloads (`Messages`, `Rooms`, `Users`) | `app/apps/server/converters/*` |
| B16 | `LocalBroker` passes arguments **by reference**, so every serialization defect is invisible in the topology CI runs. `Buffer`→`Uint8Array`, `Set`/`Map`→`{}`, class identity loss and dropped `undefined` only appear under `NetworkBroker` | `LocalBroker.ts:48` vs `network-broker/src/index.ts:64-72` (§3) |
| B17 | Divergent, non-throwing failure semantics: an absent method resolves `undefined` locally, and an absent service **returns** `new Error('method-not-available')` as a value in network mode. Once `Apps.self?.x` becomes `await Apps.x()`, `undefined` conflates *apps not loaded*, *method missing* and *service down* | `LocalBroker.ts:48`, `NetworkBroker.ts:38-40,58-60` |
| B18 | `NetworkBroker.createService` will not register a method matching `/^on[A-Z]/` as an action — it routes it into the `$node.*` lifecycle map, which holds only `onNodeConnected/Updated/Disconnected`, so anything else lands on `service.events[undefined]` and is **uncallable**. `LocalBroker` registers the same method normally. Both brokers also enumerate one prototype level only, and `LocalBroker` calls `.bind` on whatever it finds (a getter on the service class crashes registration) | `NetworkBroker.ts:80-129`, `LocalBroker.ts:101-112` |
| B19 | Two cluster transports for one question. `LocalBroker.call` discards `nodeID`, so monolith node fan-out uses a **separate moleculer broker** inside `InstanceService`, gated on the `scalability` license module; MS mode uses `$node.services` + per-node `apps-engine.getAppsStatusLocal` | `LocalBroker.ts:33-35`, `ee/server/local-services/instance/service.ts:79-119`, `apps-engine/service.ts:201-203`, `ee/lib/misc/fetchAppsStatusFromCluster.ts:7` |
| B20 | Licensing posture for a *scalable* apps service is undecided. `apps-engine` escapes `EnterpriseCheck` today only because it is `ServiceClassInternal`; a non-internal service is shut down (`broker.fatal()`) when more than one node runs it without the `scalability` module. The default dependency set also differs by mode (`['settings']` vs `['settings','license']`) | `NetworkBroker.ts:27,106`, `ee/packages/network-broker/src/EnterpriseCheck.ts` |

## 5. Recommended boundary

Put the process boundary **between the bridges and the AppManager**, not between the
monolith and the whole apps stack.

- The apps service owns: `AppManager`, all managers, compiler, runtime controllers +
  subprocesses, metadata/log/source storage (direct Mongo), scheduler.
- The monolith owns: the bridge *implementations* (they are the host adapter — 48 distinct
  monolith function imports) and every user-facing transport (REST, streamers, WebApp mounts).
- **The service relays the reverse channel; it does not resolve it.** One broker action —
  `apps-host.invokeBridge({ appId, method, params })` — forwards the `bridges:*` frame as
  received. The service resolves nothing except `getAppResourceBridge`, which
  `handleBridgeMessage` already splits out (`BaseRuntimeSubprocessController.ts:412-426`) and
  which must stay local because it fronts the AppManager registries. **137 of the 152 `do*`
  methods cross the wire; 15 do not.**
- `@rocket.chat/apps` stays a leaf (no runtime dep on `core-services`, per D4 of the approved
  proposal). The relay is an injected sender, at the same seam where `AppBridges` is injected today.
- Bridges that are pure model reads can later resolve *inside* the service, method by method —
  see "Promoting reads" below. That is subtask 45, not part of standing the boundary up.

The action is named `invokeBridge`, **not `bridgeCall`**: `bridgeCall` is already the
subprocess-side emitter (`packages/apps/base-runtime/src/lib/bridges/bridgeCall.ts`), and ADR 0002
decision 19 narrows *its* `method` parameter to a closed per-bridge union. Two functions with one
name and opposite typing rules on adjacent legs of the same chain is a trap.

### Why relay, and not a proxy over the invoker table

ADR 0002's table entries are pure — `invoke: (b, args, appId) => b.doX(...)` takes the bridge
instance as a *parameter*. So the table does not have to run where `AppManager` runs. It has to run
where `AppBridges` runs. Keep the bridges in the monolith and the table executes there, which
preserves two ADR 0002 decisions at no cost:

- **D17 — caller identity never crosses the wire.** `appId` is one envelope field, set by the
  service from the connection it owns. The monolith thunk injects it into the argument list exactly
  as ADR 0002 specifies. D17's three app-supplied-appId methods (`ModerationBridge.doReport`,
  `doDismissReportsBy*`, `UserBridge.doDeleteUsersCreatedByApp`) keep their appId as data inside
  `params`, untouched by the envelope.
- **D13 — app→host params always validated host-side.** AJV runs immediately before `invoke`, in
  the process that owns the bridges. Nothing is validated twice, and nothing is validated nowhere.
  The service adds no checks of its own: it forwards an untrusted frame with a trusted `appId`
  attached. It is the only thing vouching for that `appId`, so it must be an authenticated broker
  peer.

The relay needs **no per-method knowledge**, which also decouples subtask 22 from ADR 0002 PRs 5–6.
It can land against today's reflective dispatcher — the service substitutes the `'APP_ID'` sentinel
before it forwards — and PRs 5–6 later change only the monolith side.

Four costs, recorded so they are not rediscovered:

- **The envelope is untyped by construction.** A relay cannot narrow what it does not read, so
  `invokeBridge` ships `method: string` and `params: unknown[]`. ADR 0002 decision 19 makes a
  nonexistent method a compile error on the subprocess hop; the new hop has no equivalent until
  subtask 23 declares the envelope with the closed union from `protocol/contracts/bridges/names.ts`.
  That needs ADR 0002 PR 0 only, not PRs 5–6.

- **It is not a byte pipe.** The frame is one msgpack map, so the service decodes it to read
  `method` and re-encodes as EJSON. The payload then takes EJSON's collapses on the second hop —
  `Buffer` becomes `Uint8Array`, which matters for `getUploadBridge` and `getHttpBridge:doCall`
  bodies (§3).
- **Two network hops per accessor call.** A listener that reads a room and a user costs four round
  trips. This is the whole motivation for promoting reads.
- **Stacked timeouts.** The broker `REQUEST_TIMEOUT` must be shorter than `getRuntimeTimeout()`.
  Otherwise the subprocess abandons a call while the monolith still executes the write behind it.

### Promoting reads, not moving bridges

The tempting alternative is to move all 28 bridges into the service and give it
`@rocket.chat/models`. The wiring is trivial — `registerServiceModels(db, trash)`, as
`ee/apps/authorization-service/src/service.ts:13` already does. The premise is not: the bridges are
not a model layer.

| Measure | Count |
|---|---|
| Bridge files that import `@rocket.chat/models` | 11 of 30 |
| Distinct models used | 12 — 5 absent from `registerServiceModels` (`Settings`, `OAuthApps`, `ModerationReports`, `LivechatDepartment`, `FederationKeys`) |
| Distinct monolith-internal imports | 48 |
| `protected` bridge methods in `apps/meteor` | 125, of which 48 are read-shaped by name |

Those 48 imports are write-path business logic: `executeSendMessage`, `createChannelMethod`,
`createPrivateGroupMethod`, `createDirectMessage`, `createDiscussion`, `deleteMessage`,
`deleteRoom`, `deleteUser`, `addUserToRoom`, `removeUserFromRoom`, `setUserAvatar`,
`setUserActiveStatus`, `executeSetReaction`, `reportMessage`, `closeRoom`, `transfer`,
`FileUpload`, `callbacks`, `notifications`, `Mailer`, `notifyOnUserChange`, `updateAuditedByApp`.
A wholesale move converts one generic RPC into ~48 named RPCs, most of which have no service action
today — more contract surface, not less. Models cannot substitute for them either: a direct Mongo
write skips `callbacks` and `notifyListener`, so no client ever sees an app-sent message.

Direct model access also makes the collection schema a compile-time surface shared by two separately
deployed artifacts, which subtask 24 then has to version — harder than versioning an RPC. The epic
already accepts direct Mongo for **apps-owned** collections (subtask 15); core collections are a
separate decision.

So split by **write vs read**, not by bridge. The 48 read-shaped methods are a model read plus a
converter — `AppRoomBridge.getById` is `Rooms.findOneById` and a converter call. Promote those into
the service and both hops leave the hot path, and the converters read locally, which also attacks
B15. Write paths never move: their side effects are the point.

**The boundary is identical in both deployment modes** (§3): `apps-host` is a registered service
like any other, so in monolith mode `invokeBridge` is a by-reference function call through
`LocalBroker` and in microservices mode it is EJSON over the transporter. Nothing in the design
branches on the mode — only `registerServices()` does.

## 6. Dependency: the host↔subprocess protocol extraction (ADR 0002)

ADR 0002 never mentions this epic — its stated driver is cross-runtime codec drift. It is
nonetheless the single largest piece of groundwork for the split, because it converts the
app→host wire from something *re-derived on both sides* into a **declared, typed,
testable contract**. A relay can proxy a declared protocol; it cannot proxy an implicit one.

### What it delivers to this epic

| ADR 0002 decision | What this epic gets |
|---|---|
| **17, 19** — invoker table `Record<BridgeMethodKey, Entry>` in `src/server/runtime/bridgeContracts.ts`: 152 `do*` methods across 27 bridge classes, each with a declared param schema and a typed invoker thunk; a missing entry is a compile error | **Not** the reverse-channel manifest — the relay is method-agnostic (§5). What it gives this epic is the *monolith* side of the relay: a map lookup instead of reflection over `this.bridges`, with the schema and the identity slot already declared per method |
| **2** — `protocol/` declares the wire; *the host* owns the binding from that wire to *its* bridges (the table cannot live in `protocol/`, which builds before `AppBridges` exists) | A declared seam **exactly at the bridges↔AppManager boundary** recommended in §5. In the split world the **monolith** is that host — `AppBridges` lives there, so the table lives and executes there. The service holds no binding at all |
| **13** — subprocess is untrusted; app→host params always AJV-validated host-side | The checkpoint stays a single one, in the process that owns the bridges. The service validates nothing and forwards an untrusted frame with a trusted `appId` attached — which makes *the service's own broker identity* the thing that has to be authenticated (§5) |
| **17** — `'APP_ID'` sentinel dropped from the wire; identity injected by the thunk from the connection-known app id | Removes a value-match that cannot distinguish identity from data (an app requesting a role literally named `APP_ID` has its argument rewritten) and closes the `getHttpBridge:doCall` nested-identity gap ADR 0001 left open. Pipe-local bugs today; network-reachable after the split. Gives the relay envelope its `appId` field for free — the service sets it, the monolith thunk consumes it, and no sentinel is reinvented on the third wire |
| **8** — closed error-code enum, declared `data` shape per code; records that `data: <Error>` transmits *nothing* (msgpack encodes own-enumerable props only) | Covers the **app↔host leg of subtask 12** — and the finding generalizes: EJSON drops `Error` payload data identically (§3) |
| **6** — `isProtocolError` brand replacing two `instanceof` library-class checks | `instanceof` does not survive a process boundary at all — including the EJSON leg |
| **3–5** — one factory-based codec, complete on both sides | Today the two `codec.ts` files are complementary halves that cannot round-trip their own output. The split adds a *third* participant to that format; unifying first is the difference between one format and three halves |
| **12** — flattened, closed method set; variable segments move into params | Wire becomes routable by map lookup, `method` validatable as an enum at envelope level, and no app-supplied string is interpolated into a dispatch key |
| **Follow-up 2** — reserved top-level `meta` envelope slot (HTTP-headers analogue for tracing) | The hook **subtask 30** needs. Blocked on follow-up 1 (dropping `jsonrpc-lite`), which is also the per-request `JSON.stringify(params)`-and-discard tax — worse once payloads cross a network |

### Scope boundary

ADR 0002 covers the **app↔runtime-host** protocol only. The monolith→apps inbound surface
(`triggerEvent`, management REST, UIKit, slash commands) is untouched and remains Phase 1 here.

### The gap it does *not* close

ADR 0002 explicitly licenses breaking changes on **"no version skew"** — the subprocess is
spawned from the installed `packages/apps`, so the wire is not a compatibility surface. That
assumption **survives the split for the host↔subprocess wire** (runtime and service ship in the
same image) but **does not extend to the new monolith↔service wire**, which is a versioned
surface between separately deployed artifacts. ADR 0002 must not be read as having settled it —
see subtask 24.

### Ordering constraint

**Weaker than first assessed.** ADR 0002's PRs 5–6 (contract mechanism, then the remaining ~120
schemas and thunks) do **not** gate subtask 22, because the relay carries no per-method knowledge to
rebuild (§5). Before PRs 5–6 the service substitutes the `'APP_ID'` sentinel before it forwards;
after them it sets `appId` in the envelope and only the monolith responder changes. What PRs 5–6 do
gate is the *quality* of that responder — without the table it dispatches by reflection over a
string that arrived from another process.

## 7. Candidate subtasks

Sized: **S** ≤ 2d · **M** ≤ 1w · **L** ≤ 2w · **XL** > 2w (split further before starting).
Numbers are stable IDs, not an ordering — 41–44 were added by the §3 review, 45 by the §5 rewrite,
and each sits in the phase it belongs to.

### Phase 0 — Land in-flight work and seal the facade

| # | Subtask | Size | Depends on |
|---|---|---|---|
| 1 | Land the `IAppsEngine` facade PR (`chore/apps-service-centralized`): single injectable `Apps` facade, codemod of 34+ callers. **Absorb** the `core-services` `Apps` proxy's 5 methods into the facade rather than deleting it — the end state of `IAppsEngine` is `proxify<IAppsEngineService>('apps-engine')`, which is already mode-transparent (§3). Deleting it now means Phase 4 rebuilds the same call path, and the nine Phase 1 facade subtasks get designed against in-process ergonomics in the meantime | M | — |
| 2 | Classify and close the residual live-object consumers: `getAppsStatistics`, `disableAppsWithAddonsCallback`, `canEnableApp`, migrations `v294`/`v307`. Promote to serializable facade methods, or mark explicitly node-local-internal (B1, B14) | S | 1 |
| 3 | Add an ESLint boundary rule: nothing outside `apps/meteor/app/apps/` + `apps/meteor/ee/server/apps/` may import apps internals — only the `Apps` facade. Locks in the guard greps from the handoff | S | 1 |

### Phase 1 — Complete the inbound contract

| # | Subtask | Size | Depends on |
|---|---|---|---|
| 4 | Define `IAppsEngine.management.*` and make `communication/rest.ts` a thin transport: install / update / uninstall / enable / disable / settings / logs / apis / screenshots / languages (26 routes + 6 handler modules, 1314 LOC) | L | 1 |
| 5 | Move UIKit interaction behind the facade: `handleUserInteraction(appId, payload)`; remove `Apps.getConverters()` and `getUIActionButtonManager()` reach-through from `uikit.ts` (B5) | M | 1 |
| 6 | Facade for slash commands: `executeCommand` / `previewCommand` / `executePreviewItem`, plus a registry-sync channel replacing direct mutation of `slashCommands.commands` (B8) | M | 1 |
| 7 | Facade for app-provided HTTP endpoints: DTO for request/response + `executeApi(appId, path, request)`; the monolith keeps the WebApp mount and proxies (B4) | M | 1 |
| 8 | Facade for external components / Game Center and UI action buttons (`getProvidedComponents`, action-button manager) | S | 1 |
| 9 | Verify the video-conf (7) and outbound-provider (2) facade namespaces land with error strings preserved (`apps-engine-not-loaded`, `NO_APP`, `NOT_CONFIGURED`, `apps-engine-not-configured-correctly`) | S | 1 |
| 41 | **Facade shape rules imposed by the broker, enforced in CI** (B18): no `/^on[A-Z]/` method names on a service class — they are silently uncallable in network mode and callable locally; no getters; no inherited methods beyond one prototype level; every method `async`. Needs to land with 4–9, not at 23, because that is when the method names are chosen. A unit test that registers the facade into `LocalBroker` and a mocked `NetworkBroker` and asserts identical action sets is enough | S | 1 |

### Phase 2 — Make the contract serializable

| # | Subtask | Size | Depends on |
|---|---|---|---|
| 10 | Remove `deasyncPromise` from the livechat and internal bridges — async `isOnline` / `getUsernamesOfRoomById`. Touches the apps-engine `definition/` surface, so needs an app-facing compat plan (B2) | M | — |
| 11 | Break the file-upload flow: decouple `IPreFileUpload` validation from the upload request so file content never has to cross the wire (B3) | L | — |
| 12 | Typed, serializable error envelope for the **monolith↔service** leg (B11, B17). Mirror ADR 0002 decision 8's taxonomy rather than inventing a second one — EJSON drops `Error` payload data exactly as msgpack does (§3). Scope is narrower than B11 first suggested (`Meteor.Error` already survives via `CustomRegenerator`) but wider in one place: **"the service is absent" and "the method is not available" must be first-class states**, because both brokers signal them by *returning* a value (`undefined` / `Error`) rather than throwing | M | 1, ADR 0002 PR 3 |
| 13 | Pin the `triggerEvent` wire contract: 48 event types, zod/msgpack schemas, golden tests for `result ?? original` passthrough and `Pre*` mutation semantics; payload size budget (B12). **The golden tests must run under both brokers** — `Pre*` handlers mutate the caller's live object under `LocalBroker` and a copy under `NetworkBroker`, and `result ?? original` hides the difference locally (B16) | L | 1 |
| 14 | Serialization audit of converter output against **EJSON specifically** (`SERIALIZER=EJSON`, not MsgPack, on this leg): `Buffer`→`Uint8Array`, `Set`/`Map`→`{}`, dropped `undefined` keys, `undefined`→`null` in arrays, class identity loss; `Date` and `RegExp` are safe (§3). Rides on the zod-codec migration (B15) | M | zod codecs |
| 42 | **Strict mode for `LocalBroker`** (B16): an opt-in dev/CI flag that EJSON round-trips `call` arguments and return values, so monolith-topology CI catches wire defects instead of deferring them to the microservices e2e matrix. Cheapest possible mitigation for the fact that the permissive mode is the one CI runs — and it benefits every service, not just apps. Pairs with 13, 14, 35, 36 | S | — |

### Phase 3 — Relocate implementation into `@rocket.chat/apps`

| # | Subtask | Size | Depends on |
|---|---|---|---|
| 15 | Move the storage layer (`AppRealStorage`, `AppRealLogStorage`, `AppFileSystemSourceStorage`, `AppGridFSSourceStorage`, `ConfigurableAppSourceStorage`) into the package; inject a Mongo client instead of `MongoInternals` (B7) | M | — |
| 16 | Give the scheduler its own Mongo connection; drop `MongoInternals` from `bridges/scheduler.ts` (B6) | S | — |
| 17 | Move `AppServerOrchestrator` into the package with injected storage / bridges / settings / license ports; leave a thin Meteor composition root | L | 15, 16 |
| 18 | Move the marketplace client (`MarketplaceAPIClient`, `fetchMarketplaceApps`, `fetchMarketplaceCategories`, `appInstall`, `getMarketplaceHeaders`, `appRequestsCron`) into the package | M | — |
| 19 | Move the converters into the package behind an injected model-read port | L | 14 |
| 20 | **Dropped by §5.** The relay makes the split unnecessary: the bridges stay whole, stay in the monolith, and keep their 48 monolith imports. The protocol/validation half is ADR 0002's invoker table, which lands beside them in that ADR's PRs 5–6 and is not this epic's work. Read promotion is subtask 45 | — | — |
| 21 | **Mostly landed — rescoped to a deletion.** Cluster sync is already on broker events (`apps.*`, `command.*`, `actions.changed`) with client streamer emission already split into `listeners.module.ts`. Nothing emits on `streamAppsEngine` any more, so `AppServerListener`'s ten `engineStreamer.on(...)` handlers and the `received` dedup map are dead code — delete them, and confirm the surviving loop guards (origin-instance check on `apps.updated`, value-equality checks on `apps.statusUpdate` / `apps.settingUpdated`) are the intended ones, since `LocalBroker.broadcast` delivers to the emitting instance too (B10) | S | — |

### Phase 4 — Stand up the service boundary

| # | Subtask | Size | Depends on |
|---|---|---|---|
| 22 | **Reverse-channel relay** `apps-host.invokeBridge({ appId, method, params })`. Replace `handleBridgeMessage`'s `this.bridges` lookup with a forward, keep its `getAppResourceBridge` branch local (15 of 152 methods never leave), and add the monolith-side responder that runs AJV + the invoker table + `invoke`. Method-agnostic, so it does **not** depend on ADR 0002 PRs 5–6 (§6). Named `invokeBridge` to avoid colliding with `base-runtime`'s existing `bridgeCall`. Register `apps-host` as a normal service so monolith mode resolves it through `LocalBroker` with no second code path (§5). Set the broker `REQUEST_TIMEOUT` below `getRuntimeTimeout()`, or a subprocess abandons a call the monolith is still executing. Note the double encode in network mode: EJSON for this hop on top of msgpack for the subprocess hop | M | 17 |
| 23 | Formalize the `apps-engine.*` inbound service contract as a single typed manifest, with the broker-imposed shape rules from 41 asserted against it. **Also type the outbound relay envelope.** 22 ships `apps-host.invokeBridge` with `method: string` and `params: unknown[]`, because a relay cannot narrow what it does not read — so the new hop loses the compile-time check ADR 0002 decision 19 gives the subprocess hop. Recover it here: declare the envelope with the closed `bridges:<Bridge>:<method>` union imported from `protocol/contracts/bridges/names.ts`, so a caller naming a nonexistent method fails typecheck on both sides of the broker rather than only inside `base-runtime`. Needs ADR 0002 PR 0 (`names.ts` is in the skeleton PR, ahead of the schemas); it does not need PRs 5–6 | M | 4–9, 41, ADR 0002 PR 0 |
| 24 | **Version the monolith↔service wire.** ADR 0002 licenses breaking wire changes on "no version skew" — true for host↔subprocess (same image), **false** for monolith↔service (separately deployed). Decide the compatibility policy for both directions: version negotiation on connect, additive-only rules, skew window vs. the monolith release train, and what a service running an older/newer contract must do. Applies to `apps-engine.*` **and** `apps-host.*`. Note the negotiation has to work against a broker that reports an unknown method by *returning* `Error('method-not-available')` rather than throwing (B17). If 45 lands, the versioned surface also includes the **collection schemas** the service reads directly — harder to negotiate than an RPC, and a reason to keep 45's scope to reads whose shape the converters already pin | M | 22, 23 |
| 25 | **Restated:** there is no `triggerEvent` fork to build. Route it through the facade/broker in *both* modes and let `registerServices()` decide topology — register `AppsEngineService` locally when `!isRunningMs()`, skip it when the standalone service owns it, exactly as `Presence` / `Authorization` / `QueueWorker` are handled today (`server/services/startup.ts:68-81`). What this subtask actually delivers: the `isRunningMs()` registration gate for apps, an override env var for "network transporter but keep apps in-process", and a latency check that the in-process path did not regress by going through `api.call` (§3) | M | 13, 23 |
| 26 | Settings client for the apps service: remote `settings.get` + change subscription replacing `settings.watch` / `settings.change` / `Settings` reads (B9) | M | 21 |
| 27 | License/entitlement client for the apps service: `canEnableApp`, addon checks, `License.onModule` / `onInvalidateLicense` / `onRemoveLicense` (B13). **Also decide the `EnterpriseCheck` posture (B20):** is horizontally scaling the apps service gated on the `scalability` module? If yes the service must stop being `ServiceClassInternal`, and then every monolith node also advertising `apps-engine` trips `EnterpriseCheck`'s ">1 node without the module ⇒ `broker.fatal()`" rule. If no, record why it stays internal. Watch the naming rules from 41 here — `onModule`/`onInvalidateLicense`/`onRemoveLicense` are exactly the shape `NetworkBroker` refuses to register as actions | M | 41 |
| 28 | Authentication for proxied app HTTP endpoints: ship the authenticated user (converted) with the forwarded request | M | 7 |
| 29 | File/binary transfer strategy. **Not a blanket "no Buffers over the broker":** `NetworkBroker.call` already supports a `Stream.Readable` via the `data[0].streamParam` convention (`NetworkBroker.ts:44-51,147-148`), which `UploadService` uses and which degrades correctly under `LocalBroker`. Reuse it for the uploads bridge and app package zips; GridFS handles are still the right answer for `IPreFileUpload`, where N apps each need the bytes and a stream is single-consumer. Either way, `Buffer` arrives as `Uint8Array` (§3) | L | 11, 15 |
| 30 | Logs, metrics and tracing across the boundary: `AppLogs` writes, prometheus `getAppsStatistics`, OTel span propagation. Reuses ADR 0002 follow-up 2's reserved `meta` envelope slot. Note `IBroker.metrics` is optional and `LocalBroker` does not implement it, so any metric registered from inside the service must tolerate its absence in monolith mode. Node fan-out moved out to 43 | M | 23, ADR 0002 follow-ups 1–2 |
| 43 | **Unify the two cluster transports** (B19). One question — "what is each node's view of each app?" — has two implementations: `apps-engine.getAppsStatusInNodes` (broker `$node.services` + per-node `nodeID` calls, MS only, throws otherwise) and `InstanceService`'s private moleculer broker with its `matrix.getAppsStatus` action (monolith only, `scalability`-gated), selected by the `isRunningMs()` branch in `fetchAppsStatusFromCluster.ts:7`. Decide whether to (a) teach `LocalBroker` `nodeID` targeting by delegating to `InstanceService`'s broker, (b) keep the branch and make it the *only* mode conditional in the apps surface, or (c) make the standalone service the sole owner of the answer. The split multiplies this: "which nodes run apps" stops being "which nodes are monolith instances" | M | 23, 31 |
| 45 | **Promote read-only bridge methods into the service** (§5, B15). 48 of the 125 `protected` methods in `apps/meteor`'s bridges are read-shaped: a model read plus a converter. Resolve them inside the service-side `AppBridges` implementation, backed by `registerServiceModels`, so they skip both network hops. Add the 5 models the bridges need that the registry lacks (`Settings`, `OAuthApps`, `ModerationReports`, `LivechatDepartment`, `FederationKeys`) — that registry is shared by every service, so the addition is not apps-local. Ship per model group, measure each against 37's baseline, and keep each group independently revertible. **Write paths never move**: a direct Mongo write skips `callbacks` and `notifyListener`, so no client sees the result | L | 22, 19 |
| 44 | **Define behaviour when the apps service is absent** (B17, and §8's CE constraint, which today has no subtask). `undefined` back from `Apps.x()` currently conflates *apps not loaded*, *method not registered* and *service down*; after the codemod all 69 `triggerEvent` sites and every facade caller need one defined answer per case, with "apps unavailable" treated as a normal state rather than an error. Covers CE builds (no `ee/server/apps`), a monolith booting before the service is up (`NetworkBroker.call` returns `undefined` until `start()`), and a service that dies mid-flight | M | 12, 23 |

### Phase 5 — Package and deploy

| # | Subtask | Size | Depends on |
|---|---|---|---|
| 31 | Create the `ee/apps/apps-engine-service` workspace: entrypoint, service registration, health, Dockerfile via `turbo prune` (mirror the existing `ee/apps/Dockerfile` pattern) | L | 22, 23 |
| 32 | Ship the runtimes in the image: node-runtime dist, deno binary + `.deno-cache`, esbuild platform binaries, subprocess temp dir + ownership. Also `packages/apps/protocol/dist` once ADR 0002 PR 0 lands (4th tsc project, built first) | M | 31 |
| 33 | Deployment wiring: `TRANSPORTER`, `MONGO_URL`, `APPS_ENGINE_RUNTIME_BACKEND`, compose/helm manifests, scaling policy, `isRunningMs()` behaviour. Include the mode-dependent knobs from §3: `SERIALIZER` (EJSON default), `REQUEST_TIMEOUT` (60s default — apps can exceed it), `BALANCE_PREFER_LOCAL`, `RETRY_ENABLED` (off by default), `BULKHEAD_*`, `HEARTBEAT_*`, and the extra `license` service dependency `NetworkBroker` adds | M | 31 |
| 34 | CI: build and push the image; add the service to the microservices e2e matrix | M | 31 |

### Phase 6 — Validate and roll out

| # | Subtask | Size | Depends on |
|---|---|---|---|
| 35 | Contract tests for both RPC surfaces (inbound `apps-engine.*`, outbound `apps-host.*`), **run against both brokers** — `LocalBroker` for the monolith topology and `NetworkBroker` over a real transporter for the split one; a green local-only run says nothing about the wire (B16). Extend ADR 0002's round-trip contract test outward rather than starting a second harness; keep its self-reported coverage gap (only ~30 of ~152 methods are emitted by any accessor today) | M | 22, 23, 42 |
| 36 | Run the 19 apps e2e specs (`.mocharc.api.apps.js`) against the microservice topology — and against the monolith topology with 42's strict `LocalBroker` enabled, so both deployments are exercised on the same assertions | M | 31, 42 |
| 37 | Hot-path benchmark + latency budget: `sendMessage` / `IPreMessageSent*`, `createRoom`, file upload, with the extra hop. Measure both modes: monolith gains only `api.call` dispatch + tracing span overhead, microservices gains EJSON encode/decode on top of the existing msgpack subprocess hop (§3) | M | 25 |
| 38 | **Restated:** the rollout switch is *where the service is registered*, not which client implementation the monolith holds — one `IAppsEngine`, one call path, `proxify` on top of whichever broker (§3). The kill switch is therefore "register `AppsEngineService` in-process even under a network transporter", and it is the same lever as 25's override env var | M | 25 |
| 39 | Data and upgrade path: app packages in GridFS, `rocketchat_apps_scheduler` jobs, `Apps_Logs_TTL`, private-app migration once the service owns storage | M | 15, 31 |
| 40 | Docs: update `docs/apps-engine-migration.md` (which does not currently mention the broker or either deployment mode), add an ADR for the service boundary and the two RPC contracts, and record the local/network duality from §3 there | S | — |

## 8. Sequencing notes

- **1 → 2 → 3 is the critical path.** Nothing else is safe to start while 108 `Apps.self`
  references can reintroduce live-object coupling.
- **10, 11, 15, 16, 18, 42 are independent** and can run in parallel with Phase 1.
- **41 must land with Phase 1, not with 23.** The broker's naming and shape constraints (B18)
  decide what the facade methods may be *called*; discovering them at 23 means renaming a
  contract that 4–9 already shipped.
- **42 is cheap and pays for itself immediately.** Without it, Phases 2–3 land serialization
  contracts whose tests exercise the by-reference path (B16), and the first real signal arrives
  at 36.
- **ADR 0002 runs in parallel with Phases 0–2 and gates nothing here.** Its PRs 5–6 make the
  monolith responder a map lookup instead of reflection, which is worth waiting for but is not a
  precondition (§6). Its **PR 0** is a real dependency, but only of 23, and only for the closed
  bridge-name union that types the relay envelope.
- **22 is the highest-leverage item** — ADR 0001 reduced the entire app→host surface to one
  dispatcher, and the relay converts that one dispatcher into one broker action. It is now M, not
  L, and it no longer has an XL predecessor.
- **45 is where the performance is, and it is optional.** The boundary works without it; the hot
  path is twice as chatty until it lands. Sequence it after 37 has a baseline to measure against.
- **24 is easy to forget and expensive to retrofit.** Every contract decision made in 22 and 23
  bakes in a compatibility posture whether or not anyone chose one.
- **43 and 44 are the two mode-shaped items that have no natural owner.** Both are currently
  implicit: 43 hides behind a single `isRunningMs()` branch, and 44 hides behind `?.` and
  `?? original` at every call site.
- Apps are EE-gated (`ee/server/apps`), so CE builds must keep working with the service absent —
  which is now subtask 44 rather than an assertion in this list.
