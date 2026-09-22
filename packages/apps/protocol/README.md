# `@rocket.chat/apps` — host↔subprocess protocol

The wire format spoken between the host controller (`packages/apps/src/server/runtime/`) and the app
subprocess (`packages/apps/base-runtime/`, run by `node-runtime`).

- **Decisions and rationale:** [ADR 0006](../../../docs/adr/0006-apps-subprocess-protocol.md),
  building on [ADR 0005](../../../docs/adr/0005-ipc-channel-transport.md) for the transport and
  [ADR 0004](../../../docs/adr/0004-in-house-jsonrpc-types-plain-msgpack-envelopes.md) for the
  envelope
- **Delivery plan:** [`docs/proposals/apps-runtime-sdk-ipc`](../../../docs/proposals/apps-runtime-sdk-ipc/README.md)

> **Status: the project is wired, and has one module.** `src/index.ts` is the barrel every module
> under [Layout](#layout) re-exports through. Only `rpc/contract.ts` exists yet. The wire below is what the
> two sides speak today, in `src/server/runtime/` and `base-runtime/`; everything marked ⏳ arrives
> with a PR from the delivery plan.

## Channels

| Channel | Encoding | Carries |
| --- | --- | --- |
| IPC, both directions | V8 structured clone (`serialization: 'advanced'`) | JSON-RPC objects, plus the bare `_zPING` and `_zPONG` strings |
| stdout and stderr (app → host) | unstructured text | subprocess logs, which the host forwards to its own console |

The subprocess is spawned as `stdio: ['ignore', 'pipe', 'pipe', 'ipc']`. Node owns framing, ordering
and backpressure, so a malformed message cannot desync the channel.

Two rules ride on the serializer rather than on a codec:

- **No method may rely on passing a function.** Structured clone throws on one, so every message goes
  through `sanitizeForIpc` before the send, which replaces functions, symbols and `App` instances
  with `undefined`. `Buffer`, `Date`, `RegExp`, `Error`, `Map`, `Set`, shared references and cycles
  all survive.
- **Secure fields are resolved on receive, not on decode.** An object carrying the `'@@SecureFields'`
  marker can sit at any depth of a message, so the subprocess walks each incoming message and applies
  the fields its app has permission for. The host never resolves them.

Any message on the channel — not just `_zPONG` — counts as liveness host-side.

## Surface

```text
HOST ──request──▶ APP
  app:construct | initialize | setStatus | getStatus | onEnable | onDisable |
      onInstall | onUninstall | onUpdate | onSettingUpdated | onPreSettingUpdate
  app:{check*|execute*}                       ~70 listeners; params [context],
                                              except the *PostMessageDeleted pair, [message, context]
  app:execute{BlockAction|ViewSubmit|ViewClosed|ActionButton|LivechatBlockAction}Handler
  app:executePreFileUpload                    [{ file, path }]
  api:call                                 ⏳ [{ path, httpMethod, requestData, endpointInfo }]
  slashcommand:{execute|preview|executePreviewItem}
                                           ⏳ [{ command, … }]
  scheduler:run                            ⏳ [{ processorId, jobContext }]
  videoconference:{generateUrl|customizeUrl|isFullyConfigured|onNewVideoConference|
      onVideoConferenceChanged|onUserJoin|getVideoConferenceInfo}
                                           ⏳ [{ provider, … }]
  outboundCommunication:{getProviderMetadata|sendOutboundMessage}
                                           ⏳ [{ provider, … }]
  _zPING                                      bare string, liveness (10s, 1s timeout, 4 misses → restart)

APP ──request──▶ HOST
  bridges:{getXBridge}:{do*}                  152 methods over 29 bridges — the only app-originated
                                              request category

APP ──notification──▶ HOST
  ready | log | unhandledRejection | uncaughtException

APP ──out-of-band──▶ HOST
  _zPONG                                      bare string

RESPONSES
  app → host   success { id, result: { value, logs? } }   error { id, error: { code, message, data? } }
  host → app   success { id, result: <value> }            error { id, error: { code, message, data? } }

EVERY MESSAGE
  meta?                                       an open bag of out-of-band values, carried and never
                                              read by the bridge — the HTTP-headers analogue
```

### Method-name grammar

Method names are a **closed set**. Variable segments — command names, API paths, provider ids,
processor ids — live in `params`, never in the name, so nothing app-supplied is interpolated into a
dispatch key. (`api:call` also folds `httpMethod` into params, because an API path may itself contain
`:`.) `bridges:{getXBridge}:{do*}` is exempt: both segments are already closed sets, so it is a
template in syntax only.

⏳ The exact member names for the five flattened families are fixed in PR 4.

### Direction asymmetries

Two, both deliberate:

- **Only app→host responses carry the `{ value, logs? }` envelope.** Host→app responses carry the raw
  value. Only the subprocess produces app logs.
- **Only app→host params are validated.** The subprocess is untrusted, and its payloads are ids and
  scalars — cheap to check. Host→app payloads are hydrated domain objects, self-sent, and covered by
  types alone.

### Caller identity

⏳ The app id **never crosses the wire**. Each bridge contract entry carries a typed invoker that
calls the real bridge method with the connection-known app id supplied by the host. Where an appId is
genuinely an app-supplied *argument* rather than caller identity — `ModerationBridge.doReport`,
`doDismissReportsBy*`, `UserBridge.doDeleteUsersCreatedByApp` — the invoker forwards it from the wire,
and that is visible in the entry.

## Layout

Only `rpc/contract.ts` exists yet. The tree is the target, and where each piece lives today is under
it.

```text
src/
├── serialization/  the two jobs the codec used to do
│   ├── sanitizer.ts    strips functions and App instances before a send
│   └── secureFields.ts the marker, the descriptor and the mapper — the walk
│                       that reads them stays in base-runtime, which is where
│                       the app permissions are
├── framing/
│   ├── control.ts  _zPING / _zPONG + isControlFrame                     (zero deps)
│   ├── jsonrpc.ts  envelopes, factories, guards — moved from src/lib
│   └── errors.ts   closed code enum + declared data shapes
├── rpc/
│   └── contract.ts request(), notification(), type<T>(), shaped<T>() — Zod, host only
└── contracts/
    ├── methods.ts  closed host→app method set, kind, arity
    └── bridges/
        ├── names.ts    plain string constants — both sides value-import
        └── schemas.ts  TypeBox — host value-imports, runtime `import type` only
```

Three pieces are written and live elsewhere. The JSON-RPC envelope is in
`packages/apps/src/lib/jsonrpc.ts`, which ADR 0004 wrote and which `base-runtime` reads through a
shim that re-exports the host's compiled `dist` — moving it here is what retires that shim. The
sanitizer is in `packages/apps/src/lib/IpcSanitizer.ts`, and the secure-fields marker in
`packages/apps/src/lib/SecureFields.ts`; `base-runtime` value-imports both straight from that same
compiled `dist`.

Constraints on what may live here:

- **This project builds first**, so it cannot import `AppBridges`. The invoker table binding the wire
  to the host's bridges lives in `src/server/runtime/`, not here.
- **`schemas.ts` is `import type`-only from the runtime.** Not a hard constraint: the subprocess
  resolves `node_modules` the way the host does. It is a weight choice. The subprocess validates
  nothing, because AJV runs host-side, so TypeBox would buy it nothing and cost it start-up time.

Everything here compiles `strict: true`, unlike the host and `base-runtime`.
