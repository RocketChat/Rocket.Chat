# ADR 0002 — The host↔subprocess protocol is owned by `packages/apps/protocol`

## Status

**Accepted — not yet implemented.** Supersedes the catalog in
`docs/proposals/apps-runtime-sdk-ipc`; that proposal is reduced to the delivery plan.

- **Date:** 2026-08
- **Scope:** `packages/apps` (host, `base-runtime`, `node-runtime`, `deno-runtime`) plus one import
  site in `apps/meteor`
- **Follows:** [ADR 0001](./0001-app-accessor-logic-in-base-runtime.md), whose follow-up 5
  ("consolidated host↔subprocess protocol/SDK") this ADR answers

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
   - Rejected: living in `src/` — that points Deno at the Mongo/Meteor-adjacent tree.
   - It is the only placement where the contract can compile **`strict: true`** (host and
     `base-runtime` are both `strict: false`).
   - **No Deno configuration change is required.** `generateEphemeralDenoConfig` already maps
     `'@rocket.chat/apps/' → packagePath` and `--allow-read` already includes `packagePath`, so
     `packages/apps/protocol/src/**` is importable and readable from the sandbox as-is. A
     `@rocket.chat/apps/protocol/` alias would be sugar only.

### Codec

3. **One codec, identical on both sides, factory-based.** Both halves register the complete
   extension set: ext 0 guards functions *and* `App` instances on both sides; both carry both
   directions of ext 2; both expose `newEncoder()`/`newDecoder()` rather than singletons. No
   direction parameter.
4. **The codec takes an injected capability, not an injected function** —
   `createCodec({ getAppPermissions?: () => IPermission[] })`. `applySecureFields` moves into
   `protocol/`; the host passes `() => []`, which strips all secure fields. Host-side ext-2 decode
   therefore changes from returning `undefined` to returning a stripped object — a path unreachable
   today.
5. **`SecureFields.ts` moves wholesale into `protocol/`** and the Meteor call site
   (`apps/meteor/app/apps/server/converters/codecs/rooms.ts`, which uses `secureFieldsMapper`) is
   updated. No re-export shim. This deletes the compiled-CJS-from-inside-the-sandbox import that
   only works via `deno.jsonc`'s `unstable: ["detect-cjs"]`.

### Framing

6. **`protocol/` owns the JSON-RPC surface now and the implementation later.** It exports
   `buildRequest` / `parseFrame` / envelope and error constructors, delegating to `jsonrpc-lite`
   internally; the 24 call sites migrate once. The two structural `instanceof` sites
   (`mainLoop.ts:70`, `messenger.ts:28`) become **brand-checked types owned by `protocol/`**
   (`isProtocolError(x)`), never library classes, so the later swap does not reopen the churn.
   `parseFrame`'s return type reserves an optional `meta` slot (see follow-up 2).
7. **The result envelope is asymmetric, and that is deliberate.** App→host responses carry
   `result: { value, logs? }`; host→app responses carry the raw value. Only the subprocess produces
   app logs, and `bridges:*` responses are the hot direction — wrapping them would add an allocation
   and a msgpack map per accessor call for a field that can never be populated. The **envelope** is
   invariant on app→host; the **`logs` field** stays conditional on `logger.hasEntries()`.
8. **The error taxonomy is a closed enum owned by `protocol/`**: the five standard JSON-RPC codes,
   plus `-32070` (`AppsEngineException.JSONRPC_ERROR_CODE`, unchanged — defined in `apps-engine` and
   the only code with a live consumer), plus `-32000` for "handler or bridge threw".
   - **Code `1000` is retired.** It currently marks structural bridge-dispatch failures; those split
     into `-32601` (unknown bridge, unknown `do*`, non-`do` prefix) and `-32602` (params not an
     array, or schema violation). Zero risk — nothing reads inbound error codes today.
   - **`error.data` becomes a declared shape per code**, never a raw `Error`, and `logs` is a fixed
     field of it rather than a property mutated onto whatever `data` happens to be.
9. **Request-vs-notification is a per-entry `kind` field, not a property of direction.** No host→app
   notifications are added; the table simply has none, so today's behavior is unchanged. Dispatch
   looks the method up first, so an unknown method yields `-32601` and a known method used with the
   wrong kind yields `-32600`.
10. **The JSON-RPC `ping` method is deleted** (dead — nothing has ever sent it), and the
    `_zPING`/`_zPONG` control-frame constants move into `protocol/` together with an
    `isControlFrame()` discriminator, collapsing four independent literal definitions into one
    import. They stay **bare strings**: the bare form is a deliberate choice to avoid per-heartbeat
    object encoding, and folding them into JSON-RPC would buy nothing.
