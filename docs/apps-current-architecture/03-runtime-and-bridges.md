# Apps v1 — Runtime Sandbox, Bridges & Compiler (`@rocket.chat/apps`)

> Snapshot of the **current** implementation: how app code is actually executed (the subprocess
> sandbox), how it calls back into Rocket.Chat (bridges), and how a package becomes a running app
> (compiler). Companion to `02-engine-architecture-and-state.md`.

## 1. Execution model: out-of-process sandbox

App code does **not** run in the main server process. Each app runs in its **own subprocess**,
communicating with the host over **JSON-RPC** framed with **msgpack** on stdin/stdout. Two backends
exist, chosen by `APPS_ENGINE_RUNTIME_BACKEND` (`managers/AppRuntimeManager.ts:22`):

- **Deno (default)** — `runtime/deno/AppsEngineDenoRuntime.ts`. Spawns `deno run` with a tight
  permission set (`--cached-only`, scoped `--allow-read`, limited `--allow-env`, conditional
  `--allow-net` only if the app declared the `networking` permission). Entry: `deno-runtime/main.ts`.
- **Node (opt-in, `=node`)** — `runtime/node/AppsEngineNodeRuntime.ts`. Spawns Node with the
  permission model (`--permission --allow-fs-read=…`). Entry: `node-runtime/dist/main.js`.

Both share the same protocol, codec, messenger, and liveness design — Node is essentially a port of
the Deno controller.

The two runtime *directories shipped in the package* (`deno-runtime/`, `node-runtime/`) are the code
that runs **inside** the sandbox; `src/server/runtime/` is the **host-side controller** that drives
the subprocess. They talk only via the RPC channel.

### 1.1 Key host-side classes

- `IRuntimeController` (`runtime/IRuntimeController.ts`) — the interface `ProxiedApp` calls.
- `DenoRuntimeSubprocessController` / `NodeRuntimeSubprocessController` — `implements
  IRuntimeController`; `spawnProcess()`, `sendRequest()`, `waitForResponse()`.
- `ProcessMessenger` (`runtime/deno/ProcessMessenger.ts`) — stdin/stdout framing.
- `codec.ts` (`runtime/deno/codec.ts`) — msgpack encode/decode with custom extensions:
  strips functions, converts Buffers, and masks **secure fields** (settings marked sensitive) so they
  never cross into the subprocess in the clear.
- `LivenessManager` (`runtime/deno/LivenessManager.ts`) — pings every ~10s, tolerates ~4 missed
  pongs, then **restarts** the unresponsive subprocess. This is the v1 answer to "a wedged app
  shouldn't hang the engine."

### 1.2 The RPC method namespaces

The subprocess router (`deno-runtime/main.ts`, `node-runtime/src/main.ts`) dispatches by method
prefix. There are **three directions** of traffic:

**Host → App** (`ProxiedApp.call('${method}')` → `{ method: 'app:${method}' }`, `ProxiedApp.ts:64`):
- `app:*` — lifecycle & event handlers (construct, initialize, onEnable, execute*Listener, …)
- `api:*`, `slashcommand:*`, `scheduler:*`, `videoconference:*`, `outboundCommunication:*` —
  contribution invocations
- `ping` — liveness

**App → Host (accessors)** — `accessor:${namespace}:${prop}`. The subprocess builds accessor objects
as **JS Proxies** (`deno-runtime/lib/accessors/mod.ts`); any property access becomes an RPC. The host
handler (`AppsEngineDenoRuntime.ts:499`, `handleAccessorMessage`) parses the chain
(`getEnvironmentRead:getSettings`), validates it against an `ALLOWED_ACCESSOR_METHODS` allowlist, walks
the accessor objects, and returns the result. (HTTP and Notifier are special-cased to concrete
classes rather than pure proxies.)

**App → Host (bridges)** — `bridges:${bridgeName}:${method}`. Handler at
`AppsEngineDenoRuntime.ts:595` (`handleBridgeMessage`): the method must start with `do`, the bridge is
invoked, and crucially the host **substitutes the literal `'APP_ID'` placeholder with the real app
id** (`AppsEngineDenoRuntime.ts:622`) so a subprocess cannot impersonate another app by passing a
forged id.

---

## 2. Bridges — the host API surface (`src/server/bridges/`)

Bridges are how a running app *affects* Rocket.Chat. There are 34 bridge files; the engine declares
them **abstract** (`AppBridges.ts` exposes a getter per bridge), and the host implements the concrete
behavior. `BaseBridge.ts` is a marker base.

### 2.1 The `do*` permission-wrapper pattern

Every bridge method an app can reach is a **public `do*`** method that first checks a permission, then
delegates to a **protected abstract** method the host implements. Example
(`bridges/MessageBridge.ts:15`):

```typescript
public async doCreate(message: IMessage, appId: string): Promise<string> {
  if (this.hasWritePermission(appId)) {        // AppPermissionManager.hasPermission(appId, message.write)
    return this.create(message, appId);        // protected abstract → host impl
  }
  // else: notifyAboutError(...) and fall through → returns undefined
}
```

