# Handoff — Runtime SDK / IPC protocol grilling

Working notes from a design interrogation of [`README.md`](./README.md). Captures **verified facts**
(several of which contradict the README), **decisions locked**, and **branches still open**.

Status: README **not yet rewritten**. Decisions below supersede it where they conflict.

---

## 1. Facts verified against the code

Corrections to the README first — these change its premises.

| README claim | Reality |
| --- | --- |
| `accessor:*` "being removed by PR #41171" | **Already removed.** #41171 merged as `5a92469dc7`…`17a05763b6`. No `handleAccessorMessage`; only comments + test-helper prose mention it. §4.1 and §7.3 step 4 describe completed work. |
| Links to `../apps-accessor-consolidation/README.md` and `…/base-runtime-app-id-exceptions.md` | **Dead.** Deleted in the same PR ("transform the proposal into an ADR"). Successor: [`docs/adr/0001-app-accessor-logic-in-base-runtime.md`](../../adr/0001-app-accessor-logic-in-base-runtime.md). |
| Two `codec.ts` are duplicates to dedupe | **Complementary halves, not duplicates.** See §1.1. |
| Dropping `jsonrpc-lite` is a low-value dependency cleanup (§8.1) | Real per-request cost. See §1.2. |
| §3.2 listener "positional guessing" is a protocol problem | It is **runtime-local injection dispatch**. Wire contract is uniform `[context]` (+2-arg exception). See §1.4. |
| §8.2 recommends Zod v4 | Zod is the worst fit of the options. See decision D8. |
| §8.3 recommends generating `bridges:*` contracts via ts-morph | Not worth it, and the deep half is redundant. See decision D9. |

Counts that **do** check out: 28 bridge getters; ~126 unique `do*` names across 37 files in
`packages/apps/src/server/bridges/`.

### 1.1 The two codecs

`src/server/runtime/base/codec.ts` (78 LOC) vs `base-runtime/src/lib/codec.ts` (50 LOC):

| Ext | Host | Runtime |
| --- | --- | --- |
| 0 fn | `Uint8Array([0])`, functions only | `Uint8Array(0)`, functions **or `App` instances** |
| 1 buf | symmetric | symmetric |
| 2 secure | `encode` real (`hasSecureFields`, nested re-encode w/ `ignoreRoot`); `decode` → `undefined` | `encode` → `null`; `decode` real (`applySecureFields`) |

Host exports **factories** (`newEncoder()`/`newDecoder()`) with a comment explaining a `Decoder`
poisoned by malformed input stays poisoned. Runtime exports **singletons**.

Owner's ruling: all asymmetries are convenience, not requirement. The runtime singleton is
**not a real bug** — if the subprocess's stdin dies the process is unrecoverable anyway. Both sides
can carry the complete codec.

Related wart: `base-runtime/src/lib/secureFields.ts` imports `@rocket.chat/apps/dist/lib/SecureFields`
— a **compiled-CJS import from inside the Deno sandbox**, working only via `deno.jsonc`'s
`unstable: ["detect-cjs"]`, and exactly what `deno-runtime/main.ts`'s comment says not to do.

### 1.2 `jsonrpc-lite` has a real per-request cost

`checkParams` (`jsonrpc.js:311`) runs `JSON.stringify(params)` **and discards the result** — a pure
serializability probe. `validateMessage` invokes it for `RequestObject` and `NotificationObject`;
`success`/`error` escape it. So it taxes **every outbound request in both directions** — including
`app:executePostMessageSent` (message + room), `bridges:getHttpBridge:doCall` (full body),
`app:executePreFileUpload`. A `Buffer` in params does not throw — it stringifies to
`{"type":"Buffer","data":[…]}`, an N-element JSON number array, discarded, per message.

24 files import `jsonrpc-lite`. Two use it structurally, not as a formatter:
`mainLoop.ts:70` (`result instanceof JsonRpcError`) and `messenger.ts:28`
(`message instanceof jsonrpc.ErrorObject`). Errors are thrown and promise-rejected as library
instances.