11. **The stderr metrics channel stays on stderr, as plain JSON**, but `protocol/` owns its shape
    (`{ pid, queueSize }`) and the writes become **newline-delimited**, parsed per line. The
    out-of-band channel is load-bearing, not accidental: `queueSize` routed through the outbound
    queue would be delayed by exactly the backlog it reports.

### Method grammar

12. **The method-name grammar is flattened into a closed set.** Variable segments move into params:
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

13. **The subprocess is untrusted, and the validation posture is asymmetric.** `app→host` params are
    **always validated host-side with AJV-compiled schemas**; `host→app` is **types-only** plus
    dev/test-only checks. The untrusted direction is also the cheap one (ids and scalars); the
    expensive one (hydrated message + room + user) is self-sent. This also keeps AJV's `new Function`
    codegen out of the Deno sandbox.
14. **Schemas are authored in TypeBox** — TypeBox schemas *are* JSON Schema, so there is no
    conversion step and no draft-2020-12 vs AJV-8 mismatch. (Zod would add both. The house
    `rest-typings` pattern — hand-written JSON Schema plus a separately hand-written TS type across
    252 `ajv.compile` sites — already has the two-sources-of-truth problem and is not a pattern to
    copy.)
15. **TypeBox never enters the sandbox.** `protocol/contracts/bridges/names.ts` holds plain string
    constants with zero dependencies and is value-imported by both sides;
    `protocol/contracts/bridges/schemas.ts` holds the TypeBox schemas and is value-imported by the
    host but `import type`-only from the runtime, so TS erases it and Deno never loads it.
16. **No codegen.** No ts-morph, no committed generated artifact, no codegen build step. The
    ~152 entries are hand-authored and mostly shallow (`string`, `boolean`, `object`).
    - Deep `IMessage`/`IRoom`/`IUser` schemas are **redundant**: `docs/proposals/apps-converters-zod`
      is putting runtime-validated codecs on those same objects one layer down, and generating IPC
      schemas for them would validate the same payload twice in two schema systems.
    - Division of labor: **the IPC contract is the shape of the call** (arity and scalar types,
      shallow, catching injection); **converter codecs are the domain objects**.
17. **Caller identity never crosses the wire.** The `'APP_ID'` sentinel is dropped from app→host
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

18. **`protocol/` declares only the listener method set and arity** (`1 | 2`, the
    `*PostMessageDeleted` pair being the 2s). The **injection table** — which accessors each listener
    receives, today decided by substring matching over method names — becomes an explicit per-method
    descriptor **inside `base-runtime`**. Injection never crosses the wire, so it must not live in
    `protocol/`. It lands last, when the contract table can supply the authoritative method set to
    enumerate against.

### Enforcement

19. **Enforcement is types first, tests second.**
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
20. **One round-trip contract test, in the host suite, on real traffic.** For each accessor: drive
    the real `base-runtime` class with the existing `createRecordingSender` harness, push each
    emitted `{ method, params }` through **the real codec** (so ext-0 function-dropping and ext-1
    `Buffer` round-tripping are exercised rather than assumed), then through AJV and the invoker
    table against a stubbed bridge. Assert that params validate, that the stub receives the right
    arity, and that identity lands in the right slot.
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
controller and every runtime adapter import. It owns the codec, the control frames, the JSON-RPC
envelope and error taxonomy, the closed method set, and the app→host param schemas. The host owns
the binding from that wire to its own bridges (the invoker table). `base-runtime` owns accessor
injection. `jsonrpc-lite` is still present, behind `protocol/`'s API, with its removal scheduled and
benchmarked.

The `'APP_ID'` string does not appear on the wire, in `base-runtime`, or in `handleBridgeMessage`.

## Architecture

### Layout