> **v2 friction (verbatim):** "denied calls log to server console but throw nothing; the app can't
> detect the failure at runtime." This is literally that code path — on denial the bridge calls
> `AppPermissionManager.notifyAboutError` and returns `undefined`. No `PermissionDeniedError` crosses
> the RPC boundary. This is the single most-cited v1 permission defect and it lives here.

### 2.2 Bridge catalogue (representative)

Data/entity: `MessageBridge`, `RoomBridge`, `UserBridge`, `RoleBridge`, `ContactBridge`,
`UploadBridge`, `PersistenceBridge`. Capability: `HttpBridge`, `EmailBridge`, `SchedulerBridge`,
`EnvironmentalVariableBridge`, `ServerSettingBridge`, `CloudWorkspaceBridge`. Feature:
`LivechatBridge`, `VideoConferenceBridge`, `OutboundMessagesBridge`, `ModerationBridge`,
`OAuthAppsBridge`, `UiInteractionBridge`, `CommandBridge`. Engine↔host signalling:
`AppActivationBridge` (status changes), `AppDetailChangesBridge` (metadata), `ListenerBridge`,
`InternalBridge`/federation bridges (interfaces).

### 2.3 Permission enforcement reality

Permission checks exist **only at the bridge layer** (write/read scopes per
`AppPermissions`). Reads through accessors are gated by the allowlist + the underlying bridge; the
declared manifest permissions (`02`, `IAppStorageItem.permissionsGranted`) feed
`AppPermissionManager.hasPermission`. The enforcement is *present* but *silent on denial* — the v2 doc
keeps the coarse `read`/`write` × entity model but demands a thrown, typed denial.

---

## 3. Compiler & packaging (`src/server/compiler/`)

### 3.1 From zip to running app

1. **Parse** — `AppPackageParser.unpackageApp(buffer)` unzips the package, reads/validates `app.json`
   against the manifest schema, rewrites `.ts` → `.js` in `classFile`, checks `requiredApiVersion`
   (semver), loads all `.js` files as strings, extracts `i18n/*.json` and the icon (base64). Returns
   `IParseAppPackageResult { info, files, languageContent, implemented }`
   (`compiler/IParseAppPackageResult.ts`).
2. **Compile / fabricate** — `AppCompiler.toSandBox(manager, storageItem, parseResult)`
   (`compiler/AppCompiler.ts:8`): asks `AppRuntimeManager.startRuntimeForApp()` to **spawn the
   subprocess**, then wraps it in a `ProxiedApp`. (Compilation/bundling itself is done ahead of time;
   the package ships JS. esbuild and the AST tooling — `acorn`/`astring` — are used in the build/parse
   path.) `AppFabricationFulfillment` carries the install result.
3. **Track interfaces** — `AppImplements` (`compiler/AppImplements.ts:5`) records which `AppInterface`
   values the app declares, gating which `execute*` calls the listener manager will route.

### 3.2 Module access restrictions (`compiler/modules/`)

Inside the sandbox, only a curated set of node builtins is exposed (path, url, crypto, buffer, stream,
util, querystring, zlib, and proxy-wrapped net/http/https); `os` is stubbed out. Networking modules
are wrapped in Proxy handlers (`compiler/modules/networking.ts`) to limit surface.

---

## 4. Orchestrator glue (`src/`)

- **`IAppServerOrchestrator`** (`src/IAppServerOrchestrator.ts:10`) — the contract the host
  implements: exposes `getManager()`, `getBridges()`, `getStorage()`, `getAppSourceStorage()`,
  `triggerEvent()`, `getConverters()`, etc.
- **`orchestrator.ts`** — a global `Apps` Proxy plus `registerOrchestrator(orch)`; the host registers
  its concrete orchestrator at startup, decoupling the engine from Rocket.Chat internals.
- **`converters/`** (in `@rocket.chat/apps`, not apps-engine) — the classes that translate between
  core's entity shapes and apps-engine's bespoke `IMessage`/`IRoom`/`IUser`
  (`IAppMessagesConverter`, `IAppRoomsConverter`, `IAppUsersConverter`, …). These exist precisely
  because the SDK types diverge from core — the conversion cost the v2 doc wants to eliminate by
  adopting core-typings.

---

## 5. Takeaways for the v2 discussion

- **Out-of-process is already the model.** Apps run in a Deno (default) or Node subprocess over
  JSON-RPC/msgpack, with liveness-based restart and APP_ID anti-impersonation. v2's "local runtime
  now, designed as if remote is coming" is *already partially true* — the RPC boundary exists.
- **The permission defect is in the bridge `do*` wrappers**: deny ⇒ log + `undefined`, never a thrown
  error. Fixing "permissions insufficient" means changing this single pattern across 34 bridges (or
  the dispatch layer) to reject with a typed error across the RPC boundary.
- **Enforcement is coarse and per-bridge** — already roughly `read`/`write` × entity, matching the v2
  intent; what's missing is propagation of denial, not the granularity.
- **The converter layer is the tax** for bespoke SDK types; adopting core-typings removes it.
- **Every accessor call is an RPC round-trip** (proxy → host → bridge → back). This is why eager
  relationship resolution (`IMessage.sender: IUser`) and `getById`-per-entity reads are expensive, and
  why `*Raw` types and bulk readers exist. A repository/paging model has to be designed against this
  RPC cost.
