# ADR 0005 — Node's IPC channel carries the host↔subprocess protocol

## TL;DR

- The subprocess is spawned with an `'ipc'` file descriptor and `serialization: 'advanced'`. Both
  halves exchange whole messages through `send()` and `on('message')`.
- `@msgpack/msgpack` is gone. Node frames the messages and V8's structured clone serializes them,
  `Buffer` included.
- The two jobs the codec did that structured clone does not are re-homed: a sanitizer strips
  functions and `App` instances before every send, and the subprocess walks each incoming message to
  apply secure fields.
- stdin is closed. stdout and stderr carry logs again, which the host forwards. The subprocess
  metrics are deleted instead of moved: their only field was a pid that the host already has.
- Deleted with the byte stream: the outbound queue and its `queueSize` metric, the transport
  indirection, both stream decoders, and the `DECODE_ERROR` restart path.
- Not benchmarked. The case is the deleted plumbing and the failure modes that go with it.

## Status

**Accepted — implemented.**

- **Date:** 2026-09
- **Scope:** `packages/apps` — the transport under the JSON-RPC bridge: host, `base-runtime`,
  `node-runtime`
- **Builds on:** [ADR 0004](./0004-in-house-jsonrpc-types-plain-msgpack-envelopes.md). The envelope,
  the factories and the guards are unchanged; this ADR replaces only what carries them
- **Unblocked by:** `679eb978db chore(apps): remove the Deno runtime (#41201)`. The IPC channel is a
  Node feature, and until that commit one of the two runtimes was Deno

## Decision

1. **The transport is Node's IPC channel.** The host spawns with
   `stdio: ['ignore', 'pipe', 'pipe', 'ipc']` and `serialization: 'advanced'`. `ProcessMessenger`
   calls `child.send()`, and the runtime's `ipcChannel.send()` calls `process.send()` and settles on
   its callback. Each side receives with `on('message')`.
2. **msgpack is removed.** Both `codec.ts` files and the `@msgpack/msgpack` dependency go. Framing
   and binary values are native to the channel.
3. **A sanitizer replaces the function-stripping extension.** `src/lib/IpcSanitizer.ts` is one
   implementation shared by both halves, and it runs on every message before the send. It replaces
   functions, symbols and `App` instances with `undefined`, and preserves `Buffer`, `Date`,
   `RegExp`, `Error`, `Map`, `Set`, shared references and cycles.
4. **The subprocess applies secure fields by walking the message.** `applySecureFieldsDeep` runs on
   each incoming message before the envelope guards see it, and applies `applySecureFields` wherever
   the `'@@SecureFields'` marker sits, at any depth. The marker is a plain string key, so structured
   clone carries it.
5. **The subprocess metrics are deleted.** They carried `{ pid }`, which the host already has from
   the spawn, and the host only wrote them to its debug log. `queueSize` is deleted together with
   the queue that reported it. The subprocess answers `_zPING` with a bare `_zPONG` only.
6. **stdout and stderr are logs.** The host pipes both and forwards every chunk to its own console.
   The sandbox shell stops shadowing `console`, so app output reaches the subprocess's real streams.
7. **stdin is `'ignore'`.** Nothing writes to it any more.
8. **Liveness keeps its shape.** `_zPING` and `_zPONG` stay bare strings, any other message still
   counts as a heartbeat, and the miss counter is unchanged. Only the `DECODE_ERROR` restart path
   goes: a channel that delivers discrete messages cannot desync.

## Context

The protocol used to ride stdin and stdout as a msgpack byte stream. The host wrote encoded bytes to
`child.stdin` and read `child.stdout` through `newDecoder().decodeStream()`; the subprocess read
`process.stdin` the same way and pushed outgoing messages through a queue and a transport onto
`process.stdout`. stderr was a side channel: the metrics went out as JSON and the host parsed each
chunk heuristically.

That shape had three costs. The protocol *was* stdout, so a stray `console.log` from an app or one
of its dependencies corrupted the channel — which is why the sandbox funnelled every console method
to stderr. A single bad chunk desynced the stream decoder for good, so the host carried a
`DECODE_ERROR` restart path. And the framing, the queue and the transport were ours to maintain on
both sides.

The IPC channel removes all three, because Node owns framing, ordering and backpressure, and hands
each side whole objects.

### What the codec did, and where each job lands now

| Job | Before | Now |
| --- | --- | --- |
| Framing | `Decoder.decodeStream()` over a byte stream | the channel delivers discrete messages |
| Binary values | ext 1, copying the backing `Uint8Array` | native to structured clone |
| Function stripping | ext 0, written as a no-op extension | `sanitizeForIpc`, before every send |
| Secure fields | ext 2, a decode hook on marked objects | `applySecureFieldsDeep`, a walk after receive |

The first two are free. The other two are the price of the change, and decisions 3 and 4 are what
they cost.

### The two serialization modes

| Mode | Mechanism | Functions | `Buffer` |
| --- | --- | --- | --- |
| `'json'` (default) | `JSON.stringify` / `JSON.parse` | dropped silently | lost — `{ type: 'Buffer', data: [...] }` |
| `'advanced'` | V8 structured clone | **throws `DataCloneError`** | native |

