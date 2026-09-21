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
   app logs, and `bridges:*` responses are the hot direction — wrapping them would add an allocation
   and an extra object per accessor call for a field that can never be populated. The **envelope**
   is invariant on app→host; the **`logs` field** stays conditional on `logger.hasEntries()`.
6. **The error taxonomy is a closed enum owned by `protocol/`**: the five standard JSON-RPC codes,
   plus `-32070` (`AppsEngineException.JSONRPC_ERROR_CODE`, unchanged — defined in `apps-engine` and
   the only code with a live consumer), plus `-32000` for "handler or bridge threw".
   - Half of this exists. `src/lib/jsonrpc.ts` already exports the five standard codes and
     `SERVER_ERROR` as named constants, and `JsonRpcError` already carries the matching static
     factories. What this decision adds is `-32070`, the retirement of `1000`, the declared `data`
     shapes below, and the closing of the set — the codes are loose constants today, so nothing
     stops a call site writing a number.
   - **Code `1000` is retired.** It currently marks structural bridge-dispatch failures; those split
     into `-32601` (unknown bridge, unknown `do*`, non-`do` prefix) and `-32602` (params not an
     array, or schema violation). Zero risk — nothing reads inbound error codes today.
   - **`error.data` becomes a declared shape per code**, never a raw `Error`, and `logs` is a fixed
     field of it rather than a property mutated onto whatever `data` happens to be.
7. **Request-vs-notification is a per-entry `kind` field, not a property of direction.** No host→app
   notifications are added; the table simply has none, so today's behavior is unchanged. Dispatch
   looks the method up first, so an unknown method yields `-32601` and a known method used with the
   wrong kind yields `-32600`.
8. **`protocol/` owns the control frames.** The JSON-RPC `ping` method is
    deleted (dead — nothing has ever sent it). The `_zPING`/`_zPONG` constants move into `protocol/`
    together with an `isControlFrame()` discriminator, collapsing four independent literal
    definitions into one import. They stay **bare strings**: the bare form avoids a per-heartbeat
    object, and folding them into JSON-RPC would buy nothing.

### Method grammar

9. **The method-name grammar is flattened into a closed set.** Variable segments move into params:
    `'api:call'` with `[{ path, httpMethod, requestData, endpointInfo }]`, `'scheduler:run'` with
    `[{ processorId, jobContext }]`, and likewise for `slashcommand`, `videoconference`, and
    `outboundCommunication`. Safe because there is no version skew (see *Context*).
    - Buys: a finite enum instead of templates; map-lookup dispatch (deleting `requestRouter`'s
      prefix split, `api-handler`'s pop/rejoin, `handleApp`'s second-segment split); `method`
      validatable as an enum at envelope level; and no app-supplied string interpolated into a
      dispatch key.
    - Costs: logs and metrics lose self-describing method names — log `method` plus the discriminant
      param.
    - **`bridges:{getXBridge}:{do*}` is not flattened.** Both segments are already closed sets, so
      it is a template in syntax only.

### Validation and contracts

10. **The subprocess is untrusted, and the validation posture is asymmetric.** `app→host` params are
    **always validated host-side with AJV-compiled schemas**; `host→app` is **types-only** plus
    dev/test-only checks. The untrusted direction is also the cheap one (ids and scalars); the
    expensive one (hydrated message + room + user) is self-sent. This also keeps AJV, and its
    `new Function` codegen, out of the subprocess entirely.
11. **Schemas are authored in TypeBox** — TypeBox schemas *are* JSON Schema, so there is no
    conversion step and no draft-2020-12 vs AJV-8 mismatch. (Zod would add both. The house
    `rest-typings` pattern — hand-written JSON Schema plus a separately hand-written TS type across
    252 `ajv.compile` sites — already has the two-sources-of-truth problem and is not a pattern to
    copy.)
12. **TypeBox never enters the subprocess.** `protocol/contracts/bridges/names.ts` holds plain
    string constants with zero dependencies and is value-imported by both sides;
    `protocol/contracts/bridges/schemas.ts` holds the TypeBox schemas and is value-imported by the
    host but `import type`-only from the runtime, so TS erases it. The runtime validates nothing
    (decision 10), so it needs the names and never the schemas.
    - The subprocess resolves `node_modules` the way the host does, so a value import would work.
      What it costs is start-up. Every module the runtime imports is loaded once per app process,
      and the schemas are the largest thing in `protocol/` that the subprocess has no use for. The
      `import type` split costs nothing to declare and keeps them off that path.
