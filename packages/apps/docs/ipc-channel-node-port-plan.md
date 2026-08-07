# Port plan: Node IPC channel for node-runtime, Deno runtime preserved

## Goal

Bring the IPC-channel transport improvement (currently on
`claude/deno-runtime-port-feasibility-pht64c`, where it ships *after* deleting
the Deno runtime) onto `develop` **without removing the Deno runtime**.

- node-runtime → Node's built-in IPC channel (`stdio:[…,'ipc']`,
  `serialization:'advanced'`).
- deno-runtime → unchanged: stdin/stdout + `@msgpack/msgpack`.
- Runtime selection stays `APPS_ENGINE_RUNTIME_BACKEND` (default `node`, `deno`
  opt-in) — the customer rollback path this plan protects.

## Core constraint

Node IPC is Node-only: `stdio:'ipc'` relies on `NODE_CHANNEL_FD` + Node's
internal control-message protocol; `process.send` / `process.on('message')`
only work in a Node child. A Deno subprocess spawned by Node does not implement
it. So Deno MUST stay on msgpack/stdout; only Node moves to IPC.

## Principle

The improvement commits *delete* the shared seams (child `Transport`
abstraction, the stdin decode loop, both `codec.ts`) rather than branching on
them. The port re-expands those seams: add the IPC path **alongside** msgpack,
selected per runtime — not as a replacement. Keep `@msgpack/msgpack`, both
`codec.ts`, and every Deno file / CI / Docker artifact.

---

## 1. Transport model

Keep + extend the child `Transport` seam; add a symmetric host concept. Two
implementations selected per runtime:

- `IpcChannel` (node): out `process.send(sanitizeForIpc(m))`; in
  `process.on('message')`; `process.on('disconnect') → exit`.
- `StdioChannel` (deno): out `stdout.write(encoder.encode(m))`; in
  `decoder.decodeStream(process.stdin)`. Identical to today.

---

## 2. Host — `packages/apps/src/server/runtime/`

### `node/AppsEngineNodeRuntime.ts`
- `buildProcessConfiguration()` returns `options.stdio =
  ['ignore','pipe','pipe','ipc']` and `options.serialization = 'advanced'`.
- Mark transport = `ipc`.

### `deno/AppsEngineDenoRuntime.ts`
- Unchanged. transport = `stdio` (default pipes; needs a writable stdin for
  msgpack).

### `base/BaseRuntimeSubprocessController.ts`
- `spawnProcess()`: stop hardcoding stdio/serialization — take them from
  `buildProcessConfiguration()`.
- Branch inbound handling on transport:
  - ipc: `process.on('message', parseSubprocessMessage)`; stdout/stderr → plain
    log (`parseOutput` / `parseError` as on the branch).
  - stdio: keep `parseStdout(stdout)` decode-loop + `DECODE_ERROR` →
    `LivenessManager`; keep `parseError` metrics-from-stderr.
- `parseSubprocessMessage` (from the branch) is the per-message body of the old
  loop — reuse for both paths (the stdio loop calls it per decoded message).
  Single source of message logic.
- Keep the additive `case 'metrics'` notification handler (harmless for both).

### `base/ProcessMessenger.ts`
- Retain BOTH strategies. Pass the transport type in (e.g.
  `setReceiver(process, mode)`).
  - ipc: `connected`-gated `send(sanitizeForIpc(m))`.
  - stdio: `stdin.writable`-gated `stdin.write(encoder.encode(m))` +
    `newEncoder()`.
- Do NOT delete the msgpack strategy.

### `base/codec.ts`
- KEEP.

---

## 3. Child — `packages/apps/base-runtime/` (SHARED — must stay dual)

### `lib/messenger.ts`
- RESTORE `Transport` / `setTransport` / `noopTransport`. Keep `MessageQueue` +
  `encoder` path for stdio.
- Add the ipc send path behind the injected transport — NOT a top-level
  `process.send`. Keep the `sanitizeForIpc` import out of the shared eager path
  (import it inside the node adapter, or lazily) so a Deno TS-source load never
  forces resolution of node-only code.