`'advanced'` is the only mode that keeps a `Buffer`, and `app:executePreFileUpload` carries one. So
the throw on functions is the cost of admission, and it is strictly worse than the silent drop it
replaces — a sanitizer that misses a path fails the whole send rather than losing a field.

## Consequences

- **The sanitizer is mandatory, not an optimization.** Both accessor results on the host and app
  results in the subprocess legitimately carry functions and `App` instances. Every send walks its
  message; the codec walked it too, inside the encoder.
- **Secure fields cost a full walk of every incoming message**, where the extension hook fired only
  on the objects that carried the marker. The walk is in the subprocess, on the receive path, and it
  mutates the structure in place except for the marked objects, which it replaces.
- **`error.data: <Error>` changes shape rather than becoming useful.** msgpack encoded only own
  enumerable properties, so a raw `Error` decoded to `{}`. Structured clone keeps `name`, `message`
  and `stack`, and drops every *other* own property — including anything mutated onto that `Error`,
  such as `logs`. A declared `data` shape per code is the fix.
  [ADR 0006](./0006-apps-subprocess-protocol.md) decides it.
- **`JsonRpcError` keeps its shape, on a new argument.** It stayed off `Error` because msgpack
  encodes only own enumerable properties. Structured clone carries an `Error` through its own path
  instead, which keeps `message` and drops `code` and `data`. Same conclusion, different reason.
- **Prototypes still do not cross.** `instanceof` holds only for a payload this process built, as it
  did under msgpack.
- **An absent slot is still distinguishable from a present-and-undefined one**, so the factories
  keep omitting the optional slots rather than assigning `undefined`.
- **One malformed message can no longer desync the channel**, which is what retires the
  `DECODE_ERROR` restart path.
- **stdout is safe for app output**, so the sandbox no longer has to shadow `console`.
- **stderr is error output only.** The metrics used to share it, and the host told them apart with
  a parse attempt on each chunk. With the metrics gone, the host forwards every stderr chunk as an
  error log.
- **No throughput measurement was taken.** The feasibility study that preceded the change
  (`50a6078dbf`, since deleted) asked for a `Buffer`-heavy benchmark, and it was not run. ADR 0004's
  numbers measure the envelope, not the transport, and they still stand. See the follow-ups.

## Alternatives considered

### `serialization: 'json'`

Rejected. It drops functions for free, which is the one thing `'advanced'` makes us pay for, but it
loses `Buffer` — a file upload would arrive as `{ type: 'Buffer', data: [...] }`. Paying for the
sanitizer is cheaper than re-encoding binary payloads by hand.

### msgpack over the IPC channel

Rejected. It keeps the codec, both extension hooks and the dependency, and adds V8 framing on top of
msgpack framing. The only thing it buys is the ext-0 and ext-2 hooks, which decisions 3 and 4
replace with 84 and 80 lines of plain TypeScript.

### Keep stdin/stdout

Rejected. The protocol-on-stdout hazard, the desync path and the hand-maintained framing are the
three things this ADR removes, and they are all properties of the byte stream.

### Keep the secure-fields hook by owning the serializer

Not available. `child_process` IPC does not expose the underlying `v8.Serializer` and
`v8.Deserializer`, so there is no extension point to attach to. This is what forces the walk in
decision 4.

## Follow-ups

1. **Benchmark a `Buffer`-heavy path.** The change shipped unmeasured. `app:executePreFileUpload`
   with a large file is the fixture that matters, and ADR 0004's harness is the closest prior art.
   A raw pipe with msgpack can beat the channel on very large or very frequent payloads, and nothing
   here rules that out for the upload path.
2. **`protocol/` still has to be built.** [ADR 0006](./0006-apps-subprocess-protocol.md) decides
   that extraction, and the sanitizer and the secure-fields walk are part of what moves into it.

## Reference index

### This decision

- Spawn options and stream forwarding: `packages/apps/src/server/runtime/base/BaseRuntimeSubprocessController.ts`
- Host send path: `packages/apps/src/server/runtime/base/ProcessMessenger.ts`
- Sanitizer: `packages/apps/src/lib/IpcSanitizer.ts`; tests `packages/apps/tests/lib/IpcSanitizer.test.ts`
- Runtime send path and receive loop: `packages/apps/base-runtime/src/lib/messenger.ts`;
  `packages/apps/base-runtime/src/mainLoop.ts`
- Secure fields: `packages/apps/base-runtime/src/lib/secureFields.ts`; marker and mapper
  `packages/apps/src/lib/SecureFields.ts`; round-trip test
  `packages/apps/tests/server/runtime/SecureFieldsIpcCompatibility.test.ts`
- Liveness: `packages/apps/src/server/runtime/base/LivenessManager.ts`

### Commits

- Sanitizer: `5ba38505e6`
- Secure fields at any depth: `7443e77b79`
- The transport switch: `233c3149df`
- Metrics removal: `8c4cdc07df`
- The sandbox console: `910cf80477`
- Codec and dependency removal: `104a1860a5`
