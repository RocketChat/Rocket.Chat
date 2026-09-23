# ADR 0006 — The host↔subprocess protocol is owned by `packages/apps/protocol`

## Status

**Accepted — not yet implemented.** The decisions live here; the proposal in
`docs/proposals/apps-runtime-sdk-ipc` is reduced to the delivery plan.

- **Date:** 2026-09
- **Scope:** `packages/apps` (host, `base-runtime`, `node-runtime`) plus one import
  site in `apps/meteor`
- **Follows:** [ADR 0001](./0001-app-accessor-logic-in-base-runtime.md), whose follow-up 5
  ("consolidated host↔subprocess protocol/SDK") this ADR answers
- **Builds on:** [ADR 0004](./0004-in-house-jsonrpc-types-plain-msgpack-envelopes.md), which
  replaced `jsonrpc-lite` with in-house types in `packages/apps/src/lib/jsonrpc.ts`. That module is
  the JSON-RPC surface this ADR relocates into `protocol/`; decisions 4 and 6 start from it rather
  than from a library
- **Builds on:** [ADR 0005](./0005-ipc-channel-transport.md), which put the protocol on Node's IPC
  channel. `protocol/` therefore owns the two serialization passes that the transport needs — a
  sanitizer and a secure-fields walk

## Decision

### Purpose

1. **The problem being solved is cross-runtime drift, not ergonomics.** Two independently maintained
   halves of one wire format have already diverged (see *Context*). Contract testing is the
   mechanism; type safety is a by-product. "Own the wire format" and "generate a reference" are
   explicitly **not** drivers.

### Placement

2. **No new workspace package.** A new directory `packages/apps/protocol/` becomes a **fourth
   sibling tsc project** alongside `src`, `base-runtime/src`, and `node-runtime/src`: its own
   `tsconfig.json` → own `dist`, own `build:protocol` / `typecheck:protocol`, **built first**.
   - Rejected: living in `base-runtime` — the host would have to import `base-runtime/dist` before
     it is built, inverting build order.
   - Rejected: living in `src/` — `base-runtime` would go on importing the host's compiled `dist`,
     which is the coupling decisions 3 and 4 exist to remove.
   - It is the only placement where the contract can compile **`strict: true`** (host and
     `base-runtime` are both `strict: false`).
   - **Packaging is the one config change.** `package.json`'s `files` lists `dist/`,
     `base-runtime/` and `node-runtime/`; `protocol/` joins that list, and `build` and `typecheck`
     gain a `:protocol` step ahead of the other three.

### Serialization

3. **Both serialization modules move wholesale into `protocol/`.** `src/lib/SecureFields.ts` becomes
   `protocol/src/serialization/secureFields.ts` and `src/lib/IpcSanitizer.ts` becomes
   `protocol/src/serialization/sanitizer.ts`. The Meteor call site
   (`apps/meteor/app/apps/server/converters/codecs/rooms.ts`, which uses `secureFieldsMapper`) is
   updated. No re-export shim.
   - Both are shared by construction, which is what makes `protocol/` their home. `sanitizeForIpc`
     runs on every message before every send, on both sides; the secure-fields marker is written by
     the host and read by the subprocess.
   - Their consumer is the transport itself. The sanitizer runs before `send()`, and the subprocess
     applies the marked fields by walking each incoming message —
     [ADR 0005](./0005-ipc-channel-transport.md), decisions 3 and 4.
   - **The walk itself stays in `base-runtime`.** `applySecureFieldsDeep` needs the app's
     permissions, which only the subprocess holds. `protocol/` owns the marker, the descriptor and
     the mapper.
   - This deletes two of the three value imports `base-runtime` makes of the host's compiled `dist`;
     decision 4 deletes the third.

### Framing

4. **`protocol/` owns the JSON-RPC surface, and that surface already exists.** ADR 0004 put the
   envelope types, the factories, and the type guards in `packages/apps/src/lib/jsonrpc.ts`, with
   `meta` on all four envelopes. This ADR **moves that module** to `protocol/framing/jsonrpc.ts`
   unchanged in behavior, and deletes `base-runtime/src/lib/jsonrpc.ts`, the shim that re-exports it
   from the host's compiled `dist`. The ~25 importing modules follow the new path.
   - The move is what the API ownership was for. ADR 0004 already removed the reasons to wrap the
     surface: nothing delegates to a library, and the structural sites test types this repository
     owns — `instanceof JsonRpcError` in process, `isErrorObject` on a decoded payload — so no
     `isProtocolError` brand has to be invented to insulate a later swap.
   - It also deletes the third value import of the host's `dist` (see decision 3 and *Context*).
     `jsonrpc.ts` is a **value** import, so it is the one that makes the coupling load-bearing:
     `build:base-runtime` cannot typecheck, and no subprocess can start, until `build:default` has
     emitted `dist/lib/jsonrpc.js`.
   - The move dates ADR 0004's reference index, which points at `packages/apps/src/lib/jsonrpc.ts`.
     The PR that moves the module updates that entry; nothing else in ADR 0004 changes, because the
     types, the factories, the guards, and the measured pipeline are the same code at a new path.
