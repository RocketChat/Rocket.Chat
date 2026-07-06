# Feasibility: replacing stdin/stdout with Node's IPC channel in `packages/apps`

## TL;DR

Replacing the stdin/stdout transport with Node's built-in IPC channel (adding
`'ipc'` to the `stdio` array on the `spawn` call and using `child.send()` /
`process.send()`) is **feasible and now unblocked**, because the Deno runtime
was fully removed (`87331b48 chore(apps): completely remove the deno-runtime
from apps package`). Both host and child are now Node, and IPC is a Node-only
feature.

- **Q1 – Does it remove the need for `@msgpack/msgpack`?**
  **Yes, it can** — but not for free. IPC gives us message framing for free and,
  in `serialization: 'advanced'` mode, `Buffer`/binary support for free. However
  two things msgpack currently does must be re-implemented by hand: silently
  dropping **functions**, and the **secure-fields** extension trick.
- **Q2 – Does it streamline communication?**
  **Yes, materially.** It deletes the custom framing/transport plumbing on both
  sides, makes the channel message-oriented instead of byte-oriented (a single
  bad message can no longer desync the stream), and frees stdout/stderr to be
  used for ordinary logging again.

---

## How communication works today

Spawn uses the default `stdio` (three pipes), and the JSON-RPC protocol rides on
top of stdin/stdout as a raw byte stream:

**Host / parent** (`src/server/runtime/base/`)
- `BaseRuntimeSubprocessController.spawnProcess()` → `child_process.spawn(...)`.
- `ProcessMessenger.strategySend()` writes msgpack-encoded bytes to
  `child.stdin`.
- `parseStdout()` reads `child.stdout` through `newDecoder().decodeStream(...)`.
- `child.stderr` is (ab)used as a side channel: metrics are shipped as JSON and
  parsed heuristically in `parseError()`.

**Child / subprocess** (`node-runtime/` + `base-runtime/`)
- `mainLoop.ts` reads `process.stdin` via `decoder.decodeStream(process.stdin)`.
- Outgoing messages go through `Messenger` → `MessageQueue` (msgpack encode) →
  `stdoutTransport` → `process.stdout.write(...)`.

**What `@msgpack/msgpack` is doing for us** (`src/server/runtime/base/codec.ts`
and `base-runtime/src/lib/codec.ts` — the only two files that import it):

1. **Framing** – stdin/stdout are byte streams with no message boundaries.
   `Decoder.decodeStream()` reassembles chunks into discrete records.
2. **Binary-safe serialization**, including `Buffer`/`Uint8Array`
   (`BUFFER_HANDLER_EXT`).
3. **Function stripping** (`FUNCTION_DISABLER_EXT`) – accessor/bridge results and
   app results can contain functions (and `App` instances). msgpack encodes them
   as a no-op extension so encoding never throws; they simply vanish.
4. **Secure fields** (`SECURE_FIELDS_HANDLER_EXT`) – an object carrying encrypted
   settings is tagged with an extension type so the child applies decryption
   *lazily on decode*, without walking the whole object tree.

## What Node's IPC channel provides

Enable it by adding `'ipc'` to `stdio`, e.g.
`stdio: ['pipe', 'pipe', 'pipe', 'ipc']`. Then:

- Parent: `child.send(msg[, cb])`, `child.on('message', msg => …)`.
- Child: `process.send(msg)`, `process.on('message', msg => …)`.

Node owns framing, ordering, and backpressure. Serialization is chosen by the
`serialization` spawn option:

| mode | mechanism | functions | `Buffer` / binary | notes |
|---|---|---|---|---|
| `'json'` (default) | `JSON.stringify`/`parse` | dropped silently ✅ | **lost** (Buffer → `{type:'Buffer',data:[…]}`) ❌ | loses binary efficiency |
| `'advanced'` | V8 structured clone (`v8.serialize`) | **throws `DataCloneError`** ❌ | native ✅ | also handles Date/Map/Set/BigInt/circular refs |

The realistic target is **`serialization: 'advanced'`**: it natively covers
framing (#1) and Buffers (#2), and is a native binary format (fast, no JS-side
codec overhead).

---

## Q1 — Does IPC remove the need for `@msgpack/msgpack`?