```text
packages/apps/protocol/            # 4th tsc project, strict: true, built first
├── src/
│   ├── codec/                     # msgpack + 3 extension types, factory-based (D3–D5)
│   │   └── secureFields.ts        # moved from base-runtime + src/lib
│   ├── framing/
│   │   ├── control.ts             # _zPING / _zPONG + isControlFrame          (zero deps)
│   │   ├── jsonrpc.ts             # buildRequest / parseFrame / envelope      (D6)
│   │   ├── errors.ts              # closed code enum + declared data shapes   (D8)
│   │   └── metrics.ts             # { pid, queueSize }, NDJSON                (D11)
│   └── contracts/
│       ├── methods.ts             # closed host→app method set + kind + arity (D9, D12, D18)
│       └── bridges/
│           ├── names.ts           # plain string consts     — both sides value-import
│           └── schemas.ts         # TypeBox                 — host value, runtime type-only (D15)
└── README.md                      # the one-page surface sketch

packages/apps/src/server/runtime/
└── bridgeContracts.ts             # the invoker table — host-only, references AppBridges (D17, D19)
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

### Channels and framing

| Channel | Encoding | Contents |
| --- | --- | --- |
| stdin (host→app) | msgpack | JSON-RPC objects, plus the bare `_zPING` string |
| stdout (app→host) | msgpack | JSON-RPC objects, plus the bare `_zPONG` string |
| stderr (app→host) | NDJSON + unstructured text | `{ pid, queueSize }` per ping; anything unparseable is a log line |

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
5. **A third channel (stderr) carries structured data**, outside JSON-RPC entirely — see decision 11.

## Follow-ups

Out of scope here; unblocked or motivated by this work.

1. **Replace `jsonrpc-lite`** — committed, with a benchmark as the acceptance criterion. Motivated by
   real per-request cost, not dependency hygiene: `checkParams` (`jsonrpc.js:311`) runs
   `JSON.stringify(params)` **and discards the result** as a serializability probe, and
   `validateMessage` invokes it for every `RequestObject` and `NotificationObject` — so it taxes
   every outbound request in both directions, including `app:executePostMessageSent` (message +
   room), `bridges:getHttpBridge:doCall` (full body), and `app:executePreFileUpload`. A `Buffer` in
   params does not throw; it stringifies to an N-element JSON number array, which is then thrown
   away, once per message.
2. **A top-level `meta` property on the envelope** — an HTTP-headers analogue for tracing data, with
   `logs` moving into it. Blocked on follow-up 1: `jsonrpc-lite` drops unknown top-level properties
   on `parseObject`. `parseFrame`'s return type reserves the slot so adding it later is a widening,
   not a signature change at 24 call sites.
3. **Preserve error codes into app code.** `mainLoop.handleResponse` currently reconstructs
   `new Error(payload.error.message)`, discarding `code` and `data`, so no app can distinguish a
   permission denial from a bridge throw. Restoring that is an app-observable behavior change with
   its own design question (do we expose typed accessor errors?), so it is deliberately not smuggled
   into this work.
4. **Consume `queueSize`.** A growing outbound queue is arguably as good a restart signal as missed
   pongs, and `LivenessManager` is adjacent. Today the host only `debug()`s the metrics.
5. **Host→app cancellation.** The host times out requests (`waitForResponse` with
   `getRuntimeTimeout()`), but the subprocess keeps executing the app method with no way to be told
   to stop. Decision 9 leaves room for this without reserving a method; the hard part is aborting
   app code that runs via `new Function` in the runtime's own realm.
6. **`ProxiedApp.call`'s range check** is `e.code >= -32999 || e.code <= -32000`, an `||` where `&&`
   was meant — it matches every number, so every non-`-32070`/`-32601` error is logged and
   swallowed and `call()` resolves `undefined`. Cosmetic in effect, but it should be either fixed or
   deliberately documented as "log everything".

## Context

### The drift is not hypothetical

The two `codec.ts` files are **complementary halves of one format**, not duplicates:

| Ext | Host (`src/server/runtime/base/codec.ts`, 78 LOC) | Runtime (`base-runtime/src/lib/codec.ts`, 50 LOC) |
| --- | --- | --- |
| 0 — functions | `Uint8Array([0])`, functions only | `Uint8Array(0)`, functions **or `App` instances** |
| 1 — buffers | symmetric | symmetric |
| 2 — secure fields | `encode` real; `decode` → `undefined` | `encode` → `null`; `decode` real |

Neither side can round-trip its own output. The asymmetries are convenience rather than requirement,
and the runtime's use of singletons over factories is not a real bug — if the subprocess's stdin dies
the process is unrecoverable anyway — but a format maintained as two halves that each implement the
other's gaps is the failure mode this ADR exists to prevent.

Related, and deleted by decision 5: `base-runtime/src/lib/secureFields.ts` imports
`@rocket.chat/apps/dist/lib/SecureFields` — a compiled-CJS import from inside the Deno sandbox,
working only via `unstable: ["detect-cjs"]`, and exactly what `deno-runtime/main.ts`'s own comment
says not to do.

### No version skew

The subprocess is spawned from the installed `packages/apps`; `deno-runtime` and `node-runtime` ship
inside it. **The wire format is not a compatibility surface.** This is what licenses decision 12
(flattening method names) and decision 8 (retiring code `1000`) to be single-commit changes.

Deno consumes TS source deliberately: importing compiled `dist` runs CJS whose `require()` bypasses
the import map and escapes the `--allow-read` allowlist. The import map is generated per spawn by
`generateEphemeralDenoConfig`, and Deno runs `--cached-only`, so any npm dependency must also be
vendored into `.deno-cache` — which is why decision 15 keeps TypeBox type-only on that side.

### Facts that shaped specific decisions

- **`data: <Error>` transmits nothing.** `@msgpack/msgpack` encodes only own-*enumerable* properties,
  and `Error`'s `message` and `stack` are non-enumerable — `encode(new Error('boom'))` decodes to
  `{}`. Both `handleApp` (`:103`, `:114`) and `handleBridgeMessage` pass a raw `Error` as `data`
  today, so the receiver gets an empty map plus whatever `logs` was subsequently mutated onto that
  same `Error` object. Hence decision 8's declared `data` shapes.
- **Code `1000` is still live post-consolidation.** `handleIncomingMessage` wraps anything
  `handleBridgeMessage` throws — unknown bridge, non-`do` method, non-array params — as `1000`, a
  real distinction from `-32000` ("the bridge method threw") that is badly encoded.
- **Inbound error codes are unobservable to apps** (see follow-up 3), which is why retiring `1000`
  carries no risk.
- **`AppsEngineException.JSONRPC_ERROR_CODE` is `-32070`** and does not overlap `-32000`. The
  proposal's claim that the codes overlapped was wrong.
- **The JSON-RPC `ping` handler is unreachable.** Nothing sends `{ method: 'ping' }`, and since only
  the host writes to the subprocess's stdin, no app can reach it either.
- **The host sends zero notifications** — `jsonrpc.notification` appears nowhere in
  `src/server/runtime/`.
- **`parseError` parses whole chunks**, so a chunk containing metrics JSON plus any other stderr text
  fails `JSON.parse`, silently losing the metrics and emitting the blob as an error line. Hence
  decision 11's newline delimiting.
- **Listener dispatch is runtime-local, and fragile.** The wire contract for all ~70 listeners is a
  uniform `params: [context]` with one 2-arg exception (`AppListenerManager.ts:652`). Everything the
  proposal framed as protocol-level guessing — `includes('Message')` → hydrate, `endsWith('Extend')`
  → splice a `MessageExtender`, `startsWith('check')` → stop at `(context, reader, http)` — decides
  which accessors to inject and never crosses the wire. No current misfire was found; it is correct
  by coincidence, not construction, and a future event with the wrong word in its name would
  silently get different injection. Hence decision 18.
- **Every Mongo-reachable bridge param is a scalar** — `doGetById(messageId: string)`,
  `doGetByUsername(username: string)`, `doGetBySipExtension(extension: string)`,
  `doUpdate(id: string, data: object, upsert: boolean)`, `doAddReaction(messageId, userId, reaction)`.
  `{ type: 'string' }` defeats `{ $ne: null }`. The rest is either irreducibly opaque
  (`PersistenceBridge.doCreate(data: object)` — arbitrary app data) or a deep domain object. Hence
  decision 16's shallow-contract split.
- **Fused msgpack validation is unavailable.** In `@msgpack/msgpack@3.0.0-beta2` every `Decoder`
  internal is TS-`private`, there is no reviver, visitor, or typed-shape decode, subclassing is
  unsupported, and `ExtensionCodec` fires only for ext head bytes — plain maps and arrays never reach
  it. `msgpackr`'s record structures are key-dedup performance work, not schema. There is no msgpack
  analogue of `fast-json-stringify` in either direction. Validation is therefore necessarily a second
  pass, which is what makes decision 13's asymmetry worth its complexity.
- **Compiled AJV remains 5–18× faster than Zod** even after the v4 rewrite (which claims 6.5× over
  v3). No sourced decode-vs-validate ratio on identical payloads exists; any such figure should be
  treated as unverified.

### Dependency inventory at time of writing

AJV `^8.20.0` is a direct dependency of `http-router`, `rest-typings`, `livechat`, and
`media-signaling`. Zod `~4.3.6` is in `core-typings` and `apps/meteor`, but **not** in
`packages/apps`. `@sinclair/typebox@0.34.33` is present transitively only and becomes a direct
dependency of `packages/apps` under decision 14. `json-schema-to-ts` is not installed.