5. **The result envelope is asymmetric, and that is deliberate.** App→host responses carry
   `result: { value, logs? }`; host→app responses carry the raw value. Only the subprocess produces
   app logs, and the responses to app→host procedure calls are the hot direction — wrapping them
   would add an allocation and an extra object per accessor call for a field that can never be
   populated. The **envelope**
   is invariant on app→host; the **`logs` field** stays conditional on `logger.hasEntries()`.
6. **The error taxonomy is a closed enum owned by `protocol/`**: the five standard JSON-RPC codes,
   plus `-32070` (`AppsEngineException.JSONRPC_ERROR_CODE`, unchanged — defined in `apps-engine` and
   the only code with a live consumer), plus `-32000` for "handler or bridge threw", plus `-32001`
   for a declared procedure error (decision 20).
   - Half of this exists. `src/lib/jsonrpc.ts` already exports the five standard codes and
     `SERVER_ERROR` as named constants, and `JsonRpcError` already carries the matching static
     factories. What this decision adds is `-32070`, `-32001`, the retirement of `1000`, the
     declared `data` shapes below, and the closing of the set — the codes are loose constants today,
     so nothing stops a call site writing a number.
   - **Code `1000` is retired.** It currently marks structural bridge-dispatch failures; those split
     into `-32601` (unknown procedure) and `-32602` (input fails its schema). Zero risk — nothing
     reads inbound error codes today.
   - **`error.data` becomes a declared shape per code**, never a raw `Error`, and `logs` is a fixed
     field of it rather than a property mutated onto whatever `data` happens to be. For `-32001` the
     shape is `{ name, data }`.
   - **The enum holds codes, not error names.** The names of the declared errors live in the
     contract, with the procedure that throws them.
7. **Request-vs-notification is a property of each procedure, set by its builder.** `request(…)`
   declares a procedure that expects a response; `notification(…)` declares one that does not, with
   output `void`. The app→host notifications are `runtime.ready`, `runtime.log`,
   `runtime.unhandledRejection` and `runtime.uncaughtException`. No host→app notifications are
   added, so today's behavior is unchanged. Dispatch looks the path up first, so an unknown path
   yields `-32601` and a known path used with the wrong kind yields `-32600`.
8. **`protocol/` owns the control frames.** The JSON-RPC `ping` method is
    deleted (dead — nothing has ever sent it). The `_zPING`/`_zPONG` constants move into `protocol/`
    together with an `isControlFrame()` discriminator, collapsing four independent literal
    definitions into one import. They stay **bare strings**: the bare form avoids a per-heartbeat
    object, and folding them into JSON-RPC would buy nothing.

### Method grammar

9. **The host→app method-name grammar is flattened into a closed set.** Variable segments move into
    params: `'api:call'` with `[{ path, httpMethod, requestData, endpointInfo }]`, `'scheduler:run'`
    with `[{ processorId, jobContext }]`, and likewise for `slashcommand`, `videoconference`, and
    `outboundCommunication`. Safe because there is no version skew (see *Context*).
    - Buys: a finite enum instead of templates; map-lookup dispatch (deleting `requestRouter`'s
      prefix split, `api-handler`'s pop/rejoin, `handleApp`'s second-segment split); `method`
      validatable as an enum at envelope level; and no app-supplied string interpolated into a
      dispatch key.
    - Costs: logs and metrics lose self-describing method names — log `method` plus the discriminant
      param.
    - **App→host methods leave this grammar.** `bridges:{getXBridge}:{do*}` becomes a dotted
      procedure path, `message.addReaction`, sent verbatim as the JSON-RPC `method` (decision 18).
      No app→host method names a bridge.

### Validation and contracts

10. **The subprocess is untrusted, and the validation posture is asymmetric.** `app→host` inputs are
    **always validated host-side, with Zod `safeParse`**; `host→app` is **types-only** plus
    dev/test-only checks. The untrusted direction is also the cheap one (ids and scalars); the
    expensive one (hydrated message + room + user) is self-sent. The validator never loads in the
    subprocess (decision 12).
11. **Schemas are authored in Zod** (`~4.3.6`, the version that `apps/meteor` and `core-typings`
    use). There is no JSON Schema step and no AJV.
    - **One schema library for the apps code.** The converter codecs in
      `apps/meteor/app/apps/server/converters/` and the schemas in `core-typings` already use Zod.
    - **The handler gets a clean copy.** `safeParse` returns a new object with only the declared
      keys.
    - **The speed gap is too small to matter.** An `addReaction` input validates in 17.6 ns with
      compiled AJV and 48.6 ns with Zod `safeParse`, against 1782 ns for the `structuredClone` of the
      same request (see *Context*).
    - **No schema sharing with the converters.** They live in `apps/meteor`, which `protocol/`
      cannot import. The `core-typings` schemas describe Rocket.Chat shapes (`IRoom`); the wire
      carries Apps-Engine shapes (`IAppsRoom`).
12. **Zod never enters the subprocess.** The contract modules in
    `protocol/src/contracts/hostContract/` hold the Zod schemas. The host value-imports them;
    `base-runtime` imports them with `import type` only, so TS erases them. The runtime value-imports
    only the client, `protocol/src/rpc/client.ts`, which has zero dependencies.
    - **The client must not import `rpc/server.ts` or the contract values.** The runtime imports it
      by its subpath, not through the `protocol/` barrel.
    - **There is no `names.ts`.** The client takes its paths from the contract type, so a separate
      list of string constants would repeat the paths a second time.
    - The subprocess resolves `node_modules` the way the host does, so a value import would work.
      What it costs is start-up. Every module the runtime imports is loaded once per app process,
      and the schemas are the largest thing in `protocol/` that the subprocess has no use for.