- send helpers dispatch through the injected transport.

### `mainLoop.ts`
- Keep the branch's extracted `handleIncomingMessage(message)`.
- Feed it from the injected source:
  - ipc: `process.on('message', …)` + `disconnect → exit`.
  - stdio: `for await (const m of decoder.decodeStream(process.stdin))`.
  - Adapter picks (split `startIpcLoop` / `startStdioLoop`, or inject source).
- Inbound secure fields: run `applySecureFieldsDeep` ONLY on the ipc path — the
  Deno codec decode-hook already resolves them. (correctness — see risks)
- `startMainLoop` stays sync for ipc; keep the async loop for stdio.

### `lib/metricsCollector.ts`
- ipc: `sendNotification({ method:'metrics', params:[collectMetrics()] })`.
- stdio: keep the stderr JSON write.
- Branch per transport. `queueSize` only meaningful for the stdio queue.

### `lib/secureFields.ts`
- Additive: keep `applySecureFields`, add `applySecureFieldsDeep`. Safe as-is.

### `handlers/app/construct.ts`
- GATE the "restore natural console" change:
  - ipc: natural `console.*`.
  - stdio (deno): KEEP the redirect to stderr — stdout is the protocol channel,
    natural logging corrupts it.
- Pass the flag via `setSandboxGlobals` / bootstrap.

---

## 4. Adapters

### `node-runtime/src/main.ts`
- Wire `IpcChannel`: `setTransport(ipc)`, install `process.on('message')` loop,
  natural console, `process.send` guard (branch's
  `typeof process.send !== 'function'` → exit).
- node is ipc-only, so the node `stdoutTransport` can be removed. Keep the
  base-runtime stdio impl for deno.

### `deno-runtime/main.ts`
- Unchanged: `setTransport(stdoutTransport)`, stdin loop, `Socket._final` hack,
  `Buffer`/`Deno` globals, console-to-stderr.

---

## 5. New files

- `src/lib/IpcSanitizer.ts` — port as-is (compiled to dist; node uses dist).
  Keep it unreferenced on the deno path.

## 6. Keep (do NOT port the Deno-removal group)

Dockerfiles Deno install, `.tool-versions`, `deno-cache.js`, CI deno steps,
release-action deno metadata, `deno/*.ts`, `denoRuntimeFactory`, the
`APPS_ENGINE_RUNTIME_BACKEND` switch, `@msgpack/msgpack`, `test:deno`.

## 7. Tests

- Keep `SecureFieldsCodecCompatibility.test.ts` (Deno codec still live).
- Branch's `deno/ → base/` test moves: put shared ones in `base/`, keep
  deno-specific ones.
- Add: `IpcSanitizer.test.ts` (port), `applySecureFieldsDeep` cases,
  `metricsCollector` ipc-vs-stderr, `ProcessMessenger` dual-strategy.
- If feasible, run e2e matrix with `APPS_ENGINE_RUNTIME_BACKEND=node|deno`.

---

## Risk register

1. **Console corruption on deno** — must gate `construct.ts`. HIGH.
2. **Shared base-runtime eagerly importing ipc / `process.send`** — keep behind
   transport injection. MED.
3. **Double secure-fields on deno** — gate the deep-walk to ipc. LOW /
   correctness.
4. **Metrics host-side** — deno keeps stderr parse; node ipc `metrics` case;
   verify both handled. LOW.
5. **`serialization:'advanced'` prototype loss** — same as msgpack, already
   tolerated. LOW.

## Sequencing

1. Host: pluggable stdio/serialization + dual `ProcessMessenger` + dual inbound.
2. Child: restore `Transport` seam + dual `mainLoop` source.
3. Add `IpcSanitizer` + deep secure-fields (ipc-gated).
4. Gate console + metrics per transport.
5. node adapter → ipc; deno adapter untouched.
6. Tests, both backends.
7. Bench a buffer-heavy node path (optional).
