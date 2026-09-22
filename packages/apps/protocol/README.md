# `@rocket.chat/apps` — host↔subprocess protocol

The wire format spoken between the host controller (`packages/apps/src/server/runtime/`) and the app
subprocess (`packages/apps/base-runtime/`, run by `node-runtime`), and the contract that declares
every app→host call.

- **Decisions and rationale:** [ADR 0006](../../../docs/adr/0006-apps-subprocess-protocol.md),
  building on [ADR 0005](../../../docs/adr/0005-ipc-channel-transport.md) for the transport and
  [ADR 0004](../../../docs/adr/0004-in-house-jsonrpc-types-plain-msgpack-envelopes.md) for the
  envelope
- **App→host contract:** ADR 0006, decisions 18–23
- **Design detail and delivery plan:**
  [`docs/proposals/apps-runtime-sdk-ipc`](../../../docs/proposals/apps-runtime-sdk-ipc/README.md)

> **Status: the project is wired, and has one module.** Only `rpc/contract.ts` exists: the
> `request`, `notification`, `type<T>` and `shaped<T>` builders, without the `errors` field. The
> wire below is what the two sides speak today, in `src/server/runtime/` and `base-runtime/`.
> Everything marked ⏳ arrives with a PR from the delivery plan.

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
  today   bridges:{getXBridge}:{do*}          positional params with an 'APP_ID' sentinel;
                                              reaches 152 methods over 29 bridges
  ⏳      {domain}.{procedure}                one named object as params; 122 procedures
                                              over 21 domains, declared in the contract

APP ──notification──▶ HOST
  today   ready | log | unhandledRejection | uncaughtException
  ⏳      runtime.{ready|log|unhandledRejection|uncaughtException}

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
`:`.)

- **Host→app** keeps the `{category}:{member}` grammar of ADR 0006 decision 9. ⏳ The exact member
  names for the five flattened families are fixed in PR 10.
- **App→host** uses ⏳ the dotted procedure path of the contract, for example `message.addReaction`.
  The wire method is the path verbatim. The host looks it up in one map and never splits it. The
  `bridges:{getXBridge}:{do*}` exemption goes away.

### Direction asymmetries

Two, both deliberate:

- **Only app→host responses carry the `{ value, logs? }` envelope.** Host→app responses carry the raw
  value. Only the subprocess produces app logs.
- **Only app→host params are validated.** The subprocess is untrusted, and its payloads are ids and
  scalars — cheap to check. ⏳ The host validates them with Zod `safeParse` against the contract.
  Host→app payloads, and the outputs and error `data` of the contract, are self-sent and covered by
  types alone.

### Caller identity

⏳ The app id **never crosses the wire**. The controller builds one `HostContext` per subprocess, and
each handler takes the caller identity from `ctx.appId`. The `'APP_ID'` sentinel goes away.

- **No input schema declares a field named `appId`.** Every input is a `z.strictObject`, so an
  `appId` key in `params` fails validation with `-32602`.
- **An app id that the app supplies as an argument is a `targetAppId` field.** This applies to the
  three `moderation` procedures and to `user.deleteUsersCreatedByApp`. The capability is then
  explicit in the contract.
- **A nested app id is added by the handler.** For example, `http.call` spreads `ctx.appId` into the
  request object.

## The app→host contract

⏳ `contracts/hostContract/` declares each procedure explicitly. The host implements the contract, and
the subprocess calls it through a client typed from the contract. A bridge method with no procedure
cannot be reached. The [delivery plan](../../../docs/proposals/apps-runtime-sdk-ipc/README.md) has the
full design and a worked example.

```ts
export const message = {
	addReaction: request({
		input: z.strictObject({ messageId: z.string(), userId: z.string(), reaction: ReactionSchema }),
		output: type<void>(),
	}),
};
```

- **A procedure has a path, a kind, an input schema and an output type.** `request(…)` expects a
  response. `notification(…)` does not, and its output is `void`.
- **The input is one named object, closed with `z.strictObject`.** `request` and `notification`
  throw at module load on any other schema.