13. **No codegen.** No ts-morph, no committed generated artifact, no codegen build step. The
    122 procedures are hand-authored and mostly shallow (`string`, `boolean`, `object`).
    - Deep `IMessage`/`IRoom`/`IUser` schemas are **redundant**: `docs/proposals/apps-converters-zod`
      is putting runtime-validated codecs on those same objects one layer down, and a deep IPC
      schema for them would validate the same payload twice.
    - Division of labor: **the IPC contract is the shape of the call** (arity and scalar types,
      shallow, catching injection); **converter codecs are the domain objects**.
    - **`shaped<T>()` expresses that split.** At runtime it is a `z.looseObject` that checks only the
      listed fields and keeps every other field unchanged. At compile time its type is the full
      Apps-Engine interface `T`, and a key that `T` does not have is a compile error. A field that
      the host uses for routing, for an authorization decision or in a database query must be
      listed — for `IMessage`, that means `room.id` and `sender.id`.
    - **`shaped<T>()` does not check a field schema against the field type.**
      `shaped<IMessage>()({ room: z.number() })` compiles. The cast is deliberate, and the review of
      each contract entry must cover it.
14. **Caller identity never crosses the wire.** The `'APP_ID'` sentinel is dropped from app→host
    requests entirely. The controller builds one `HostContext` per subprocess, with `appId` from
    `appPackage.info.id`. Each handler reads the caller identity from `ctx.appId` and passes it to
    the bridge method.
    - This replaces a value match (`params.map(v => v === 'APP_ID' ? realId : v)`) that could not
      distinguish identity from data — an app requesting a role literally named `APP_ID` had its
      argument silently rewritten — and that only reached top-level positional params.
    - All three historical `APP_ID` buckets collapse into one mechanism. **Caller identity** has no
      input field; the handler supplies it. **An app-supplied app id** is a named input field,
      `targetAppId`, so the capability is explicit in the contract (`moderation.report`,
      `moderation.dismissReportsBy*`, `user.deleteUsersCreatedByApp`). **Nested identity** is spread
      in by the handler (`http.call` → `doCall({ ...input, appId: ctx.appId })`), which **closes the
      pre-existing `doCall` impersonation gap** that ADR 0001 recorded as unfixed.
    - **No input schema declares a field named `appId`.** Every input is a `z.strictObject`, so an
      `appId` key in `params` always fails validation with `-32602`.
    - Named fields, not positional params, because identity is not reliably positioned:
      `UserBridge.doCreate(data, appId, options?)`, `doGetAppUser(appId?)`,
      `MessageBridge.doAddReaction(messageId, userId, reaction, appId)`. With a named input object,
      the position problem does not exist.

### Listeners

15. **`protocol/` declares only the listener method set and arity** (`1 | 2`, the
    `*PostMessageDeleted` pair being the 2s). The **injection table** — which accessors each listener
    receives, today decided by substring matching over method names — becomes an explicit per-method
    descriptor **inside `base-runtime`**. Injection never crosses the wire, so it must not live in
    `protocol/`. It lands last, when the contract table can supply the authoritative method set to
    enumerate against.

### Enforcement

16. **Enforcement is types first, tests second, and the contract is the surface.**
    - The implementation is typed with `Handlers<C, Ctx>`, a mapped type over one contract domain.
      A missing handler, an extra handler or a wrong return type is a **compile error** in
      `typecheck:default`.
    - The client's `request` takes a path from the union of request paths in the contract. A wrong
      path, a missing field or a wrong field type is a **compile error** in `typecheck:base-runtime`.
      The `bridgeCall<T>` type arguments and the output casts go away.
    - **Exhaustiveness is checked against the contract, not against `AppBridges`.** A bridge method
      with no procedure is unreachable. Today `handleBridgeMessage` reaches 152 `do*` methods by
      reflection; the accessors emit 122 of them. The other 30 get no procedure. An accessor that
      needs one later adds its procedure in the same PR.
    - Together these subsume a reflection-based drift test
      (`Object.getOwnPropertyNames` + `Function.prototype.length`), which is strictly weaker —
      `Function.prototype.length` under-counts optional params, reporting `doGetAppUser(appId?)` as
      arity 0.
17. **One round-trip contract test, in the host suite, on real traffic.** For each accessor: drive
    the real `base-runtime` class with the existing `createRecordingSender` harness, push each
    emitted `{ method, params }` through **the real send path** — `sanitizeForIpc`, then a
    structured clone — so that function-dropping and `Buffer` survival are exercised rather than
    assumed, then through `dispatch` against stubbed bridges. Assert that the input validates, that
    the stub receives the right arguments, and that identity lands in the right slot.
    - Host suite, because Zod, the bridge classes, and the implementation are all host-side; it
      imports `base-runtime` *source* directly. This inverts ADR 0001's "host imports nothing from
      `base-runtime`" for tests only — `build:default` is untouched.
    - **No committed fixture corpus.** A corpus regenerated alongside the change it was meant to
      catch proves nothing.
    - **The test fails on dead surface.** It compares the contract paths with the emitted paths. A
      contract path that no accessor emits fails the test unless the procedure is on an explicit
      allowlist.
    - **The local client does not replace this test** (decision 23). It passes objects by reference,
      so a `Date` or a class instance survives it and does not survive the wire.