### 1.3 Build topology (constrains where shared code can live)

- **Three separate tsc projects**, each `rootDir`-pinned to its own `src`: `src` → `dist` (host, CJS);
  `base-runtime/src` → `base-runtime/dist` (nodenext); `node-runtime/src`.
- Build order: `build:default` **then** `build:base-runtime`.
- Both host and base-runtime compile with **`strict: false`**.
- Host imports nothing from `base-runtime` today (only a path string in `AppsEngineDenoRuntime`).
- **Deno consumes TS source, deliberately** — importing compiled `dist` runs CJS whose `require()`
  bypasses the import map and escapes the `--allow-read` allowlist. Import map is generated per-spawn
  by `generateEphemeralDenoConfig`; deno runs with `--cached-only`, so any npm dep must also be
  vendored into `.deno-cache`.
- **No version skew.** The subprocess is spawned from the installed `packages/apps`;
  `deno-runtime`/`node-runtime` ship inside it. The wire format is **not** a compatibility surface.

### 1.4 Listener dispatch is runtime-local

`base-runtime/src/handlers/listener/handler.ts::parseArgs`. Wire contract for all ~70 listeners is
uniform: `params: [context]`, with a 2-arg exception (`AppListenerManager.ts:652` —
`app.call(AppMethod.EXECUTEPOSTMESSAGEDELETED, message, context)` and the matching `check`).

Everything §3.2 frames as guessing (`includes('Message')` → hydrate; `endsWith('Extend')` → splice a
`MessageExtender`; `startsWith('check')` → stop at `(context, reader, http)`) decides **which
accessors to inject**, never crosses the wire. Fragile — substring matching over method names, so a
future event with the wrong word in its name silently gets different injection and hydration. No
current misfire found; correct by coincidence, not construction.

### 1.5 Bridge param shapes (drove the codegen decision)

Every Mongo-reachable param is a scalar: `doGetById(messageId: string, appId)`,
`doGetByUsername(username: string)`, `doGetBySipExtension(extension: string)`,
`doGetUserRoomIds(userId: string)`, `doReadById(id: string)`,
`doUpdate(id: string, data: object, upsert: boolean)`, `doDeactivate(userId, confirmRelinquish)`,
`doGetDirectByUsernames(usernames: Array<string>)`, `doAddReaction(messageId, userId, reaction)`.
`{type:'string'}` defeats `{$ne:null}`.

The rest is either irreducibly opaque (`PersistenceBridge.doCreate(data: object, appId)` — arbitrary
app data) or a deep domain object (`IMessage`/`IRoom`/`Partial<IUser>`).

### 1.6 House schema pattern

`rest-typings` hand-authors JSON Schema literals + `ajv.compile<T>(schema)` with a **separately
hand-written** TS type — 252 compile sites. Already has the two-sources-of-truth problem; not a
pattern to copy. AJV `^8.20.0` is a direct dep of `http-router`, `rest-typings`, `livechat`,
`media-signaling`. Zod `~4.3.6` in `core-typings` + `apps/meteor`, **not** in `packages/apps`.
`@sinclair/typebox@0.34.33` present transitively only. `json-schema-to-ts` not installed.

### 1.7 Fused msgpack validation is unavailable (researched)

`@msgpack/msgpack@3.0.0-beta2`: every `Decoder` internal is TS-`private` (`doDecodeSync`,
`pushMapState`, `decodeUtf8String`, the stack); five public entry points; no reviver, no visitor, no
typed-shape decode. Subclassing unsupported. `ExtensionCodec` fires only for ext head bytes
(`0xd4–0xd8`, `0xc7–0xc9`) — plain maps/arrays never reach it. `msgpackr` record structures are
key-dedup perf, not schema. No msgpack analogue of `fast-json-stringify` in either direction.