- **`type<T>()` is a phantom.** It carries the output type and has no runtime content.
- **`shaped<T>()` checks a domain object only on the fields that the call depends on**, and types it
  as the full Apps-Engine interface. The converters validate the rest. A field that the host uses
  for routing, for an authorization decision or in a query must be listed.
- **⏳ A procedure can declare errors**, each with a name and a `data` type. The handler throws
  `errors.NAME(data)`, and the client narrows with `isProcedureError(e, path, name)`.

### Paths and field names

The first migration derives every path and every field from the bridge method by one rule:

- **The domain** is the getter name without `get` and `Bridge`, in camelCase: `getLivechatBridge` →
  `livechat`, `getOAuthAppsBridge` → `oauthApps`.
- **The procedure** is the method name without `do`, in camelCase: `doAddReaction` →
  `message.addReaction`.
- **A field** has the name of the bridge method parameter. An optional parameter becomes an
  optional field. The caller-identity `appId` parameter has no field.

Two methods get a corrected name: `doGetByid` → `oauthApps.getById`, and
`do_fetchLivechatRoomMessages` → `livechat.fetchLivechatRoomMessages`.

### Error codes

⏳ `dispatch` maps each thrown error to one wire code. `call` runs one procedure and throws; it knows
nothing about JSON-RPC.

| Thrown error | Code | `data` |
| --- | --- | --- |
| unknown path | `-32601` | the path |
| request sent as a notification, or the reverse | `-32600` | — |
| `InputError` | `-32602` | the Zod issues |
| `ProcedureError` (a declared error) | `-32001` | `{ name, data }` |
| an error with `code === -32070` | `-32070` | passes through |
| anything else | `-32000` | the ADR 0006 decision 6 shape |

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
│   ├── contract.ts request(), notification(), type<T>(), shaped<T>()   — Zod, host only
│   ├── errors.ts   ProcedureError, isProcedureError()                  — zero deps
│   ├── server.ts   implement(), Handlers<>, middleware, call(), dispatch() — Zod, host only
│   ├── local.ts    createLocalClient()                                 — Zod, tests only
│   └── client.ts   createClient(), Client<>                            — zero deps, runtime
└── contracts/
    ├── methods.ts  closed host→app method set, kind, arity
    └── hostContract/
        ├── index.ts    hostContract and type HostContract
        ├── shared.ts   Ref and other small reusable schemas
        └── <domain>.ts one module per domain: message, room, livechat, runtime, …
```

Three pieces are written and live elsewhere. The JSON-RPC envelope is in
`packages/apps/src/lib/jsonrpc.ts`, which ADR 0004 wrote and which `base-runtime` reads through a
shim that re-exports the host's compiled `dist` — moving it here is what retires that shim. The
sanitizer is in `packages/apps/src/lib/IpcSanitizer.ts`, and the secure-fields marker in
`packages/apps/src/lib/SecureFields.ts`; `base-runtime` value-imports both straight from that same
compiled `dist`.

Two pieces of the design live outside this project:

| Piece | Location |
| --- | --- |
| The implementation — one handler per procedure, plus middleware | `src/server/runtime/hostContract/` |
| The client instance that the accessors call | `base-runtime/src/lib/host.ts` |

Constraints on what may live here:

- **This project builds first**, so it cannot import `AppBridges`. The contract knows nothing about
  bridges. The handlers that bind a procedure to a bridge method live in `src/server/runtime/`.
- **Zod stays out of the subprocess.** `base-runtime` imports the contract with `import type` only,
  and imports `rpc/client.ts` by its subpath, not through the `src/index.ts` barrel. `rpc/client.ts`
  and `rpc/errors.ts` must not import Zod, `rpc/server.ts` or the contract values.
- **Host behavior stays out of the contract.** Restart suppression and debug logs are middleware in
  the implementation, not procedure metadata.

Everything here compiles `strict: true`, unlike the host and `base-runtime`. So the contract can
state `IMessage | undefined` where the bridge signature says `Promise<IMessage>`.
