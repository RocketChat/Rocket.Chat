# Node Runtime Migration Plan

## Executive Summary

This document outlines a plan to create a `node-runtime` that is functionally equivalent to the existing `deno-runtime`, which runs Rocket.Chat Apps in sandboxed subprocesses. The goal is to eliminate the Deno dependency while preserving identical behavior, leveraging Node.js's built-in TypeScript support and permission model.

---

## 1. Architecture Overview

### Current Architecture (Deno Runtime)

```
┌──────────────────────────────────────────────────────┐
│                   Main Node Process                  │
│  ┌─────────────────────────────────────────────────┐ │
│  │          AppRuntimeManager                      │ │
│  │    ┌─────────────────────────────────┐          │ │
│  │    │ DenoRuntimeSubprocessController │──────────┤ │
│  │    │  (implements IRuntimeController)│  stdio    │ │
│  │    └─────────────────────────────────┘  pipes    │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────┬───────────────────┘
                                   │ stdin/stdout (msgpack)
                                   │ stderr (metrics JSON)
                                   ▼
┌──────────────────────────────────────────────────────┐
│               Deno Subprocess                        │
│  deno run --allow-read=... --allow-env=... main.ts   │
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐   │
│  │  Handlers  │  │  Accessors │  │   Messenger  │   │
│  │  (app,api, │  │  (proxied  │  │   (jsonrpc   │   │
│  │   slash,..)│  │   bridges) │  │    over      │   │
│  └────────────┘  └────────────┘  │    msgpack)  │   │
│                                  └──────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Proposed Architecture (Node Runtime)

```
┌──────────────────────────────────────────────────────┐
│                   Main Node Process                  │
│  ┌─────────────────────────────────────────────────┐ │
│  │          AppRuntimeManager                      │ │
│  │    ┌─────────────────────────────────┐          │ │
│  │    │ NodeRuntimeSubprocessController │──────────┤ │
│  │    │  (implements IRuntimeController)│  IPC or  │ │
│  │    └─────────────────────────────────┘  stdio   │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────┬───────────────────┘
                                   │ IPC channel (structured clone)
                                   │ OR stdin/stdout (msgpack)
                                   ▼