13. **No codegen.** No ts-morph, no committed generated artifact, no codegen build step. The
    ~152 entries are hand-authored and mostly shallow (`string`, `boolean`, `object`).
    - Deep `IMessage`/`IRoom`/`IUser` schemas are **redundant**: `docs/proposals/apps-converters-zod`
      is putting runtime-validated codecs on those same objects one layer down, and generating IPC
      schemas for them would validate the same payload twice in two schema systems.
    - Division of labor: **the IPC contract is the shape of the call** (arity and scalar types,
      shallow, catching injection); **converter codecs are the domain objects**.
14. **Caller identity never crosses the wire.** The `'APP_ID'` sentinel is dropped from app→host
    requests entirely. Each contract entry carries a **typed invoker thunk** that calls the real
    bridge method, and the host passes the connection-known app id into that thunk.
    - This replaces a value match (`params.map(v => v === 'APP_ID' ? realId : v)`) that could not
      distinguish identity from data — an app requesting a role literally named `APP_ID` had its
      argument silently rewritten — and that only reached top-level positional params.
    - All three historical `APP_ID` buckets collapse into one mechanism: caller-identity params are
      supplied by the thunk; **app-supplied argument-appIds are forwarded from the wire, preserving
      the capability** (`ModerationBridge.doReport`, `doDismissReportsBy*`,
      `UserBridge.doDeleteUsersCreatedByApp`); nested identity is spread in by the thunk
      (`getHttpBridge:doCall`), which **closes the pre-existing `doCall` impersonation gap** that
      ADR 0001 recorded as unfixed.
    - The thunk, not an index annotation, because identity is not reliably positioned:
      `UserBridge.doCreate(data, appId, options?)`, `doGetAppUser(appId?)`,
      `MessageBridge.doAddReaction(messageId, userId, reaction, appId)`.

### Listeners

15. **`protocol/` declares only the listener method set and arity** (`1 | 2`, the
    `*PostMessageDeleted` pair being the 2s). The **injection table** — which accessors each listener
    receives, today decided by substring matching over method names — becomes an explicit per-method
    descriptor **inside `base-runtime`**. Injection never crosses the wire, so it must not live in
    `protocol/`. It lands last, when the contract table can supply the authoritative method set to
    enumerate against.

### Enforcement

16. **Enforcement is types first, tests second.**
    - The invoker table is typed `Record<BridgeMethodKey, Entry>`, where `BridgeMethodKey` is a
      mapped type derived from `AppBridges` (plus `AppResourceBridge`, which is not on that
      surface). A `do*` with no entry is a **compile error** in `typecheck:default`.
    - `bridgeCall`'s signature narrows from `` method: `do${string}` `` to the closed per-bridge
      union from `names.ts`, so an accessor calling a nonexistent method is a **compile error** in
      `typecheck:base-runtime`.
    - Together these subsume the reflection-based drift test the proposal originally called for
      (`Object.getOwnPropertyNames` + `Function.prototype.length`), which was strictly weaker —
      `Function.prototype.length` under-counts optional params, reporting `doGetAppUser(appId?)` as
      arity 0.
17. **One round-trip contract test, in the host suite, on real traffic.** For each accessor: drive
    the real `base-runtime` class with the existing `createRecordingSender` harness, push each
    emitted `{ method, params }` through **the real send path** — `sanitizeForIpc`, then a
    structured clone — so that function-dropping and `Buffer` survival are exercised rather than
    assumed, then through AJV and the invoker table against a stubbed bridge. Assert that params
    validate, that the stub receives the right arity, and that identity lands in the right slot.
    - Host suite, because AJV, the bridge classes, and the invoker table are all host-side; it
      imports `base-runtime` *source* directly. This inverts ADR 0001's "host imports nothing from
      `base-runtime`" for tests only — `build:default` is untouched.
    - **No committed fixture corpus.** A corpus regenerated alongside the change it was meant to
      catch proves nothing.
    - **The test reports its own coverage gap.** Only ~30 of the ~152 methods are emitted by any
      accessor today, so the test must assert the exercised set against the declared set and print
      the un-exercised names. Un-exercised entries are schema-only: declared and typechecked, never
      validated against real traffic.

## End state

`packages/apps/protocol/` is a `strict: true`, dependency-light tsc project that both the host
controller and every runtime adapter import. It owns the two serialization passes, the control
frames, the JSON-RPC envelope and error taxonomy, the closed method set, and the app→host param
schemas. The host owns the binding from that wire to its own bridges (the invoker table).
`base-runtime` owns accessor injection and the secure-fields walk.

