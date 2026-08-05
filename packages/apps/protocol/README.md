# `@rocket.chat/apps` — host↔subprocess protocol

The wire format spoken between the host controller (`packages/apps/src/server/runtime/`) and the app
subprocess (`packages/apps/base-runtime/`, run by `deno-runtime` or `node-runtime`).

- **Decisions and rationale:** [ADR 0002](../../../docs/adr/0002-apps-subprocess-protocol.md)
- **Delivery plan:** [`docs/proposals/apps-runtime-sdk-ipc`](../../../docs/proposals/apps-runtime-sdk-ipc/README.md)

> **Status: being built.** This directory currently holds only the zero-dependency framing constants.
> The sketch below is the target surface; sections marked ⏳ are not implemented yet.

## Channels

| Channel | Encoding | Carries |
| --- | --- | --- |
| stdin (host → app) | msgpack | JSON-RPC objects, plus the bare `_zPING` string |
| stdout (app → host) | msgpack | JSON-RPC objects, plus the bare `_zPONG` string |
| stderr (app → host) | NDJSON, plus unstructured text | `{ pid, queueSize }` on each ping; anything unparseable is a log line |

Three msgpack extension types are part of the contract: `0` drops functions (and `App` instances) to
`undefined`, `1` round-trips `Buffer` (copied, because msgpack reuses the backing `Uint8Array`), and
`2` carries secure fields. **No method may rely on passing a function** — ext 0 silently drops it.

Any decoded message — not just `_zPONG` — counts as liveness host-side.

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
  { pid, queueSize }                          NDJSON on stderr

RESPONSES
  app → host   success { id, result: { value, logs? } }   error { id, error: { code, message, data? } }
  host → app   success { id, result: <value> }            error { id, error: { code, message, data? } }
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

```text
src/
├── codec/          msgpack + the three extension types, factory-based   ⏳
│   └── secureFields.ts
├── framing/
│   ├── control.ts  _zPING / _zPONG + isControlFrame                     (zero deps)
│   ├── jsonrpc.ts  buildRequest / parseFrame / envelope                 ⏳
│   ├── errors.ts   closed code enum + declared data shapes              ⏳
│   └── metrics.ts  { pid, queueSize }, NDJSON
└── contracts/
    ├── methods.ts  closed host→app method set, kind, arity              ⏳
    └── bridges/
        ├── names.ts    plain string constants — both sides value-import
        └── schemas.ts  TypeBox — host value-imports, runtime `import type` only    ⏳
```

Two constraints on what may live here:

- **This project builds first**, so it cannot import `AppBridges`. The invoker table binding the wire
  to the host's bridges lives in `src/server/runtime/`, not here.
- **`schemas.ts` must never be value-imported by the runtime.** TypeBox is not vendored into
  `.deno-cache`, and Deno runs `--cached-only`. `import type` erases at compile time; a value import
  breaks every subprocess spawn.

Everything here compiles `strict: true`, unlike the host and `base-runtime`.