Ext 2 *does* show you can route an ordinary object through `ExtensionCodec`
(`encode(obj, { context: { ignoreRoot: true } })`), but it adds traversals rather than removing them.

Perf framing: compiled AJV remains 5–18× faster than Zod even after the v4 rewrite (which claims
6.5× over v3). No sourced decode-vs-validate ratio on identical payloads — treat any such figure as
unverified.

---

## 2. Decisions locked

| # | Decision |
| --- | --- |
| **D1** | Doc becomes **proposal only**. Catalog (§1–§6) collapses to a surface sketch; §7–§9 carry it. |
| **D2** | Primary goal is **cross-runtime drift** (the codecs already diverged), with **contract testing** as the mechanism and **type safety** as the by-product. "Own the wire format" and "reference generation" are not the drivers. |
| **D3** | **No new workspace package.** New directory `packages/apps/protocol/` as a **4th sibling tsc project** (own tsconfig → own dist; `build:protocol`/`typecheck:protocol`; built first; one `deno.jsonc` import entry). Chosen over living inside `base-runtime` (would invert build order — host would import `base-runtime/dist` before it exists) and over living in `src/` (would point Deno at the Mongo/Meteor-adjacent tree). Only placement where the contract can be **`strict: true`**. |
| **D4** | **One codec, identical both sides, factory-based.** Complete ext registration on both: host also guards `App` on ext 0; both carry both halves of ext 2; both use factories. No direction parameter. |
| **D5** | Codec takes an injected **capability**, not an injected function: `createCodec({ getAppPermissions?: () => IPermission[] })`. `applySecureFields` moves into `protocol/`; host passes `() => []` (strips all secure fields — safe default; host-side ext-2 decode changes from `undefined` to "stripped object", unreachable today). |
| **D6** | Move `SecureFields.ts` wholesale into `protocol/` and **update the Meteor import** (`apps/meteor/app/apps/server/converters/codecs/rooms.ts` uses `secureFieldsMapper`). No re-export shim — monorepo, just fix the call site. Deletes the CJS-from-sandbox wart. |
| **D7** | JSON-RPC: **surface now, implementation later.** `protocol/` owns the API (`buildRequest`, `parseFrame`, envelope + error constructors), delegating to `jsonrpc-lite` internally. 24 call sites migrate once. The two `instanceof` sites become **brand-checked types owned by `protocol/`** (`isProtocolError(x)`), never library classes — otherwise the later swap re-opens the churn. Replacing `jsonrpc-lite` is a **committed follow-up with a benchmark as its acceptance criterion** (motivated by §1.2, not by dependency hygiene). |
| **D8** | **Subprocess is untrusted.** Validation posture is **asymmetric**: `app→host` params **always validated, host-side, with AJV-compiled schemas**; `host→app` is **types-only** plus dev/test-only checks. Rationale: the untrusted direction is also the cheap one (ids, scalars); the expensive one (hydrated message+room+user) is self-sent. AJV's `new Function` codegen also stays out of the Deno sandbox this way. Authoring is **TypeBox** (schemas *are* JSON Schema — no conversion; Zod would add a conversion step *and* a draft-2020-12 vs AJV-8 mismatch). |
| **D9** | **No codegen.** No ts-morph, no committed generated artifact, no codegen build step. Hand-author ~112 shallow tuples (mostly `string`/`boolean`/`object`). Deep `IMessage`/`IRoom`/`IUser` schemas are **redundant** — `docs/proposals/apps-converters-zod` is already putting runtime-validated Zod codecs on those same objects one layer down; generating IPC schemas for them means validating the same payload twice in two schema systems. Division of labor: **IPC contract = shape of the call** (arity + scalar types, shallow, catches injection); **converter codecs = the domain objects**. Keep codegen's one real benefit — drift detection — as a **test**: reflect over bridge prototypes (`Object.getOwnPropertyNames(X.prototype).filter(n => n.startsWith('do'))`) and assert every `do*` has a contract entry. Use `Function.prototype.length` as a **max-arity bound + existence check** only (it under-counts optional params — `doGetAppUser(appId?)` → 0). |
| **D10** | **TypeBox stays out of the sandbox.** Split `protocol/contracts/bridges/names.ts` (plain string consts, zero deps, value-imported by both sides) from `schemas.ts` (TypeBox; host value-imports, runtime `import type` only, so TS erases it and Deno never loads it). No `deno.jsonc`/`.deno-cache` change. |
| **D11** | Listeners: `protocol/` declares only the **method set + arity** (`1 | 2`, the `*PostMessageDeleted` pair being the 2s). The **injection table** becomes an explicit per-method descriptor **inside `base-runtime`**, replacing substring matching — in scope for this project, **as the last PR** (by then the contract table gives the authoritative method set to enumerate against). Injection never crosses the wire, so it must not live in `protocol/`. |
| **D12** | **Flatten the method-name grammar.** Variable segments move into params; method names become a **closed set**: `method: 'api:call'`, `params: [{ path, httpMethod, requestData, endpointInfo }]`; `method: 'scheduler:run'`, `params: [{ processorId, jobContext }]`; likewise `slashcommand`, `videoconference`, `outboundCommunication`. Safe because there is no version skew (§1.3). Buys: finite enum instead of templates; map-lookup dispatch (deletes `requestRouter`'s prefix split, `api-handler`'s pop/rejoin, `handleApp`'s second-segment split); `method` validatable as an AJV `enum` at envelope level; an enumerable reference artifact; and no app-supplied string interpolated into a dispatch key. Cost: logs/metrics lose self-describing names — log `method` + the discriminant param. **`bridges:{getXBridge}:{do*}` is NOT flattened** — both segments are already closed sets, so it's a template in syntax only. |

---

## 3. Still open

Not yet discussed. Roughly in dependency order.

1. **`APP_ID` sentinel** (README §6.1) — post-consolidation, is the literal-string substitution in
   `handleBridgeMessage` still the right mechanism, or does the host now always know the app id from
   the subprocess identity? Interacts with D8: a sentinel that params can *contain* is a validation
   edge case.
2. **`{ value, logs }` envelope** (README OQ5) — make it invariant in `protocol/`? Where does the
   `logs` side-channel attach, and does `error.data.logs` stay parallel?
3. **Error taxonomy** — README §2.3 lists `-32000`, `1000`, and `AppsEngineException.JSONRPC_ERROR_CODE`
   overlapping. Does `protocol/` normalize these, and what happens to code `1000` now that the
   accessor path that produced it is gone?
4. **Notification direction** (README OQ1) — router rejects inbound notifications (`-32600`). Lock
   that in the contract, or leave room for host→app notifications (e.g. cancellation)?
5. **JSON-RPC `ping` prefix vs `_zPING`** (README OQ2) — retire the JSON-RPC `ping` handler? Cheap;
   probably folds into D12's closed method set.
6. **stderr metrics channel** (`{ pid, queueSize }`, plain JSON, not msgpack, not JSON-RPC) — in or
   out of `protocol/`'s scope?
7. **Contract test shape** — what actually gets asserted, and where does it run (host suite,
   base-runtime suite, both)? Note `base-runtime/src/lib/accessors/tests/helpers/parityHarness.ts`
   already exists as a retained recording harness for emitted wire traffic; likely the seed.
8. **PR sequencing / sizing** — the series implied so far is roughly: codec+SecureFields move →
   JSON-RPC surface (D7) → method-name flattening (D12) → bridge contracts + AJV (D8/D9) →
   listener injection table (D11). Needs to be pinned, with each step independently green.
9. **What happens to README §1–§6** under D1 — how much surface sketch survives, and does any of the
   catalog move into the ADR instead of being deleted?