### The app→host contract

18. **`protocol/` declares a contract; the host implements it; the subprocess calls it through a
    client.** `hostContract` is an explicit list of procedures. Each procedure has a dotted path, a
    kind, a Zod input schema, a phantom output type and optional declared errors. This is the
    contract-first model of oRPC (`oc` plus `implement`), built in-house on the JSON-RPC envelope of
    ADR 0004.
    - **The contract knows nothing about bridges**, so `protocol/` still builds first. The handler
      for `message.addReaction` decides which bridge method it calls. The first migration binds one
      procedure to one bridge method; nothing in the contract requires that.
    - **The handler calls the `do*` method**, so the permission checks in the bridge base classes
      stay in force.
    - **`type<T>()` is a phantom.** It carries the output type and has no runtime content. Outputs
      are not validated (decision 10).
    - **The contract compiles `strict: true`.** It can state `IMessage | undefined` where the bridge
      signature says `Promise<IMessage>` but returns `undefined` when a permission check fails.
19. **Paths and field names follow one rule in the first migration**, so a reviewer can map each
    procedure back to one bridge method without a lookup table.
    - **The domain** is the getter name without `get` and `Bridge`, in camelCase:
      `getLivechatBridge` → `livechat`. A leading acronym goes to lower case: `getOAuthAppsBridge` →
      `oauthApps`.
    - **The procedure** is the method name without `do`, in camelCase: `doAddReaction` →
      `message.addReaction`.
    - **A field** has the name of the parameter in the bridge method signature. An optional
      parameter becomes an optional field. The input is always one named object, never a positional
      tuple; a procedure with no input takes `{}`.
    - **Two bridge methods get a corrected name:** `getOAuthAppsBridge:doGetByid` →
      `oauthApps.getById`, and `getLivechatBridge:do_fetchLivechatRoomMessages` →
      `livechat.fetchLivechatRoomMessages`.
    - The rule gives 122 distinct paths for the 122 emitted pairs. A better name than the rule gives
      is a separate change after the migration.
20. **A procedure can declare the errors that its handler throws on purpose.** This is the error map
    of oRPC (`oc.errors({ … })`), on the taxonomy of decision 6.
    - **An error has a name and a phantom `data` type.** The name is unique inside the procedure.
      The host sends it, so it is not validated.
    - **All declared errors share one wire code, `-32001`**, with
      `data: { name: 'ROOM_NOT_FOUND', data: { roomId } }`.
    - **The handler throws with a typed constructor**: `throw errors.ROOM_NOT_FOUND({ roomId })`. A
      name that the procedure does not declare is a compile error.
    - **The client narrows with `isProcedureError(e, path, name)`**, which types `e.data`. A promise
      rejection has no type in TypeScript, so a guard is the only way to type it, and the guard takes
      the contract from a type argument: `createErrorGuard<HostContract>()`. The client rebuilds a
      `-32001` response as a `ProcedureError`.
    - **The first migration declares no errors.** Each bridge method keeps its current contract, for
      example `message.create` keeps `output: type<string | undefined>()`. A move from `undefined`
      to a declared error changes what the accessor sees, so it is a separate change per procedure.
21. **`implement` flattens the contract once, at module load, into a `Map` keyed by the dotted
    path.** It throws on a duplicate path. The dispatcher never splits the method string, never
    resolves a bridge by name and never looks up a method on a bridge instance. The implementation
    has two entry points:
    - **`call(path, params, ctx)`** runs one procedure — lookup, `safeParse`, middleware, handler —
      and throws on every failure. It knows nothing about JSON-RPC.
    - **`dispatch(message, ctx)`** converts between the envelope and `call`. It checks the kind,
      because the kind is a property of the envelope, and maps every failure to a code in one place:

      | Thrown error | Code | `data` |
      | --- | --- | --- |
      | `UnknownProcedureError` | `-32601` | the path |
      | `InputError` | `-32602` | the Zod issues |
      | `ProcedureError` (a declared error) | `-32001` | `{ name, data }` |
      | an error with `code === -32070` | `-32070` | passes through |
      | anything else | `-32000` | the decision 6 shape |

    - `handleBridgeMessage`, the `bridges:` prefix check and the `switch` over notification names in
      `handleIncomingMessage` go. The controller calls `dispatch` and sends what it returns.
22. **Host behavior that applies to many procedures is middleware, in the implementation.** The
    signature follows oRPC: `({ ctx, path, procedure, input, next }) => Promise<unknown>`, with
    `input` already validated.
    - **A middleware applies at one of three levels**: every procedure
      (`implement(contract, handlers, { use: [m] })`), one domain (`use(m, domainHandlers)`) or one
      procedure (`use(m, handler)`). They run in that order, then the handler.
    - **A middleware can skip the handler** by returning without a call to `next`. It **cannot
      change `ctx`**; each handler is one line, so a narrowed context gains nothing.
    - **Restart suppression becomes `skipWhileRestarting`**, declared on each of the eight
      registration handlers. It replaces `AppResourceBridge.REGISTRATION_METHODS`, so the guarded set
      is visible on the handlers. **Debug logs** move to a middleware at the `implement` level.
    - **Host behavior never goes in the contract.** No procedure meta such as
      `{ skipWhileRestarting: true }`.