┌──────────────────────────────────────────────────────┐
│               Node Subprocess                        │
│  node --permission --allow-fs-read=... main.ts       │
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐   │
│  │  Handlers  │  │  Accessors │  │   Messenger  │   │
│  │  (reused)  │  │  (reused)  │  │   (adapted)  │   │
│  └────────────┘  └────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────┘
```

---

## 2. Deno-Specific API Inventory

### 2.1 Direct Deno Global API Usages

| File | API | Purpose | Node Equivalent |
|------|-----|---------|-----------------|
| `main.ts:1` | `Deno.args` | CLI argument parsing | `process.argv.slice(2)` |
| `main.ts:2-3` | `Deno.stderr.writeSync()` | Sync stderr write | `process.stderr.write()` |
| `main.ts:8` | `Deno.exit(1001)` | Process exit | `process.exit(1001)` |
| `main.ts:101` | `Deno.stdin.readable` | Readable stream from stdin | `process.stdin` |
| `lib/messenger.ts:75` | `Deno.stdout` | Write to stdout | `process.stdout` |
| `lib/metricsCollector.ts:6` | `Deno.pid` | Get process ID | `process.pid` |
| `lib/metricsCollector.ts:19` | `Deno.stderr` | Write to stderr | `process.stderr` |
| `handlers/app/handleUploadEvents.ts:45` | `Deno.open()` with `using` | File open with dispose | `fs.createReadStream()` or `fs.promises.open()` |
| `handlers/app/construct.ts:69-71` | Shadowing `globalThis` and `Deno` | Sandbox isolation | Only shadow `Deno` (not needed) |

### 2.2 Deno Standard Library (`@std/*`) Usages

| File | Import | Purpose | Node Equivalent |
|------|--------|---------|-----------------|
| `lib/messenger.ts:1` | `writeAll` from `@std/io` | Complete write to stream | Manual loop or `stream.write()` with drain |
| `lib/metricsCollector.ts:1` | `writeAll` from `@std/io` | Complete write to stderr | `process.stderr.write()` |
| `lib/parseArgs.ts:1` | `parseArgs` from `@std/cli` | Parse CLI arguments | `node:util` `parseArgs` (Node >= 18.3) |
| `handlers/app/handleUploadEvents.ts:7` | `toArrayBuffer` from `@std/streams` | Stream to ArrayBuffer | `stream.consumers.arrayBuffer()` or manual buffer concat |

### 2.3 Deno Import Map / Config Features

| Feature | Location | Node Equivalent |
|---------|----------|-----------------|
| `deno.jsonc` import maps | `deno.jsonc:2-14` | `package.json` imports field or tsconfig paths |
| `.ts` file extension in imports | All files | Supported with `--experimental-strip-types` (Node 22.6+) or `--experimental-transform-types` |
| `npm:` specifiers | `deno.jsonc` | Standard `node_modules` resolution |
| `jsr:` specifiers | `deno.jsonc` | Not available — must use npm equivalents |

### 2.4 Deno Web API Usages (Available in Node)

These Web APIs are available in both Deno and Node (global scope):

| API | File | Compatibility |
|-----|------|---------------|
| `EventTarget` | `lib/messenger.ts:33` | ✅ Available in Node |
| `CustomEvent` | `main.ts:90` | ✅ Available in Node 18.7+ |
| `ErrorEvent` | `main.ts:86` | ⚠️ **NOT available in Node** — needs polyfill |
| `addEventListener('unhandledrejection')` | `error-handlers.ts:31` | ⚠️ Different API in Node (`process.on('unhandledRejection')`) |
| `addEventListener('error')` | `error-handlers.ts:32` | ⚠️ Different API in Node (`process.on('uncaughtException')`) |
| `TextEncoder` | `lib/metricsCollector.ts:11` | ✅ Available in Node |
| `Event` | `main.ts:83` | ✅ Available in Node |
| `Buffer` from `node:buffer` | Various | ✅ Native in Node |
| `createRequire` from `node:module` | `lib/require.ts` | ✅ Native in Node |
| `Socket` from `node:net` | `handlers/app/construct.ts` | ✅ Native in Node |

### 2.5 Deno-Specific Code Patterns

| Pattern | Location | Migration Action |
|---------|----------|-----------------|
| `// deno-lint-ignore` comments | Multiple files | Remove or replace with eslint equivalents |
| `@deno-types` directives | `lib/ast/mod.ts:3,5` | Remove — not needed in Node |
| `import.meta.resolve()` | `lib/require.ts:11` | Use `require.resolve()` or `import.meta.resolve()` (Node 20.6+) |
| `import.meta.url` | `lib/require.ts:3` | ✅ Available with ESM in Node |
| `using` keyword (explicit resource mgmt) | `handleUploadEvents.ts:45` | Supported in Node 22+ with `--experimental-transform-types` or rewrite |
| Socket `_final` monkey-patch | `construct.ts:17-24` | Remove — this is a Deno compatibility workaround |

---

## 3. Node Permission Model Mapping

### 3.1 Deno Permissions → Node Permissions

| Deno Flag | Purpose | Node Equivalent |
|-----------|---------|-----------------|
| `--allow-read=<dirs>` | Filesystem read | `--allow-fs-read=<dirs>` |
| `--allow-env=<vars>` | Environment variable access | Not granular per-var; use `--permission` flag which blocks all env unless explicitly granted. Alternative: strip env before spawning |
| `--allow-net` | Network access | No direct equivalent. `--permission` blocks `child_process` but doesn't restrict `net`/`http` |
| `--cached-only` | Prevent network fetch of modules | Not applicable — Node doesn't fetch modules over network |

### 3.2 Node Permission Model Details (Node 20+)

Node's `--permission` flag provides:
- `--allow-fs-read=<path>` — Restrict file reads to specific paths
- `--allow-fs-write=<path>` — Restrict file writes to specific paths
- `--allow-child-process` — Allow spawning child processes
- `--allow-wasi` — Allow WASI module usage

**Critical Gap**: Node's permission model does **NOT** provide:
- Per-environment-variable access control (Deno has `--allow-env=VAR1,VAR2`)
- Network permission control (Deno has `--allow-net` / `--deny-net`)
- FFI control (Deno has `--allow-ffi`)

### 3.3 Mitigation Strategies for Permission Gaps

#### Environment Variables
Deno: `--allow-env=NODE_EXTRA_CA_CERTS`
Node: Strip all env vars before spawning, pass only allowed ones via `env` option in `child_process.spawn()`:
```typescript
const environment = {
  env: {
    PATH: process.env.PATH,
    NODE_EXTRA_CA_CERTS: process.env.NODE_EXTRA_CA_CERTS,
    // Don't pass anything else
  },
};
```
This is **already done** in the Deno runtime controller — the `env` object in `spawnProcess()` only passes `PATH` and `DENO_DIR`. So this is effectively equivalent.

#### Network Permissions
Deno: `--allow-net` (or deny)
Node: No equivalent. Apps that shouldn't have network access would need alternative sandboxing (e.g., network namespaces, iptables rules, or a custom HTTP agent that blocks). For now, this is a **gap** — but since apps already go through the `Http` accessor proxy for HTTP requests, and the subprocess doesn't directly make network calls for most use cases, the practical impact is limited.

---

## 4. Node Built-in TypeScript Support

### 4.1 Current State (Node 22+)

Node v22.6+ introduced `--experimental-strip-types`:
- Strips TypeScript type annotations at load time
- Does **not** support enums, namespaces, or `const enum` (requires `--experimental-transform-types`)
- Does **not** do type checking — purely a transpilation step
- `.ts` file extensions are supported in imports

Node v22.7+ introduced `--experimental-transform-types`:
- Supports TypeScript enums and namespaces (transforms them)
- Still no type checking

### 4.2 Compatibility Assessment

The deno-runtime code uses:
- ✅ Standard type annotations → Compatible with `--experimental-strip-types`
- ✅ Type imports (`import type`) → Compatible
- ⚠️ `enum LogMessageSeverity` in `lib/logger.ts` → Requires `--experimental-transform-types`
- ✅ No `const enum` usage
- ✅ No TypeScript `namespace` usage

### 4.3 Recommended Approach

Use `--experimental-transform-types` flag when spawning the Node subprocess:
```
node --experimental-transform-types --permission --allow-fs-read=<paths> main.ts
```

This handles all TypeScript syntax used in the codebase. The `enum` in `logger.ts` is the only construct requiring transform (not just strip).

### 4.4 Import Path Considerations

The deno-runtime uses `.ts` extensions in imports (e.g., `import { Logger } from './lib/logger.ts'`). Node with `--experimental-strip-types` supports `.ts` extensions in imports **only when the file actually exists with that extension**, which it does in this case.

However, **import maps** (used via `deno.jsonc`) need to be replaced. The imports like:
```typescript
import type { App } from '@rocket.chat/apps-engine/definition/App.ts';
```
Use Deno's import map to resolve `@rocket.chat/apps-engine/` to the local `../src/` directory. In Node, this needs to be handled via:
1. `package.json` `imports` field for path mapping
2. Or symlinks/tsconfig paths
3. Or rewriting these imports in the node-runtime copy

---

## 5. File-by-File Migration Analysis

### 5.1 Files Requiring Changes

| File | Changes Needed | Complexity |
|------|---------------|------------|
| **`main.ts`** | Replace `Deno.args`, `Deno.stdin`, `Deno.stderr`, `Deno.exit()`. Replace `ErrorEvent`/`CustomEvent` usage or polyfill. Change `addEventListener` to `process.on`. | Medium |
| **`lib/messenger.ts`** | Replace `writeAll(Deno.stdout, ...)` with `process.stdout.write()`. | Low |
| **`lib/metricsCollector.ts`** | Replace `Deno.pid` with `process.pid`, `Deno.stderr` with `process.stderr`. | Low |
| **`lib/parseArgs.ts`** | Replace `@std/cli/parse-args` with `node:util` `parseArgs`. | Low |
| **`lib/codec.ts`** | Remove Deno-specific comment. No functional changes. | Trivial |
| **`lib/require.ts`** | Replace `import.meta.resolve()` (Deno's import map resolution) with Node's module resolution. Remove import map dependency. | Medium |
| **`error-handlers.ts`** | Replace `addEventListener('unhandledrejection')` with `process.on('unhandledRejection')`. Replace `addEventListener('error')` with `process.on('uncaughtException')`. Adapt event types. | Medium |
| **`handlers/app/construct.ts`** | Remove `prepareEnvironment()` Socket monkey-patch (Deno-specific workaround). Adapt `buildRequire()` to remove `npm:` prefix. Remove `Deno` shadowing in `wrapAppCode`. | Medium |
| **`handlers/app/handleUploadEvents.ts`** | Replace `Deno.open()` with `fs.promises.open()` or `fs.createReadStream()`. Replace `toArrayBuffer` from `@std/streams`. | Medium |
| **`deno.jsonc`** | Not needed — replace with `tsconfig.json` or `package.json` config. | N/A |
| **`lib/ast/mod.ts`** | Remove `@deno-types` directives. | Trivial |

### 5.2 Files Requiring No Changes

These files are already Node-compatible:
- `AppObjectRegistry.ts`
- `lib/logger.ts`
- `lib/requestContext.ts`
- `lib/wrapAppForRequest.ts`
- `lib/sanitizeDeprecatedUsage.ts`
- `lib/room.ts`
- `lib/roomFactory.ts`
- `lib/accessors/*` (entire directory)
- `handlers/api-handler.ts`
- `handlers/slashcommand-handler.ts`
- `handlers/videoconference-handler.ts`
- `handlers/scheduler-handler.ts`
- `handlers/outboundcomms-handler.ts`
- `handlers/listener/handler.ts`
- `handlers/uikit/handler.ts`
- `handlers/app/handler.ts` (and most sub-handlers)
- `handlers/lib/assertions.ts`

Note: While these files need no _functional_ changes, they do use `.ts` import extensions and `@rocket.chat/apps-engine/...` import paths that rely on Deno's import maps. In the node-runtime, module resolution must handle these paths correctly.

---

## 6. AppRuntimeManager Changes for Runtime Selection

### 6.1 Current Design

The `AppRuntimeManager` already supports runtime selection via a factory pattern:

```typescript
const defaultRuntimeFactory = (manager, appPackage, storageItem) =>
    new DenoRuntimeSubprocessController(manager, appPackage, storageItem);

export class AppRuntimeManager {
    constructor(
        private readonly manager: AppManager,
        private readonly runtimeFactory = defaultRuntimeFactory,
    ) {}
}
```

### 6.2 Required Changes

**Minimal changes needed** — the architecture is already runtime-agnostic:

1. **Create `NodeRuntimeSubprocessController`** implementing `IRuntimeController`:
   - This mirrors `DenoRuntimeSubprocessController` but spawns `node` instead of `deno`
   - Uses Node's permission flags instead of Deno's
   - No symlink workaround needed (Deno 2.x refuses node_modules, Node doesn't)

2. **Update the default factory** (or make it configurable):
   ```typescript
   // Option A: Environment variable
   const runtimeType = process.env.APPS_ENGINE_RUNTIME || 'node';

   const defaultRuntimeFactory = (manager, appPackage, storageItem) => {
       switch (runtimeType) {
           case 'deno':
               return new DenoRuntimeSubprocessController(manager, appPackage, storageItem);
           case 'node':
           default:
               return new NodeRuntimeSubprocessController(manager, appPackage, storageItem);
       }
   };
   ```

   ```typescript
   // Option B: Constructor parameter (already supported)
   // The host (Rocket.Chat server) passes the factory when constructing AppManager
   new AppRuntimeManager(manager, nodeRuntimeFactory);
   ```

3. **Shared infrastructure**: `ProcessMessenger`, `LivenessManager`, `codec`, and `bundler` are already Node-side code and can be reused as-is by the new controller.

### 6.3 Migration Strategy

Since the `IRuntimeController` interface is well-defined, both runtimes can coexist:
- Phase 1: Implement `NodeRuntimeSubprocessController` alongside existing Deno controller
- Phase 2: Test with feature flag (`APPS_ENGINE_RUNTIME=node`)
- Phase 3: Make Node the default, keep Deno as fallback
- Phase 4: Remove Deno runtime

---

## 7. IPC Performance Analysis: Node IPC vs stdio

### 7.1 Current Communication Pattern

```
Parent (Node) ──stdin──▶ Child (Deno)
Parent (Node) ◀─stdout── Child (Deno)
Parent (Node) ◀─stderr── Child (Deno)  [metrics only]

Protocol: msgpack-encoded JSONRPC over stdin/stdout pipes
```

### 7.2 Node IPC Channel

When spawning with `{ stdio: ['pipe', 'pipe', 'pipe', 'ipc'] }`, Node creates a dedicated IPC channel using Unix domain sockets (or named pipes on Windows). Messages are sent via:
- `child.send(message)` / `process.send(message)` — structured clone serialization
- Supports transferring `ArrayBuffer` and other structured-cloneable types

### 7.3 Performance Comparison

| Aspect | stdio + msgpack | Node IPC |
|--------|----------------|----------|
| **Serialization** | msgpack (binary, compact) | V8 structured clone (binary) |
| **Overhead** | Manual encode/decode | Built-in, optimized in C++ |
| **Throughput** | Good for large payloads | Good for frequent small messages |
| **Latency** | Low (pipe is fast) | Low (Unix domain socket) |
| **Message framing** | Must be handled manually (msgpack stream decoder) | Handled automatically by Node |
| **Data types** | Limited to msgpack types (+ custom extensions for Buffer) | Supports all structured-cloneable types natively |
| **Backpressure** | Manual queue management (as in messenger.ts Queue) | Automatic (kernel buffer + Node internals) |
| **CPU overhead** | msgpack encode/decode on both sides | V8 serialization (native, optimized) |
| **Memory** | Intermediate buffers for encode/decode | Direct V8 serialization |

### 7.4 Expected Performance Gains

**Moderate gains expected**, primarily from:

1. **Eliminated double serialization**: Currently, the parent encodes to msgpack, pipes to Deno, and Deno decodes. With IPC, V8's structured clone serialization is done natively in C++ on both sides.

2. **No custom framing logic**: The current msgpack stream decoder (`decodeStream`) must accumulate chunks and parse boundaries. IPC handles this automatically.

3. **Reduced CPU usage**: V8's structured clone is highly optimized native code, while msgpack encode/decode runs in JavaScript/WASM.

4. **Simpler error handling**: No need for the custom Queue class with manual backpressure management.

5. **Better type preservation**: Structured clone natively handles `Date`, `RegExp`, `Map`, `Set`, `ArrayBuffer`, `Buffer`, etc. without custom extension codecs.

**Quantitative estimate**: For typical JSONRPC messages (1-10 KB), expect 20-40% reduction in serialization overhead. For the overall request lifecycle (which includes actual app code execution, bridge calls, etc.), the IPC improvement would be **5-15%** of total time, since serialization is not the bottleneck.

### 7.5 IPC Considerations

**Advantages**:
- Simpler code (no custom encoder/decoder needed for transport)
- Native support for complex types
- Automatic message framing
- Built-in flow control

**Disadvantages**:
- IPC messages have a maximum size (~200MB, but effectively limited by memory)
- Slightly less portable (IPC channel is Node-specific)
- Can't use IPC channel for binary streaming (ping/pong optimization would need rethinking)
- The PING/PONG liveness check currently uses raw string commands (`_zPING`/`_zPONG`) on the same channel — with IPC, these would be regular messages

### 7.6 Recommendation

**Start with stdio + msgpack** (same as current implementation) to minimize migration risk, then optionally switch to IPC in a follow-up:

1. The msgpack codec and ProcessMessenger are already written, tested, and proven
2. Keeping the same transport makes the migration a pure runtime swap
3. IPC can be added as an optimization later without changing the runtime logic
4. This approach allows A/B testing between Deno and Node on identical communication paths

If IPC is pursued later, the changes would be:
- Replace `ProcessMessenger.strategySend` to use `child.send()` instead of `stdin.write()`
- Replace the subprocess's stdin decoder with `process.on('message', ...)`
- Remove the custom msgpack codec (or keep it as fallback)
- Adapt the PING/PONG protocol to work over IPC

---

## 8. Potential Problems and Risks

### 8.1 Critical Issues

1. **`ErrorEvent` is not available in Node.js**
   - Used in `main.ts:86` and `lib/messenger.ts:175`
   - Solution: Create a simple polyfill or use a different event pattern (e.g., custom event with an `error` property)

2. **Global `addEventListener` for error handling doesn't exist in Node**
   - Deno uses Web API-style `addEventListener('unhandledrejection', ...)`
   - Node uses `process.on('unhandledRejection', ...)`
   - The callback signatures are different:
     - Deno: `(event: PromiseRejectionEvent) => void`
     - Node: `(reason: any, promise: Promise<any>) => void`

3. **`import.meta.resolve()` with import maps**
   - Deno's `import.meta.resolve()` uses its import map (`deno.jsonc`) to resolve `@rocket.chat/apps-engine/...` paths
   - Node's `import.meta.resolve()` doesn't use import maps in the same way
   - The `lib/require.ts` file critically depends on this for resolving apps-engine paths
   - Solution: Use standard `require.resolve()` or compute paths relative to `__dirname`

4. **`using` keyword (Explicit Resource Management)**
   - Used in `handleUploadEvents.ts:45`: `using tempFile = await Deno.open(...)`
   - Node 22+ supports `using` with `--experimental-transform-types`
   - But `Deno.open()` returns a `Deno.FsFile` which has `[Symbol.dispose]` — Node's `fs.promises.open()` returns `FileHandle` which also has `[Symbol.dispose]` in Node 20+
   - Should work with adaptation

5. **`@std/streams` `toArrayBuffer()` replacement**
   - Node has `stream.consumers.arrayBuffer()` in `node:stream/consumers` (Node 16.7+)
   - Or: `const chunks = []; for await (const chunk of stream) chunks.push(chunk); Buffer.concat(chunks)`

### 8.2 Medium-Priority Issues

6. **Module resolution differences**
   - Deno uses import maps for `@rocket.chat/apps-engine/` → `../src/`
   - In production (npm package), these resolve to compiled `.js` files in the package
   - The `lib/require.ts` currently handles this with `import.meta.resolve()` + string replacement
   - Node will need a different approach: either a `package.json` imports field, tsconfig paths, or precomputed paths

7. **TypeScript support is experimental**
   - `--experimental-strip-types` and `--experimental-transform-types` are experimental flags
   - They may change behavior between Node versions
   - Risk: Breakage on Node updates
   - Mitigation: Pin minimum Node version, add CI tests for supported versions
   - Alternative: Pre-compile TypeScript to JavaScript at build time (more robust but loses the "built-in TS" benefit)

8. **Socket._final monkey-patch**
   - `construct.ts` patches `Socket.prototype._final` to work around Deno's different stream behavior
   - This patch should be **removed** in the Node runtime since it's not needed
   - But: Verify that removing it doesn't break any app behavior

9. **`buildRequire()` function differences**
   - Currently uses `npm:` prefix for external modules and `node:` prefix for native modules (Deno convention)
   - In Node, `require('uuid')` works directly from node_modules, no `npm:` prefix
   - The `require()` for `@rocket.chat/apps-engine/*` paths uses Deno's import map resolution

10. **Deno's `--cached-only` flag**
    - Prevents Deno from fetching modules over the network at runtime
    - Not applicable to Node (modules are resolved from filesystem/node_modules)
    - No action needed, but good to verify no dynamic imports fetch over network

### 8.3 Low-Priority Issues

11. **Test migration**
    - Deno tests use `Deno.test()` and `Deno.makeTempFile()`
    - Need to migrate to Node test runner or keep separate test infrastructure
    - Tests in `handlers/tests/` and `lib/tests/` directories

12. **`deno-lint-ignore` comments**
    - Cosmetic issue — remove all Deno-specific lint directives
    - Replace with `// eslint-disable-next-line` where needed

13. **Performance of TypeScript stripping**
    - Node's experimental type stripping adds startup time for each TypeScript file loaded
    - For a subprocess that starts once and runs indefinitely, this is a one-time cost
    - Benchmark: ~50-200ms additional startup vs. compiled JS

14. **`@deno-types` directives**
    - Used in `lib/ast/mod.ts` for acorn/acorn-walk type declarations
    - Node doesn't need these — TypeScript types come from `@types/*` packages
    - Verify type declarations are available via npm

15. **Node version requirements**
    - Permission model: Node 20+ (stable in 22+)
    - TypeScript strip: Node 22.6+
    - TypeScript transform: Node 22.7+
    - `CustomEvent`: Node 18.7+
    - Minimum requirement: **Node 22.7+**

---

## 9. Implementation Plan (Ordered Steps)

### Phase 1: Create node-runtime Directory Structure

1. Copy `deno-runtime/` to `node-runtime/` as baseline
2. Create `package.json` with npm dependency equivalents
3. Create `tsconfig.json` for Node TypeScript configuration
4. Set up `.gitignore`

### Phase 2: Adapt Core Infrastructure

5. **`main.ts`**: Replace all `Deno.*` APIs with Node equivalents
6. **`lib/messenger.ts`**: Replace `writeAll(Deno.stdout, ...)` with `process.stdout.write()`
7. **`lib/metricsCollector.ts`**: Replace `Deno.pid/stderr` with `process.pid/stderr`
8. **`lib/parseArgs.ts`**: Replace `@std/cli` with `node:util` parseArgs
9. **`lib/codec.ts`**: Remove Deno-specific comments, keep msgpack logic
10. **`lib/require.ts`**: Rewrite module resolution without import maps
11. **`error-handlers.ts`**: Rewrite for Node's error event system

### Phase 3: Adapt Handlers

12. **`handlers/app/construct.ts`**: Remove Deno workarounds, fix `buildRequire()`
13. **`handlers/app/handleUploadEvents.ts`**: Replace `Deno.open()` with `fs.promises.open()`

### Phase 4: Create Node Subprocess Controller

14. Create `src/server/runtime/node/AppsEngineNodeSubprocessRuntime.ts`
    - Implement `IRuntimeController`
    - Mirror `DenoRuntimeSubprocessController` structure
    - Use `node --permission --experimental-transform-types` flags
    - Reuse `ProcessMessenger`, `LivenessManager`, `codec`, `bundler`

### Phase 5: Update AppRuntimeManager

15. Add runtime selection logic (env var or config)
16. Create factory for Node runtime
17. Ensure both runtimes can coexist

### Phase 6: Testing

18. Migrate Deno tests to Node test runner
19. Run existing integration tests with Node runtime
20. Verify parity with Deno runtime behavior

### Phase 7: Documentation and Cleanup

21. Update package.json files list
22. Document configuration options
23. Add migration guide

---

## 10. Estimated File Changes Summary

| Category | Files to Create | Files to Modify | Files Unchanged |
|----------|----------------|-----------------|-----------------|
| node-runtime (new) | ~25 files (copied from deno-runtime) | 10 files need adaptation | ~15 files unchanged |
| src/server/runtime/node/ | 1 new controller file | 0 | 0 |
| src/server/managers/ | 0 | 1 (AppRuntimeManager) | 0 |

---

## 11. Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Node TypeScript support changes in future versions | Medium | Medium | Pin Node version, add CI tests |
| Permission model doesn't cover network access | Medium | High | Document gap, rely on accessor proxy |
| `ErrorEvent` polyfill causes subtle differences | Low | Low | Thorough testing |
| Module resolution breaks in production | High | Medium | Test in both dev and npm-published scenarios |
| Performance regression | Medium | Low | Benchmark before/after |
| Existing apps behave differently under Node | High | Low | Run full E2E test suite |

---

## 12. Decision Points Requiring Approval

1. **Use `--experimental-transform-types` vs. pre-compile TypeScript?**
   - Recommendation: Use experimental flag for simplicity, but have pre-compilation as fallback plan

2. **Start with stdio or IPC?**
   - Recommendation: Start with stdio (same as Deno) for minimal migration risk

3. **Keep both runtimes or replace Deno immediately?**
   - Recommendation: Keep both with env-var selection during transition

4. **Minimum Node version: 22.7+?**
   - This is required for `--experimental-transform-types`
   - If lower Node versions must be supported, pre-compilation is needed
