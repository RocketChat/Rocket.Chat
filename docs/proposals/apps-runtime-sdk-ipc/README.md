# Plan: a Runtime SDK for the Apps-Engine subprocess IPC protocol

## Summary

The controller in `packages/apps/src/server/runtime/` and the app subprocess in
`packages/apps/base-runtime/` talk to each other over an **implicit** JSON-RPC-ish protocol. Method
names are strings assembled by string interpolation (`` `slashcommand:${command}:${method}` ``,
`` `accessor:${namespace}:${prop}` ``, …) and dispatched by splitting on `:` and reading positional
`params[0]`, `params[1]`, … with `as`-casts. There is no single place that declares which methods
exist, what their parameters are, or what they return. Both sides re-derive that knowledge by parsing
strings and guessing argument positions.

This document catalogs **every** message variation that can cross the boundary today, in both
directions, with its payload shape and semantics, and proposes a **Runtime SDK**: a single package
that declares each method explicitly as a typed contract, formats/parses the JSON-RPC frames itself
(no `jsonrpc-lite`), and can generate a machine-readable reference so both sides — and contract
tests — share one source of truth.

The catalog is anchored to PR #41171 (`chore(apps): consolidate accessor implementation to
runtime`), whose design doc lives next to this one at
[`../apps-accessor-consolidation/README.md`](../apps-accessor-consolidation/README.md). That work
**removes the entire `accessor:*` message category** from the transport, collapsing the app→host
surface to `bridges:*` plus a handful of notifications. The SDK is designed around that end state:
`accessor:*` is documented here as **legacy / being removed**, and the SDK's canonical app→host
request category is `bridges:*`.

### Goals

- **One declared contract per method** — name, direction, params tuple, result type, error modes.
- **Stronger contract testing at the IPC boundary** — a test can assert "the host, when calling
  `slashcommand:X:executor`, sends exactly these params" against the same schema the runtime parses.
- **Kill positional guessing** — no more `params[0] as SlashCommandContext`.
- **Own the wire format** — a small JSON-RPC 2.0 encoder/decoder replacing `jsonrpc-lite`, including
  the two documented deviations (the raw `_zPING`/`_zPONG` strings and the `{ value, logs }` result
  envelope).
- **Reference generation** — emit JSON Schema / typings from the declarations for docs and
  cross-runtime (Deno) validation.

---

## 1. Transport & framing (below JSON-RPC)

Before any method semantics, three framing facts constrain the SDK:

| Concern | Detail | Source |
| --- | --- | --- |
| **Wire encoding** | **MessagePack**, not newline-delimited JSON. Host uses `@msgpack/msgpack` `Encoder`/`Decoder` (`src/server/runtime/base/codec.ts`); runtime uses its own matching codec (`base-runtime/src/lib/codec.ts`). Both register three `ExtensionCodec` types. | `codec.ts` (both sides) |
| **Channels** | Host → app: the child process **stdin**. App → host: the child process **stdout**. Both are `Encoder.encode`d msgpack streamed and consumed with `decodeStream`. | `ProcessMessenger.strategySend`, `stdoutTransport`, `parseStdout` |
| **Out-of-band metrics** | App → host **stderr** carries plain JSON `{ pid, queueSize }` (NOT msgpack, NOT JSON-RPC). Host `parseError` tries `JSON.parse`; anything unparseable is treated as a log line. | `metricsCollector.ts`, `BaseRuntimeSubprocessController.parseError` |

The three msgpack extension types (identical numbering on both sides) are themselves part of the
contract:

| Ext type | Name | Encodes | Decodes to |
| --- | --- | --- | --- |
| `0` | `FUNCTION_DISABLER_EXT` | any `function` (and, runtime-side, an `App` instance) | `undefined` — functions are silently dropped across the wire |
| `1` | `BUFFER_HANDLER_EXT` | `Buffer` | `Buffer` (copied, because msgpack reuses the backing `Uint8Array`) |
| `2` | `SECURE_FIELDS_HANDLER_EXT` | host-side: objects carrying secure fields (marked so the runtime re-applies `applySecureFields` on decode) | runtime-side: object with secure-field semantics restored |

> **SDK implication.** The SDK's encode/decode must be pluggable over this msgpack+extensions codec,
> not assume JSON. "Format JSON-RPC messages properly" here means *produce the JSON-RPC 2.0 object
> shape*; the byte framing stays msgpack. Functions in params are not transportable — the schema for
> any method must never declare a function-typed field as meaningful.

---

## 2. The JSON-RPC dialect

Messages (other than the raw ping/pong strings) are JSON-RPC 2.0 objects produced today by
`jsonrpc-lite`. The SDK must reproduce this shape exactly. There are **five** object types and
**two** non-JSON-RPC control strings.

### 2.1 Object types

| Type | Shape | Notes |
| --- | --- | --- |
| **request** | `{ jsonrpc: "2.0", id, method, params }` | `id` = `Math.random().toString(36).slice(2)` on both sides. `params` is always an **array** (positional) in practice, sometimes omitted. |
| **notification** | `{ jsonrpc: "2.0", method, params }` | No `id`; no response expected. |
| **success** | `{ jsonrpc: "2.0", id, result }` | See §2.2 for the result envelope. |
| **error** | `{ jsonrpc: "2.0", id, error: { code, message, data? } }` | See §2.3. |
| **invalid** | parse/validation failure | Host and runtime both special-case this. |

### 2.2 The result envelope (a deviation worth pinning)

App→host responses do **not** put the raw return value in `result`. `Messenger.successResponse`
wraps it:

```
result = { value: <actual return value>, logs?: <ILoggerStorageEntry> }
```

The host unwraps it in `handleResultMessage`: `result = payload.result.value`, and if `logs` is
present it is persisted via `logStorage.storeEntries`. **The `logs` side-channel piggybacks on every
result.** The SDK must model the envelope as a first-class thing, not leak `{ value, logs }` into
method return types.

Host→app app-directed handlers (in `mainLoop.requestRouter`) return the value directly and it is
wrapped the same way by `successResponse`.

### 2.3 Error object & error codes

Errors carry a numeric `code`, a `message`, and optional `data`. The `data.logs` field is the same
log side-channel as success. Observed / reserved codes:

| Code | Meaning | Where |
| --- | --- | --- |
| `-32700` | Parse error | `sendParseError` |
| `-32600` | Invalid request | `sendInvalidRequestError` (e.g. notifications are rejected: "We're not handling notifications at the moment") |
| `-32601` | Method not found | `mainLoop` unknown prefix; `handleApp` unknown method; `JSONRPC_METHOD_NOT_FOUND` const on host |
| `-32602` | Invalid params | `sendInvalidParamsError`, many handlers via `JsonRpcError.invalidParams` |
| `-32603` | Internal error | `JsonRpcError.internalError` |
| `-32000` | Generic app/bridge error | most handler `catch` blocks; host `handleBridgeMessage` wraps thrown bridge errors as `-32000` |
| `1000` | Accessor/bridge dispatch failure on host | `handleIncomingMessage` catch for `accessor:`/`bridges:` |
| `AppsEngineException.JSONRPC_ERROR_CODE` | App threw a framework exception; `data.name` carries the exception name | listener & upload handlers |

`handleApp` also maps thrown `Error`s by inspecting `error.cause`: `'invalid_param_type'` →
`invalidParams`, `'invalid_app'` → `internalError({ message: 'App unavailable' })`.

### 2.4 Non-JSON-RPC control strings

| String | Direction | Meaning | Not JSON-RPC because… |
| --- | --- | --- | --- |
| `_zPING` | Host → app | Liveness probe | Deliberately a bare string to avoid per-heartbeat object encoding overhead (see `LivenessManager.ping` comment). Emitted every `pingIntervalInMS` (10s), timeout 1s, 4 consecutive misses → restart. |
| `_zPONG` | App → host | Liveness reply | App also sends metrics via stderr on each ping. Host `parseStdout` short-circuits `_zPONG` before JSON-RPC parsing and emits `pong`. |

Any decoded message that is not a `_zPONG` also emits a `heartbeat` event host-side — i.e. **any**
traffic counts as liveness.

> **SDK implication.** The codec must treat these two strings as a distinct "control frame" variant
> and never attempt JSON-RPC parsing on them.

---

## 3. Message catalog — Direction A: Host → App

All host→app requests originate from `ProxiedApp.call(method, args)` →
`sendRequest({ method: \`app:${method}\`, params: args })`, or from a manager that builds a
non-`app:` method string directly. The runtime's `mainLoop.requestRouter` splits on the **first** `:`
to pick a handler by prefix.

Handler prefixes (`base-runtime/src/mainLoop.ts`): `app`, `api`, `slashcommand`, `videoconference`,
`outboundCommunication`, `scheduler`, `ping`. Unknown prefix → `-32601`.

### 3.1 `app:*` — lifecycle

Dispatched by `handlers/app/handler.ts` on the second segment.

| Method | Params (positional) | Result | Handler |
| --- | --- | --- | --- |
| `app:construct` | `[appPackage: IParseAppPackageResult]` | `true` | `construct.ts` — evals the app source, instantiates the App class, registers it |
| `app:initialize` | `[]` | `true` | injects `ConfigurationExtend`, `EnvironmentRead` |
| `app:setStatus` | `[status: AppStatus]` | `null` | validates against `AppStatus` enum |
| `app:getStatus` | `[]` | `AppStatus` | special-cased **before** logging (no logs generated) |
| `app:onEnable` | `[]` | `boolean` | injects `EnvironmentRead`, `ConfigurationModify` |
| `app:onDisable` | `[]` | `true` | injects `ConfigurationModify` |
| `app:onInstall` | `[context]` | `true` | injects `reader, http, persistence, modifier` |
| `app:onUninstall` | `[context]` | `true` | same injection set |
| `app:onUpdate` | `[context]` | `true` | same injection set |
| `app:onSettingUpdated` | `[setting]` | `true` | injects `ConfigurationModify, reader, http` |
| `app:onPreSettingUpdate` | `[setting]` | `object` (the modified setting) | injects `ConfigurationModify, reader, http` |

### 3.2 `app:*` — listeners (`check*` / `execute*`)

`handler.ts` routes any `appMethod` starting with `check` or `execute` (that isn't an upload/uikit
method) to `handlers/listener/handler.ts`. The full method set is the `AppMethod` enum in
`packages/apps-engine/src/definition/metadata/AppMethod.ts` (the `check*`/`execute*` members),
corresponding to the `AppInterface` enum. Examples: `app:checkPreMessageSentPrevent`,
`app:executePostMessageSent`, `app:executePostRoomUserJoined`, `app:executePostLivechatRoomClosed`,
`app:executePostUserStatusChanged`, … (≈70 members).

**Params & injection are computed by arity/name rules in `listener/handler.ts::parseArgs`, not per
method** — this is exactly the "guessing" the SDK should replace. The current rules:

- `params` length must be 1 or 2, else `-32602`.
- `param1` = event context; `param2` = optional extra context.
- Name-based context hydration: names containing `Message` → hydrate `IMessage` (and nested
  `room`); `…RoomUserJoined`/`…RoomUserLeave` → hydrate `context.room`; names containing `PreRoom` →
  wrap context as a `Room`.
- Injected accessor tail, by category:
  - `check*` → `(context, reader, http)`  *(+`extraContext` for `checkPostMessageDeleted`)*
  - `*Extend` → `(context, extender, reader, http, persistence)` (`MessageExtender`/`RoomExtender`)
  - `*Modify` → `(context, builder, reader, http, persistence)` (`MessageBuilder`/`RoomBuilder`)
  - otherwise → `(context, reader, http, persistence, modifier)`  *(+extra msg for
    `executePostMessageDeleted`)*

Return type is event-specific (`boolean` for `*Prevent`/`check*`, `void`/modified object for others).

### 3.3 `app:*` — UIKit interactions

`handler.ts` routes the five `uikitInteractions` to `handlers/uikit/handler.ts`.

| Method | Params | Context class built | Injection |
| --- | --- | --- | --- |
| `app:executeBlockActionHandler` | `[IUIKitBlockIncomingInteraction]` | `UIKitBlockInteractionContext` | `reader, http, persistence, modifier` |
| `app:executeViewSubmitHandler` | `[IUIKitViewSubmitIncomingInteraction]` | `UIKitViewSubmitInteractionContext` | same |
| `app:executeViewClosedHandler` | `[IUIKitViewCloseIncomingInteraction]` | `UIKitViewCloseInteractionContext` | same |
| `app:executeActionButtonHandler` | `[IUIKitActionButtonIncomingInteraction]` | `UIKitActionButtonInteractionContext` | same |
| `app:executeLivechatBlockActionHandler` | `[IUIKitLivechatBlockIncomingInteraction]` | `UIKitLivechatBlockInteractionContext` | same |

Result: a UIKit interaction response object. Missing method → `-32601`; non-array/empty params →
`-32602`.

### 3.4 `app:*` — upload events

`handlers/app/handleUploadEvents.ts`, set `uploadEvents = ['executePreFileUpload']`.

| Method | Params | Notes |
| --- | --- | --- |
| `app:executePreFileUpload` | `[{ file: IUploadDetails, path: string }]` | Handler reads `path` from disk, builds `IFileUploadContext { file, content: Buffer }`, injects `reader, http, persistence, modifier`. Validates `file` (needs `rid` + `userId`/`visitorToken`) and `path` (string) → `-32602`. |

### 3.5 Provider / registration-keyed methods (non-`app:` prefixes)

These come straight from managers, not `ProxiedApp.call`:

| Method template | Params | Origin (host) | Handler (runtime) |
| --- | --- | --- | --- |
| `slashcommand:{command}:executor` | `[SlashCommandContext-shape]` | `AppSlashCommand` (`params: [...runContextArgs, context]`) | `slashcommand-handler.ts`; injects `reader, modifier, http, persistence` |
| `slashcommand:{command}:previewer` | `[context]` | same | returns a preview |
| `slashcommand:{command}:executePreviewItem` | `[previewItem, context]` | same | |
| `api:{path}:{get\|post\|put\|delete\|head\|options\|patch}` | `[requestData, endpointInfo]` | `AppApi` | `api-handler.ts`; looks up `api:{path}` in `AppObjectRegistry`, injects `reader, modifier, http, persistence`. **Path may contain `:`** (path params) — handler pops the HTTP method, re-joins the rest. |
| `videoconference:{provider}:{method}` | `[videoconf?, user?, options?]` (compacted) | `AppVideoConfProvider` | `videoconference-handler.ts`; method ∈ `generateUrl, customizeUrl, isFullyConfigured, onNewVideoConference, onVideoConferenceChanged, onUserJoin, getVideoConferenceInfo` |
| `outboundCommunication:{provider}:{method}` | provider-specific args | `AppOutboundCommunicationProvider` | `outboundcomms-handler.ts`; method ∈ `getProviderMetadata, sendOutboundMessage` |
| `scheduler:{processorId}` | `[jobContext]` | `AppSchedulerManager` | `scheduler-handler.ts`; injects `reader, modifier, http, persistence` |
| `ping` | `[]` | *(reserved; the JSON-RPC `ping` prefix exists in the router but liveness uses the raw `_zPING`)* | resolves `'pong'` |

---

## 4. Message catalog — Direction B: App → Host

The app originates two request categories (`accessor:*`, `bridges:*`) and four notifications, plus
`_zPONG`. Host entry point: `BaseRuntimeSubprocessController.handleIncomingMessage`.

### 4.1 `accessor:*` — **LEGACY, being removed by PR #41171**

Generated by `AppAccessors.proxify()` in `base-runtime/src/lib/accessors/mod.ts` as
`` `accessor:${namespace}:${prop}` `` with the app's positional call args as `params`. Host resolves
them by **walking real accessor objects** in `handleAccessorMessage` (split after the 9-char
`accessor:` prefix; first segment = manager origin, last = tail method, middle = intermediary
getters).

Allowed manager origins (`ALLOWED_ACCESSOR_METHODS`): `getConfigurationExtend`, `getEnvironmentRead`,
`getEnvironmentWrite`, `getConfigurationModify`, `getReader`, `getPersistence`, `getHttp`,
`getModifier`. Namespaces currently emitted:

- `getEnvironmentRead:{getSettings|getServerSettings|getEnvironmentVariables}:{prop}`
- `getEnvironmentWrite:{getSettings|getServerSettings}:{prop}`
- `getConfigurationModify:{slashCommands|scheduler|serverSettings}:{prop}`
- `getConfigurationExtend:{ui|settings|externalComponents|api|scheduler|videoConfProviders|outboundCommunication|slashCommands}:{prop}`
- `getReader:{getMessageReader|getPersistenceReader|getRoomReader|getUserReader|getLivechatReader|getUploadReader|getCloudWorkspaceReader|getVideoConferenceReader|getOAuthAppsReader|getThreadReader|getRoleReader|getContactReader|getExperimentalReader}:{prop}`
- `getReader:getEnvironmentReader:{getSettings|getServerSettings|getEnvironmentVariables}:{prop}`
- `getModifier:{getDeleter|getUiController|getScheduler|getOAuthAppsModifier|getModerationModifier}:{prop}`
- `getModifier:getUpdater:{target}:{prop}`, `getModifier:getCreator:{sub}:{prop}` (see ModifyUpdater/ModifyCreator)
- `getPersistence:{prop}`
- `accessor:api:listApis` — **special**, handled directly by the host (`api.listApis(appId)`), the
  only non-request-walked accessor method.

Special host behaviors: during `restarting`, `getConfigurationExtend` accessor calls are **swallowed**
(return `null`) to avoid double-registration. Invalid origin → thrown → `code 1000`.

> The SDK should model `accessor:*` only as a **legacy compatibility layer** with a clear "removed
> in vNext" marker, since #41171 deletes `handleAccessorMessage` and folds these into `bridges:*`
> and local runtime logic.

### 4.2 `bridges:*` — the canonical app→host request category

Generated as `` `bridges:{bridgeName}:{doMethod}` `` (see `Notifier`, `Http`, `ModifyCreator`,
`ModifyUpdater`, `ModifyExtender`, `roomFactory`). Host `handleBridgeMessage` (generic dispatch):

1. splits after `bridges:` into `[bridgeName, bridgeMethod]`;
2. requires `this.bridges[bridgeName]` to be a **function** (a getter like `getMessageBridge`);
3. requires `bridgeMethod` to **start with `do`** and `params` to be an array;
4. maps any param equal to the literal string `'APP_ID'` to the real app id (**anti-impersonation**,
   see §6) before calling;
5. thrown bridge errors → `-32000` with the message; result wrapped as `{ value }`.

**The full bridge surface is therefore every `do*` method on every bridge getter** exposed by
`AppBridges` — **28 bridges, ~112 `do*` methods**. Bridge getters:

`getApiBridge, getAppActivationBridge, getAppDetailChangesBridge, getCloudWorkspaceBridge,
getCommandBridge, getContactBridge, getEmailBridge, getEnvironmentalVariableBridge,
getExperimentalBridge, getHttpBridge, getInternalBridge, getInternalFederationBridge,
getListenerBridge, getLivechatBridge, getMessageBridge, getModerationBridge, getOAuthAppsBridge,
getOutboundMessageBridge, getPersistenceBridge, getRoleBridge, getRoomBridge, getSchedulerBridge,
getServerSettingBridge, getThreadBridge, getUiInteractionBridge, getUploadBridge, getUserBridge,
getVideoConferenceBridge`.

Currently emitted by the runtime (the subset that will grow as `accessor:*` migrates):

| Method | Params | Caller |
| --- | --- | --- |
| `bridges:getMessageBridge:doCreate` | `[messageData, appId]` | `ModifyCreator` |
| `bridges:getMessageBridge:doGetById` | `[id, appId]` | Updater/Extender |
| `bridges:getMessageBridge:doUpdate` | `[message, appId]` | Updater/Extender |
| `bridges:getMessageBridge:doNotifyUser` | `[user, message, appId]` | `Notifier` |
| `bridges:getMessageBridge:doNotifyRoom` | `[room, message, appId]` | `Notifier` |
| `bridges:getMessageBridge:doTyping` | `[{...options, isTyping}, appId]` | `Notifier` |
| `bridges:getUserBridge:doGetAppUser` | `[appId]` | `Notifier`, `ModifyCreator` |
| `bridges:getUserBridge:doCreate` | `[userData, appId]` | `ModifyCreator` |
| `bridges:getRoomBridge:doCreate` | `[room, members, appId]` | `ModifyCreator` |
| `bridges:getRoomBridge:doCreateDiscussion` | `[room, parentMessage, reply, members, appId]` | `ModifyCreator` |
| `bridges:getRoomBridge:doGetById` | `[id, appId]` | Updater/Extender |
| `bridges:getRoomBridge:doUpdate` | `[room, members, appId]` | Updater/Extender |
| `bridges:getLivechatBridge:doCreateMessage` | `[message, appId]` | `ModifyCreator` |
| `bridges:getVideoConferenceBridge:doCreate` | `[call, appId]` | `ModifyCreator` |
| `bridges:getVideoConferenceBridge:doGetById` / `doUpdate` | `[…, appId]` | Extender/Updater |
| `bridges:getInternalBridge:doGetUsernamesOfRoomById` | `[roomId]` | `roomFactory` |
| `bridges:getHttpBridge:doCall` | `[{ appId, method, url, request }]` | `Http` |

*(The authoritative, machine-readable list should be generated from the bridge classes in
`src/server/bridges/*.ts` — see §7.)*

### 4.3 Notifications (app → host, no response)

Handled in `handleIncomingMessage`'s `switch`:

| Method | Params | Effect |
| --- | --- | --- |
| `ready` | `[]` | Emitted once at `startMainLoop` start; host resolves `waitUntil​Ready` and marks state `ready`. |
| `log` | `RpcParams` (logger payload) | Host logs `SUBPROCESS LOG`. Emitted via `Messenger.log`. |
| `unhandledRejection` | error payload | Host persists as an app log under `runtime:unhandledRejection`. |
| `uncaughtException` | error payload | Host persists under `runtime:uncaughtException`. |
| *(unknown)* | — | `console.warn('Unrecognized method from sub process')` |

Note: the runtime's own `mainLoop` **rejects inbound notifications** with `-32600` (it only sends
them). Notifications are strictly app→host in practice.

### 4.4 Responses (both directions)

Either side answers a request with success `{ id, result: { value, logs? } }` or error
`{ id, error: { code, message, data?: { logs? } } }` (§2.2–2.3). The app's response path is
`Messenger.successResponse`/`errorResponse`; the host's is `jsonrpc.success`/`jsonrpc.error` inside
the accessor/bridge handlers.

---

## 5. Direction summary (the whole surface on one page)

```
HOST  ──request──▶  APP
  app:construct|initialize|setStatus|getStatus|onEnable|onDisable|onInstall|
      onUninstall|onUpdate|onSettingUpdated|onPreSettingUpdate
  app:{check*|execute*}            (≈70 listener events, arity-based injection)
  app:execute{Block|View…}Handler  (5 UIKit)
  app:executePreFileUpload         (upload)
  slashcommand:{cmd}:{executor|previewer|executePreviewItem}
  api:{path}:{httpMethod}
  videoconference:{provider}:{method}
  outboundCommunication:{provider}:{method}
  scheduler:{processorId}
  _zPING                           (raw string, liveness)

APP  ──request──▶  HOST
  bridges:{getXBridge}:{do*}       (28 bridges, ~112 methods) ← canonical
  accessor:{origin}:…:{prop}       ← LEGACY, removed by #41171

APP  ──notification──▶  HOST
  ready | log | unhandledRejection | uncaughtException

APP  ──control/oob──▶  HOST
  _zPONG                           (raw string)
  {pid,queueSize}                  (JSON over stderr, not JSON-RPC)

BOTH ──response──▶
  success { id, result: { value, logs? } }
  error   { id, error: { code, message, data?: { logs? } } }
```

---

## 6. Cross-cutting conventions the SDK must encode

1. **`APP_ID` placeholder.** App→host bridge params use the literal string `'APP_ID'` where the app
   id belongs; the host substitutes the real id (`handleBridgeMessage`). The SDK should expose this
   as a typed sentinel, not a magic string, and normalize it in one place. (#41171 extends this rule;
   see [`../apps-accessor-consolidation/base-runtime-app-id-exceptions.md`](../apps-accessor-consolidation/base-runtime-app-id-exceptions.md).)
2. **The `{ value, logs }` result envelope** and **`error.data.logs`** log side-channel — model once.
3. **Functions are dropped on the wire** (ext type 0) — no method contract may rely on passing a
   function.
4. **`Buffer`** survives (ext type 1); **secure fields** (ext type 2) are re-hydrated app-side.
5. **`id` generation** is `Math.random().toString(36).slice(2)` on both sides — the SDK owns id
   allocation and response correlation (today the host uses an `EventEmitter` `result:${id}`; the
   runtime uses `RPCResponseObserver` `response:${id}`).
6. **Method-name grammar is `:`-delimited** with a variable number of segments, and some segments
   (api paths, command names) may themselves contain characters that collide with the delimiter —
   `api-handler` already has to `pop()` then re-`join(':')`. The SDK should define parse rules per
   method family rather than a naive global split.

---

## 7. Proposed SDK shape

A new workspace package (working name `@rocket.chat/apps-runtime-protocol`) consumed by **both** the
host controller (`src/server/runtime`) and every runtime adapter (`base-runtime`, `node-runtime`,
`deno-runtime`). Deno consumes it as TS source through the existing import map, exactly like
`base-runtime` (so: TS source, no runtime-only npm deps that Deno can't resolve).

### 7.1 Layers

1. **Codec layer** — the msgpack encode/decode + the three extension types + the `_zPING`/`_zPONG`
   control-frame variant. Replaces the duplicated `codec.ts` on both sides.
2. **JSON-RPC layer** — a tiny, dependency-free builder/parser that produces exactly the objects in
   §2 (`request`, `notification`, `success`, `error`) and the `{ value, logs }` envelope. **This is
   the piece that replaces `jsonrpc-lite`.** ~150 LOC; see §8 for why owning it is easy.
3. **Contract layer** — one declaration per method: `{ name-pattern, direction, params schema,
   result schema, error codes }`. Grouped by family (`app`, `listener`, `uikit`, `upload`,
   `slashcommand`, `api`, `videoconference`, `outboundCommunication`, `scheduler`, `bridges`,
   `notifications`, `control`).
4. **Dispatcher/router layer** — replaces the string-splitting in `mainLoop.requestRouter`,
   `handler.ts`, `handleAccessorMessage`, `handleBridgeMessage` with a table keyed by the contract,
   giving validated, typed `params`.

### 7.2 What "declares each method explicitly" looks like

Two viable styles; recommend **schema-first with inferred types** (option A) so validation and types
come from one declaration:

```ts
// contract/app.ts  (illustrative)
export const AppConstruct = defineMethod({
  method: 'app:construct',
  direction: 'host->app',
  params: z.tuple([ParseAppPackageResult]),
  result: z.literal(true),
});

export const SlashCommandExecutor = defineMethod({
  // template method: the SDK knows how to build/parse `slashcommand:{command}:executor`
  method: template`slashcommand:${'command'}:executor`,
  direction: 'host->app',
  params: z.tuple([SlashCommandContextPayload]),
  result: z.unknown(),
});

export const MessageBridgeDoCreate = defineMethod({
  method: template`bridges:getMessageBridge:doCreate`,
  direction: 'app->host',
  params: z.tuple([MessageData, AppIdSentinel]),
  result: MessageId,
});
```

`defineMethod` yields: a typed `build(params)` → JSON-RPC object, a `parse(msg)` → validated params,
the response envelope helpers, and a JSON-Schema export for reference/codegen.

### 7.3 Migration order (keeps both suites green)

1. Land codec + JSON-RPC layers, swap `jsonrpc-lite`/`codec.ts` usages behind the SDK with identical
   output (byte-for-byte and object-shape compatible). Pure refactor, no protocol change.
2. Declare the **host→app** contracts (they're the most positional-guess-heavy) and route
   `mainLoop`/`handler.ts` through them.
3. Declare **`bridges:*`** by generating from `src/server/bridges/*.ts` (see below).
4. Mark **`accessor:*`** legacy; delete alongside #41171.

---

## 8. Library recommendations

### 8.1 Replacing `jsonrpc-lite` — no library needed

`jsonrpc-lite` only builds/parses the five object shapes. We already deviate from it (`{ value,
logs }`, raw ping/pong). Owning ~150 LOC in the JSON-RPC layer removes a dependency, removes the
`IParsedObject*` type gymnastics currently threaded through both sides, and lets the envelope/error
conventions be first-class. **Recommendation: drop `jsonrpc-lite`, hand-roll the JSON-RPC layer.**

### 8.2 Schema + type-inference + reference generation

The core requirement is: *declare once, get (a) a TS type, (b) a runtime validator, (c) a
machine-readable reference*.

| Option | In monorepo? | Type inference | JSON-Schema output | Verdict |
| --- | --- | --- | --- | --- |
| **Zod v4** (`~4.3.6`) | ✅ (`core-typings`, `apps/meteor`) | ✅ `z.infer` | ✅ **native `z.toJSONSchema()`** (new in v4 — no extra dep) | **Recommended.** Already vendored, first-class in the codebase, and v4 folds in what used to need `zod-to-json-schema`. One declaration → type + validator + JSON Schema. |
| **@sinclair/typebox** (`0.34.x`) | ⚠️ transitive only (via other deps), not a direct dep | ✅ `Static<>` | ✅ **schemas *are* JSON Schema** | Strong technical fit (JSON Schema is the native representation, great for the reference artifact + AJV validation), and extremely fast. Cost: introduce it as a direct dependency and align the transitive version. Good alternative if we want the reference to literally be JSON Schema with zero conversion. |
| **AJV** (`^8.20.0`) | ✅ (`http-router`, `livechat`, `media-signaling`) | ❌ (validation only) | consumes JSON Schema | Pair with TypeBox (or with `z.toJSONSchema` output) as the **fast validator in hot paths** if Zod's own parse becomes a per-message cost concern. Optional. |

**Recommendation:** **Zod v4** for the contract declarations (types + validation + `z.toJSONSchema`
for the reference). It is already a first-class monorepo dependency, so nothing new to introduce.
If profiling shows per-message validation cost matters on the hot bridge path, compile the emitted
JSON Schema with the already-present **AJV** for those methods. Keep **TypeBox** in mind as the
fallback only if we decide the canonical artifact must be raw JSON Schema authored directly.

Deno note: Zod ships as ESM and resolves fine through the import map (same mechanism `base-runtime`
already uses); AJV's `eval`-based codegen is best kept on the **host** side only, not inside the Deno
sandbox.

### 8.3 Generating the `bridges:*` reference from the bridge classes

The 112 `do*` methods already have TypeScript signatures in `src/server/bridges/*.ts`. Rather than
re-typing them, generate the contract/JSON-Schema from those declarations with
**`ts-json-schema-generator`** or **`ts-morph`** (both introducible dev-deps; `ts-morph` is the more
flexible for walking `do*` methods and emitting a contract table). This keeps the bridge contract in
lockstep with the actual bridge implementations. Run it as a `turbo` codegen step; commit the output
so contract tests diff against it.

### 8.4 Contract testing

With schemas in hand: a boundary test feeds recorded/real host calls through the runtime's parser and
asserts the params validate against the same schema the host used to build them — catching arity and
type drift at the exact seam described in §3–§4. `z.toJSONSchema` output doubles as a fixture other
languages/tools (Deno, external app SDKs) can validate against.

---

## 9. Open questions

1. **Notification direction.** The router rejects inbound notifications (`-32600`) but the design
   could legitimately want host→app notifications later (e.g. cancellation). Lock current behavior in
   the contract or leave room?
2. **`ping` prefix vs `_zPING`.** The JSON-RPC `ping` handler exists but liveness uses the raw
   string. Should the SDK keep both, or formally retire the JSON-RPC `ping`?
3. **Method-name grammar for `api:` paths** containing `:` — codify the pop/rejoin rule as the
   contract's parse function.
4. **How far to model `accessor:*`** given #41171 deletes it — recommend: document + a deprecation
   shim only, no new investment.
5. **Result envelope everywhere?** The host comment asks "should we make sure all result messages
   have logs?" — the SDK is the natural place to make the envelope invariant.