23. **The client is a path function, and a local client shares its type.**
    - `base-runtime/src/lib/host.ts` builds a `HostClient` with `createClient<HostContract>(sender)`.
      Accessors take a `HostClient` instead of `senderFn`, and call
      `this.host.request('message.addReaction', { messageId, userId, reaction })`. The client is not
      a `Proxy`. `formatErrorResponse` moves into the client.
    - `createRecordingSender` wraps the transport under the client, so the existing tests keep their
      shape.
    - **`createLocalClient(implementation, ctx)`** calls `call` in the same process, as oRPC's
      `createRouterClient` does. It runs validation, middleware and the handler, and skips only the
      envelope, the serialization and the transport. An accessor test can then run the real
      accessors against the real handlers. It lives in `rpc/local.ts`, and only tests import it.

## End state

`packages/apps/protocol/` is a `strict: true` tsc project that both the host controller and every
runtime adapter import. Zod is its one runtime dependency, and only host-side modules load it. It
owns the two serialization passes, the control frames, the JSON-RPC envelope and error taxonomy, the
closed host→app method set, the RPC machinery, and the app→host contract. The host owns the
implementation of that contract: the binding from each procedure to its own bridges, and the
middleware. `base-runtime` owns accessor injection, the secure-fields walk, and the client instance.

`base-runtime` imports nothing from the host project. `lib/jsonrpc.ts` is gone, and
`lib/messenger.ts` and `lib/secureFields.ts` take the sanitizer and the marker from `protocol/`,
which is built before both. The `'APP_ID'` string does not appear on the wire, in `base-runtime`, or
in the host. `handleBridgeMessage`, `bridgeCall`, `BridgeName` and `REGISTRATION_METHODS` are gone,
and the 30 `do*` methods with no procedure are unreachable from the subprocess.

## Architecture

### Layout

```text
packages/apps/protocol/            # 4th tsc project, strict: true, built first
├── src/
│   ├── serialization/             # the two passes the transport needs              (D3)
│   │   ├── sanitizer.ts           # strips functions and App instances before a send
│   │   └── secureFields.ts        # the marker, the descriptor and the mapper
│   ├── framing/
│   │   ├── control.ts             # _zPING / _zPONG + isControlFrame             (zero deps, D8)
│   │   ├── jsonrpc.ts             # envelopes, factories, guards — moved from src/lib    (D4)
│   │   └── errors.ts              # closed code enum + declared data shapes              (D6)
│   ├── rpc/
│   │   ├── contract.ts            # request, notification, type<T>, shaped<T>   — Zod, host only
│   │   ├── errors.ts              # ProcedureError, createErrorGuard             (zero deps, D20)
│   │   ├── server.ts              # implement, Handlers<>, middleware, call, dispatch — host only
│   │   ├── local.ts               # createLocalClient                           — tests only (D23)
│   │   └── client.ts              # createClient, Client<>             (zero deps, runtime, D23)
│   └── contracts/
│       ├── methods.ts             # closed host→app method set + kind + arity    (D7, D9, D15)
│       └── hostContract/          # the app→host contract, one module per domain    (D18, D19)
│           ├── index.ts           # hostContract and type HostContract
│           ├── shared.ts          # Ref and other small reusable schemas
│           └── message.ts, room.ts, …
└── README.md                      # the one-page surface sketch

packages/apps/src/server/runtime/
└── hostContract/                  # the implementation — host-only, references AppBridges (D14, D16)
    ├── index.ts                   # hostImplementation = implement(hostContract, { … })
    ├── context.ts                 # HostContext
    └── message.ts, room.ts, …     # one Handlers<> object per domain

packages/apps/base-runtime/src/lib/
└── host.ts                        # the HostClient instance the accessors use                (D23)
```

The implementation cannot live in `protocol/`: `protocol/` is built first and so cannot import
`AppBridges`. That is the correct seam anyway — `protocol/` declares the wire, and a host declares
how the wire binds to *its* bridges.

### A procedure, end to end

```ts
// protocol/src/contracts/hostContract/message.ts — the contract
const MessageInput = shaped<IMessage>()({ room: Ref, sender: Ref });

export const message = {
	create: request({
		input: z.strictObject({ message: MessageInput }),
		output: type<string | undefined>(), // undefined when the app lacks message.write
	}),
	addReaction: request({
		input: z.strictObject({ messageId: z.string(), userId: z.string(), reaction: ReactionSchema }),
		output: type<void>(),
	}),
};

// src/server/runtime/hostContract/message.ts — the implementation
export const messageHandlers: Handlers<HostContract['message'], HostContext> = {
	create: ({ ctx, input }) => ctx.bridges.getMessageBridge().doCreate(input.message, ctx.appId),
	addReaction: ({ ctx, input }) =>
		ctx.bridges.getMessageBridge().doAddReaction(input.messageId, input.userId, input.reaction, ctx.appId),
};

// base-runtime/src/lib/accessors/modify/ModifyCreator.ts — the caller
const createdMessageId = await this.host.request('message.create', { message: result });
```