**Yes, the dependency can be removed**, and its footprint is tiny (two `codec.ts`
files). But `'advanced'` IPC only replaces two of msgpack's four jobs for free.
The other two need new code:

- **Functions (#3).** Under V8 serialization, sending an object graph that
  contains a function **throws `DataCloneError`** — strictly worse than today's
  silent drop. Both directions are affected (host accessor/bridge results and
  child app results can carry functions / `App` instances). We would need an
  explicit *sanitize/prune* pass before every `send()` to strip functions and
  other non-cloneable values. (`'json'` mode drops functions for free but
  regresses Buffers, so it is not a clean substitute.)
- **Secure fields (#4).** This currently piggybacks on msgpack's `ExtensionCodec`
  **decode hook**. `child_process` IPC does not expose the underlying
  `v8.Serializer`/`Deserializer`, so there is **no extension hook** to attach to.
  Secure-field handling must be re-implemented another way — e.g. an explicit
  marker property plus a targeted walk on the receiving side, or wrapping the
  encrypted payload. **This is the largest non-trivial work item.**

**Net:** removing msgpack is a trade, not a freebie. We delete the codec +
stream-decoder machinery and gain native framing/binary, in exchange for writing
(a) a function/uncloneable sanitizer and (b) a replacement secure-fields
mechanism. Contained blast radius, but real design work on (b).

## Q2 — Does IPC streamline communication?

**Yes — clear net simplification and robustness gain:**

1. **Deletes framing/transport plumbing on both sides.** Gone: the
   `decodeStream` loops, the child's `MessageQueue` + `stdoutTransport` +
   `setTransport` indirection, and the host's `ProcessMessenger` encoder/strategy
   switching. `child.send(obj)` / `on('message', obj)` hand back whole JS objects
   — no manual encode/decode step.
2. **Message-oriented, not byte-oriented.** Today a single decode error corrupts
   the shared buffer and forces a full process restart (`'DECODE_ERROR'` →
   `LivenessManager`). IPC delivers discrete messages, so one malformed message
   cannot desync the stream.
3. **Frees stdout/stderr for their real purpose.** Today the protocol *is*
   stdout, so any stray `console.log` from an app or one of its dependencies
   corrupts the channel, and metrics are squeezed through stderr and parsed
   heuristically. A dedicated IPC channel returns stdout/stderr to plain
   logging/diagnostics — a genuine robustness and DX win.
4. **Built-in flow control, ordering, backpressure, and lifecycle** via Node
   (`child.connected`, `disconnect`, `send` callback), plus the option to pass
   socket handles later if ever needed.
5. **Liveness ping/pong is unaffected** — the `_zPING`/`_zPONG` strings serialize
   fine over IPC.

### Honest caveats

- **Throughput.** For very large or very high-frequency payloads, a raw pipe with
  msgpack can be competitive; for this JSON-RPC workload, advanced-mode IPC is
  fine and typically faster than JS-side msgpack. Worth a quick benchmark if any
  hot path moves large `Buffer`s.
- **Prototypes not preserved.** V8 advanced serialization delivers plain objects
  (no class prototypes / `instanceof` after transit). msgpack has the same
  limitation, so existing code almost certainly already tolerates this — but it
  should be confirmed on both sides.
- **`undefined`.** Already normalized to `null` in the handlers
  (`typeof result === 'undefined' ? null : result`), so no change needed.

---

## Recommendation

Pursue it, in this order:

1. Add `'ipc'` to `stdio` and set `serialization: 'advanced'` in
   `NodeRuntimeSubprocessController.buildProcessConfiguration()`; swap
   `ProcessMessenger` / `stdoutTransport` for `child.send` / `process.send` and
   `on('message')`.
2. Introduce a shared **sanitizer** that strips functions/`App` instances and
   other non-cloneable values before send (replacing `FUNCTION_DISABLER_EXT`).
3. Re-implement **secure fields** without the extension-codec hook (the one piece
   of real design work).
4. Move metrics off stderr onto the IPC channel and let stdout/stderr revert to
   logging.
5. Delete both `codec.ts` files and drop `@msgpack/msgpack` from
   `packages/apps/package.json`.
6. Benchmark a Buffer-heavy path to confirm no throughput regression.

The Deno-compat Buffer handling in the codec is already vestigial after the Deno
runtime removal, so this migration also clears dead code.