`base-runtime` imports nothing from the host project. `lib/jsonrpc.ts` is gone, and
`lib/messenger.ts` and `lib/secureFields.ts` take the sanitizer and the marker from `protocol/`,
which is built before both. The `'APP_ID'` string does not appear on the wire, in `base-runtime`, or
in `handleBridgeMessage`.

## Architecture

### Layout

```text
packages/apps/protocol/            # 4th tsc project, strict: true, built first
├── src/
│   ├── serialization/             # the two passes the transport needs           (D3)
│   │   ├── sanitizer.ts           # strips functions and App instances before a send
│   │   └── secureFields.ts        # the marker, the descriptor and the mapper
│   ├── framing/
│   │   ├── control.ts             # _zPING / _zPONG + isControlFrame          (zero deps, D8)
│   │   ├── jsonrpc.ts             # envelopes, factories, guards — moved from src/lib (D4)
│   │   └── errors.ts              # closed code enum + declared data shapes   (D6)
│   └── contracts/
│       ├── methods.ts             # closed host→app method set + kind + arity (D7, D9, D15)
│       └── bridges/
│           ├── names.ts           # plain string consts     — both sides value-import
│           └── schemas.ts         # TypeBox                 — host value, runtime type-only (D12)
└── README.md                      # the one-page surface sketch

packages/apps/src/server/runtime/
└── bridgeContracts.ts             # the invoker table — host-only, references AppBridges (D14, D16)
```

The invoker table cannot live in `protocol/`: `protocol/` is built first and so cannot import
`AppBridges`. That is the correct seam anyway — `protocol/` declares the wire, and a host declares
how the wire binds to *its* bridges.

### The invoker table

```ts
'getMessageBridge:doAddReaction': {
  params: Type.Tuple([Type.String(), Type.String(), ReactionSchema]),
  invoke: (b, [messageId, userId, reaction], appId) => b.doAddReaction(messageId, userId, reaction, appId),
},
'getHttpBridge:doCall': {
  params: Type.Tuple([HttpCallPayload]),                    // schema forbids `appId`
  invoke: (b, [payload], appId) => b.doCall({ ...payload, appId }),
},
'getModerationBridge:doReport': {                           // app-supplied appId — capability preserved
  params: Type.Tuple([Type.String(), Type.String(), Type.String(), Type.String()]),
  invoke: (b, [msgId, desc, userId, targetAppId]) => b.doReport(msgId, desc, userId, targetAppId),
},
```

Surface being covered: **152 `public do*` declarations** across **27 bridge classes** (127 unique
names; 15 of them on `AppResourceBridge`), reachable through **28 `AppBridges` getters plus
`AppResourceBridge`**.

### Validation posture

| Direction | Params | Rationale |
| --- | --- | --- |
| `app → host` (`bridges:*`) | **Always validated**, host-side, AJV-compiled from TypeBox | Untrusted source; payloads are ids and scalars, so validation is cheap |
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
   permission denial from a bridge throw. Restoring that is an app-observable behavior change with
   its own design question (do we expose typed accessor errors?), so it is deliberately not smuggled
   into this work.
5. **Host→app cancellation.** The host times out requests (`waitForResponse` with
   `getRuntimeTimeout()`), but the subprocess keeps executing the app method with no way to be told
   to stop. Decision 7 leaves room for this without reserving a method; the hard part is aborting
   app code that runs via `new Function` in the runtime's own realm.
6. **`ProxiedApp.call`'s range check** is `e.code >= -32999 || e.code <= -32000`, an `||` where `&&`
   was meant — it matches every number, so every non-`-32070`/`-32601` error is logged and
   swallowed and `call()` resolves `undefined`. Cosmetic in effect, but it should be either fixed or
   deliberately documented as "log everything".

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
method names) and decision 6 (retiring code `1000`) to be single-commit changes.

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
  `{ type: 'string' }` defeats `{ $ne: null }`. The rest is either irreducibly opaque
  (`PersistenceBridge.doCreate(data: object)` — arbitrary app data) or a deep domain object. Hence
  decision 13's shallow-contract split.
- **Compiled AJV remains 5–18× faster than Zod** even after the v4 rewrite (which claims 6.5× over
  v3). No sourced decode-vs-validate ratio on identical payloads exists; any such figure should be
  treated as unverified.

### Dependency inventory at time of writing

AJV `^8.20.0` is a direct dependency of `http-router`, `rest-typings`, `livechat`, and
`media-signaling`. Zod `~4.3.6` is in `core-typings` and `apps/meteor`, but **not** in
`packages/apps`. `@sinclair/typebox@0.34.33` is present transitively only and becomes a direct
dependency of `packages/apps` under decision 11. `json-schema-to-ts` is not installed.