```js
// on the wire, app → host, then host → app
{ jsonrpc: '2.0', id: 'k3', method: 'message.create', params: { message: { room: { id: 'GENERAL', … }, … } } }
{ jsonrpc: '2.0', id: 'k3', result: 'x8Fq2…' }
```

The worked example in `docs/proposals/apps-runtime-sdk-ipc` follows this procedure through every
file.

### Surface being covered

- **App→host, emitted today:** 122 `(bridge, method)` pairs across 21 bridges, called from 39 files
  in `base-runtime/src`. The largest domains are `livechat` (22), `room` (18), `appResource` (15),
  `user` (12) and `message` (9). Each gets one procedure.
- **App→host, reachable today but not emitted:** 30 of the **152 `public do*` declarations** across
  **27 bridge classes**, reachable through **28 `AppBridges` getters plus `AppResourceBridge`**. They
  get no procedure.
- **App→host notifications:** `runtime.ready`, `runtime.log`, `runtime.unhandledRejection`,
  `runtime.uncaughtException`; and `_zPONG`, which stays a bare control frame.

### Validation posture

| Direction | Input | Rationale |
| --- | --- | --- |
| `app → host` (procedures) | **Always validated**, host-side, Zod `safeParse` on a `z.strictObject` | Untrusted source; payloads are ids and scalars, so validation is cheap |
| `host → app` (`app:*`, `api:call`, …) | **Types only**, plus dev/test-only checks | Self-sent; payloads are hydrated domain objects, so validation is expensive and redundant |

## Deviations from JSON-RPC 2.0

Deliberate, and recorded here so they are not "cleaned up" later.

1. **`result: { value, logs? }`** on app→host responses — a per-request log record rides the
   response so it is atomic with resolution. A separate notification would race the `result:${id}`
   emit.
2. **`_zPING` / `_zPONG` are bare strings**, not JSON-RPC objects — avoids per-heartbeat object
   encoding.
3. **Notifications are answered with an error.** The spec says notifications get no response ever;
   the runtime replies `-32600`. Given no version skew, an unexpected notification is unambiguously
   our own bug, so failing loudly beats dropping silently.
4. **`-32070`** sits outside the implementation-defined `-32000..-32099` server range. It is defined
   in `apps-engine` and consumed by `ProxiedApp.call`; renumbering it is not ours to do.

Named `params` (decision 19) and `-32001` (decision 20) are not deviations. JSON-RPC 2.0 allows
`params` as an object, and `-32001` is inside the server range.

## Rejected alternatives

- **An invoker table keyed by `'getXBridge:doY'`, exhaustive over `AppBridges`.** The key is still a bridge getter plus a bridge method, so the bridge class shape
  stays the wire shape. The exhaustiveness check keeps all 152 `do*` methods reachable by design,
  including host-internal ones such as `getAppActivationBridge:doActionsChanged`, which has no
  permission check. `names.ts` repeats the bridge names and gives the runtime no input or output
  type, so `bridgeCall<T>` keeps its casts.
- **TypeBox with AJV.** It avoids a conversion step and a JSON Schema draft mismatch, which exist
  only if Zod feeds AJV. Its speed gain over Zod is too small to matter (decision 11). It adds TypeBox as a new direct dependency next to the Zod that the apps code already
  uses.
- **A router defined in the host, typed by `typeof appRouter`** (the tRPC model). The inferred
  outputs copy the bridge signatures, which are wrong when a permission check fails.
  `typecheck:base-runtime` would depend on the host's emitted `.d.ts`. It works in one direction
  only: the same model for host→app needs the host to import `base-runtime` types, which ADR 0001
  forbids.
- **The `@trpc/server` / `@trpc/client` libraries.** tRPC documents `strict: true` as a requirement,
  and it has its own wire format and error model, which would replace the ADR 0004 envelope.
- **The oRPC libraries** (`@orpc/contract` and `@orpc/server`, 1.15.3). `strict: false` and the
  JSON-RPC envelope do not block them. They are rejected because `@orpc/server` pulls 10 `@orpc/*`
  packages, including HTTP and serverless adapters; it has no notification kind, no closed-input
  check and no `shaped<T>()`; a validation failure must be converted from `ORPCError('BAD_REQUEST')`
  to `-32602`; `tsc` fails with `skipLibCheck: false`; and a 1.x library with announced v2 changes
  puts all 122 handlers on its upgrade path.
- **The oRPC implementer tree** (`implement(contract).$context<Ctx>()`, then `.use().handler()` on
  each leaf). A missing handler gives a long `Lazyable<Procedure<…>>` error. `Handlers<>` gives the
  same checks with a shorter error.
- **A `Proxy` client** (`host.message.addReaction(input)`). It is sugar, and it can come later
  without a wire change.

## Consequences

- **Output types are written by hand.** Each of the 122 procedures declares a `type<T>()`. The host
  compiler checks every handler against it, so a wrong declaration fails `typecheck:default`.
- **Nullability is not checked at the use sites yet.** The contract compiles `strict: true`, but the
  host and `base-runtime` compile `strict: false`, and both erase `| undefined` when they read the
  contract types. Each side gains the check when it moves to `strict`.
- **`protocol/` gains a type dependency on `@rocket.chat/apps-engine`.** `packages/apps` already
  depends on it, and the imports are type-only. The `definition/*` subpaths compile in `protocol/`
  under `strict: true`, with `skipLibCheck` on and off.
- **Declared errors add type complexity.** A procedure without an error map must cost nothing in
  `Handlers<>`, the `errors` constructors and `isProcedureError`.
- **The output type does not describe what survives the wire.** The sanitizer drops functions and
  `App` instances, and structured clone drops class prototypes. So the client types an output as
  `Wire<T>`, a mapped type that removes function members, instead of `T`.
- **Each domain migrates on both sides in one PR.** A procedure takes a named object; the legacy
  path takes a positional array with `'APP_ID'`. No version skew makes this safe.
- **The legacy fallback keeps today's exposure until it is deleted, and no longer.** While domains
  migrate, the reflection path still serves every `bridges:*` method. The PR that deletes it is the
  point where the surface shrinks from 152 methods to the declared set, and it must be the last step
  of the app→host work.

## Follow-ups

Out of scope here; unblocked or motivated by this work.

1. ~~**Replace `jsonrpc-lite`**~~ — **done.** Recorded in
   [ADR 0004](./0004-in-house-jsonrpc-types-plain-msgpack-envelopes.md), which also carries the
   benchmark this ADR asked for as the acceptance criterion: build 3,200x, receive 12.1x,
   round-trip 11.0x.
2. ~~**A top-level `meta` property on the envelope**~~ — **done**, in the same work. All four
   envelope types carry an optional `meta`, and every factory and messenger descriptor threads it
   through. `logs` has **not** moved into it; it still rides `result.logs` and `error.data.logs`, so
   decision 5's envelope and decision 6's declared `data` shapes are unaffected.
3. **Move the envelope tuple up to the messenger.** Inherited from ADR 0004, which left it open and
   unmeasured: encode `[kind, id, method, params]` in the messenger itself rather than as a named
   object. It belongs to `protocol/` once `protocol/` owns the framing, and it is a wire-format
   change, so decision 9's no-version-skew licence covers it. It needs a fresh motive first: the
   size gain behind it was measured against an encoding the transport no longer uses.
4. **Preserve error codes into app code.** `mainLoop.handleResponse` currently reconstructs
   `new Error(payload.error.message)`, discarding `code` and `data`, so no app can distinguish a
   permission denial from a bridge throw. Until this lands, only the accessors in `base-runtime` can
   read declared errors (decision 20). Restoring that is an app-observable behavior change with its
   own design question (do we expose typed accessor errors?), so it is deliberately not smuggled
   into this work.
5. **Host→app cancellation.** The host times out requests (`waitForResponse` with
   `getRuntimeTimeout()`), but the subprocess keeps executing the app method with no way to be told
   to stop. Decision 7 leaves room for this without reserving a method; the hard part is aborting
   app code that runs via `new Function` in the runtime's own realm.
6. **`ProxiedApp.call`'s range check** is `e.code >= -32999 || e.code <= -32000`, an `||` where `&&`
   was meant — it matches every number, so every non-`-32070`/`-32601` error is logged and
   swallowed and `call()` resolves `undefined`. Cosmetic in effect, but it should be either fixed or
   deliberately documented as "log everything".
7. **Host→app on the same machinery.** A host→app contract, `AppContract`, in `protocol/`,
   implemented by `base-runtime` and called by the host, would replace the method-string dispatch
   on the subprocess side too. It needs decision 9's flattened method set first. The contract model
   makes it possible without either side importing the other.
8. **Declared errors and better names, one procedure at a time.** A move from an `undefined` output
   to a declared error, and a rename such as `uid` → `userId` in `user.getUserUnreadMessageCount`,
   each change what one side sees. Each is a separate change after the migration.

## Context

### The drift is not hypothetical

The cost was paid once already, and the evidence is now in the history rather than in the tree. The
two `codec.ts` files — one in the host, one in `base-runtime` — were **complementary halves of one
format**, not duplicates. The host's ext 0 guarded functions; the runtime's guarded functions *or*
`App` instances. Ext 2 encoded for real on the host and returned `undefined` on decode; the runtime
did the mirror image. Neither side could round-trip its own output.

The gap was still widening while this ADR waited. Each half needed a second codec instance for the
nested ext-2 pass and reasoned about it alone: the host pooled encoders per subprocess, because
`new Encoder()` allocates a 2 KiB buffer and never shrinks it; the runtime deliberately did not pool
its decoder, because `new Decoder()` allocates nothing and a pooled one would keep a view of the
whole outer frame reachable. Both conclusions were right for their half. Neither was written down
where the other half could read it.

[ADR 0005](./0005-ipc-channel-transport.md) deleted both files with the transport switch. That
settles the instance without settling the class. The host and the subprocess are still two
independently maintained halves of one wire format, and the goal is still to make that kind of
divergence impossible to introduce. What replaced the codec is two modules of exactly the same kind
— a sanitizer and a secure-fields walk, each shared by both halves — which is why decision 3 moves
them first.

Related, and deleted by decisions 3 and 4: `base-runtime/src/lib/secureFields.ts`,
`base-runtime/src/lib/messenger.ts` and `base-runtime/src/lib/jsonrpc.ts` all **value**-import
`@rocket.chat/apps/dist/`, so the runtime half cannot typecheck until the host half has been built.
`jsonrpc.ts` arrived with ADR 0004 as the cheapest way to give both sides one copy of the envelope
types, which is the same need `protocol/` exists to serve properly. Two type-only imports of `dist`
also remain (`roomFactory.ts`, `handlers/app/construct.ts`); TypeScript erases those, so they cost
nothing at runtime.

### No version skew

The subprocess is spawned from the installed `packages/apps`, and `node-runtime` ships inside it.
**The wire format is not a compatibility surface.** This is what licenses decision 9 (flattening
method names), decision 18 (dotted procedure paths) and decision 6 (retiring code `1000`) to be
single-commit changes.

### Facts that shaped specific decisions

- **`data: <Error>` does not transmit what the sender meant.** Both `handleApp` (`:110`, `:121`) and
  `handleBridgeMessage` pass a raw `Error` as `data` today. Structured clone carries an `Error`
  through its own path, so it keeps `name`, `message` and `stack` — and drops every *other* own
  property, including the `logs` that the sender mutated onto that same object. The shape changed
  with the transport; it did not become useful. Hence decision 6's declared `data` shapes.
- **Code `1000` is still live post-consolidation.** `handleIncomingMessage` wraps anything
  `handleBridgeMessage` throws — unknown bridge, non-`do` method, non-array params — as `1000`, a
  real distinction from `-32000` ("the bridge method threw") that is badly encoded.
- **Inbound error codes are unobservable to apps** (see follow-up 4), which is why retiring `1000`
  carries no risk.
- **`AppsEngineException.JSONRPC_ERROR_CODE` is `-32070`** and does not overlap `-32000`. The
  proposal's claim that the codes overlapped was wrong.
- **The JSON-RPC `ping` handler is unreachable.** Nothing sends `{ method: 'ping' }`, and since only
  the host sends on the channel, no app can reach it either.
- **The host sends zero notifications** — `jsonrpc.notification` appears nowhere in
  `src/server/runtime/`.
- **Listener dispatch is runtime-local, and fragile.** The wire contract for all ~70 listeners is a
  uniform `params: [context]` with one 2-arg exception (`AppListenerManager.ts:652`). Everything the
  proposal framed as protocol-level guessing — `includes('Message')` → hydrate, `endsWith('Extend')`
  → splice a `MessageExtender`, `startsWith('check')` → stop at `(context, reader, http)` — decides
  which accessors to inject and never crosses the wire. No current misfire was found; it is correct
  by coincidence, not construction, and a future event with the wrong word in its name would
  silently get different injection. Hence decision 15.
- **Every Mongo-reachable bridge param is a scalar** — `doGetById(messageId: string)`,
  `doGetByUsername(username: string)`, `doGetBySipExtension(extension: string)`,
  `doUpdate(id: string, data: object, upsert: boolean)`, `doAddReaction(messageId, userId, reaction)`.
  `z.string()` defeats `{ $ne: null }`. The rest is either irreducibly opaque
  (`PersistenceBridge.doCreate(data: object)` — arbitrary app data) or a deep domain object. Hence
  decision 13's shallow-contract split.
- **The reachable surface is larger than the used surface.** `handleBridgeMessage` resolves
  `this.bridges[bridgeName]` and then `bridgeInstance[bridgeMethod]`, so it reaches 152 `do*`
  methods. The accessors emit 122. The other 30 are reachable from the untrusted subprocess only
  because they exist. Hence decision 16's rule that the contract is the surface.
- **Bridge signatures do not state the permission-failure result.** `MessageBridge.doCreate`
  declares `Promise<string>` but returns `undefined` when the permission check fails, and
  `ModifyCreator` then returns `String(undefined)` as the message id. Hence decision 18's
  hand-written output types, and the rejection of inferred outputs.
- **A plain `z.looseObject` cannot type a domain object.** Its inferred type has an index signature,
  and TypeScript does not let an interface such as `IMessage` fill one; the call fails with `TS2322`
  under `strict: true` and `strict: false`. Hence `shaped<T>()` in decision 13.
- **Zod and TypeBox both keep a required field required under `strict: false`.** A missing field is
  a compile error with `strict: true` and with `strict: false`, so the host's `strict: false` does
  not decide the schema library.
- **Validation cost is small next to serialization.** On Node, 2 million iterations of an
  `addReaction` input: compiled AJV 17.6 ns, Zod `safeParse` 48.6 ns, `structuredClone` of the same
  request 1782 ns. Zod adds about 30 ns to a call whose serialization alone costs about 1.8 µs.
  Hence decision 11.

The probes and the steps to run them are in
[`docs/proposals/apps-runtime-sdk-ipc/benchmarks/`](../proposals/apps-runtime-sdk-ipc/benchmarks/README.md).

### Dependency inventory at time of writing

Zod `~4.3.6` is a direct dependency of `packages/apps`, at the version that `core-typings` and
`apps/meteor` use. AJV `^8.20.0` is a direct dependency of `http-router`, `rest-typings`, `livechat`,
and `media-signaling`, and not of `packages/apps`. `@sinclair/typebox@0.34.33` is present
transitively only and does not become a direct dependency. `json-schema-to-ts` is not installed.
