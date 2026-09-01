# The module boundary

> Part of the [Apps Engine host RFC](README.md).

**Status:** research report
**Scope:** what the host learns when an app — or an npm package inside the app's
bundle — reaches for a Node builtin, and what that observation costs. The
`networking` scope and the domain allow-list are
[42](../rfc/42-platform-permissions.md)'s business; this document assumes the
grant already said yes and asks what the host records afterwards.
**Method:** every number and every table below comes from a probe run against
this workspace — Node 22.22.3, Deno 2.3.1, esbuild as
[`bundler.ts`](../../apps/src/server/runtime/base/bundler.ts) configures it.

---

## 1. TL;DR

**Do not monkey patch the builtin modules.** Node already publishes the patch we
would write, at the only interception point that is complete, and it charges
7.5 ns for it. Take three records instead:

| # | Record | Mechanism | Answers |
|---|---|---|---|
| 1 | **load** | `sandboxRequire` — already the single chokepoint | *which builtins does this bundle touch at all* |
| 2 | **traffic** | `diagnostics_channel` → `net.client.socket` | *where did it dial, for how long, how many bytes* |
| 3 | **attribution** | `AsyncLocalStorage` around the JSON-RPC dispatch | *which handler call caused it* |

Four measured findings force this shape:

1. **The bundle funnels everything through one function.** esbuild rewrites the
   app's `import` *and* every bundled dependency's `require` into a literal
   `require("net")`, and the eval shell binds exactly one `require`
   ([`construct.ts:52-75`](../../apps/base-runtime/src/handlers/app/construct.ts)).
   The load record is therefore complete and free. [§3](#3-what-a-bundle-emits)
2. **A namespace `Proxy` is sound as a veto and unsound as a counter.**
   Destructuring reads the property once, at dependency init; the trap then
   never sees another call. Measured: two `net.connect` calls produced two
   observations, two `http.request` calls produced one. [§4.2](#42-the-namespace-proxy)
3. **Only the prototype is a complete interception point.** Patching
   `net.connect` misses `http.get` entirely, because `http` reaches for
   `net.createConnection`. `net.Socket.prototype.connect` catches all three
   paths — and `net.client.socket` is that same patch, maintained by Node.
   [§4](#4-the-four-interception-points-measured)
4. **The two runtimes do not see the same thing.** Deno publishes
   `net.client.socket` but no `http.*` channel, keeps its byte counters at zero,
   and routes `fetch` through native Rust where no channel fires at all.
   [§5.2](#52-deno-2-3-1)

**The price.** ~7.5 ns per socket, one `AsyncLocalStorage` around the dispatch,
and a documented blind spot the report does not paper over ([§8](#8-what-this-cannot-see)).

---

## 2. Where the boundary already is

There is one door, and we wrote it:

```
app source + bundled npm deps
        │  esbuild → a single CJS file, `require("net")` at every use site
        ▼
new Function('require', …)                construct.ts:52   ← the eval shell
        │  the ONE require binding the app can reach
        ▼
sandboxRequire(module)                    node-runtime/src/lib/require.ts:25
        │  allow-list, then the real require
        ▼
node:net · node:http · node:crypto · …
        │  Socket.prototype.connect
        ▼
dc.channel('net.client.socket').publish   ← Node's own patch
```

The runtime injects that door per platform —
[`node-runtime/src/main.ts:25`](../../apps/node-runtime/src/main.ts) hands over
Node's global `require`, [`deno-runtime/main.ts:46`](../../apps/deno-runtime/main.ts)
hands over a `createRequire` shim. Both land on the same
`setSandboxRequire` seam, so an instrument written once serves both.

> **One subprocess holds one app.** The controller is constructed with one
> `appPackage`
> ([`BaseRuntimeSubprocessController.ts:109`](../../apps/src/server/runtime/base/BaseRuntimeSubprocessController.ts)).
> The app axis of attribution is therefore free — the process *is* the app — and
> a process-global mutation carries no cross-tenant risk. Only the call axis
> needs work ([§6](#6-attribution)).

## 3. What a bundle emits

esbuild with `platform: 'node'` was given an app that imports three ways, plus a
dependency that requires two more. Every one of them came out as a literal
`require` call:

```js
// the bundled dependency, inlined verbatim
var require_dep = __commonJS({ "dep/index.js"(exports2) {
  var net = require("net");                    // ← call-time property read
  var { request } = require("http");           // ← init-time property read
  exports2.dial = (p) => net.connect(p);
}});

// the app's own source
var import_dep = __toESM(require_dep());
var tls = __toESM(require("tls"));             // import * as tls
var import_crypto = require("crypto");         // import { createHash } from 'crypto'
… (0, import_crypto.createHash)("sha256");     // ← call-time property read
```

**A bundled dependency is not a special case.** It has no import map, no
`node_modules`, and no way to reach a builtin except the same `require` the app
uses. This is the whole reason the load record is worth taking: it sees the
transitive dependency an author never mentioned.

## 4. The four interception points, measured

The probe wrapped each point, then made the same three outbound calls. `✓` means
the wrapper observed the call.

| Interception point | `http.get` | `net.connect` | `fetch` (undici) |
|---|:---:|:---:|:---:|
| `net.connect` on the module object | ✗ | ✓ | ✓ |
| `net.createConnection` on the module object | ✓ | ✗ | ✗ |
| `net.Socket.prototype.connect` | ✓ | ✓ | ✓ |
| `dc` channel `net.client.socket` | ✓ | ✓ | ✓ |

### 4.1 The module object

Patching the export object is the obvious monkey patch and it is **path
dependent**. `http.get` never calls `net.connect`; it calls
`net.createConnection`. `fetch` never calls `net.createConnection`; undici calls
`net.connect`. A wrapper on either one alone under-counts, and the miss is
silent — the number looks plausible and is wrong.

### 4.2 The namespace Proxy

This is the mechanism already in tree
([`modules/index.ts:47`](../../apps/src/server/compiler/modules/index.ts)). The
probe wrapped every module the bundle loaded and logged each trap:

```
load net · load http · get http.request · load tls · load crypto
get net.connect · get crypto.createHash · get tls.connect      ← app.run() #1
get net.connect · get crypto.createHash · get tls.connect      ← app.run() #2
```

`net.connect` appears twice for two calls. `http.request` appears **once for
two calls**, because the dependency destructured it at init. The rule:

> **A `get` trap counts property reads, not operations.** Destructuring, or a
> hoisted `const c = net.connect`, decouples the two permanently.

That makes the Proxy unfit for the traffic record and perfectly fit for the job
it already does: the deny-list on `createServer`
([`networking.ts:16`](../../apps/src/server/compiler/modules/networking.ts)).
A veto only needs to fire on the *first* read — destructuring makes it fire
earlier, not later. Keep it as a veto. Do not grow it into a meter.

### 4.3 The prototype

`net.Socket.prototype.connect` catches all three paths, because every path
eventually constructs a `Socket` and connects it. This is the correct patch.

### 4.4 The channel is that patch, maintained

Node publishes `net.client.socket` from the same place, on every Socket
construction. Writing our own prototype wrapper buys nothing and owes a
compatibility debt at every Node upgrade.

**Recommendation: subscribe, do not patch.**

## 5. What the channels actually give

### 5.1 Node 22.22.3

Probed by subscribing first, then making the call. `YES` means the channel fired.

| Channel | Fires | Note |
|---|:---:|---|
| `net.client.socket` | YES | every outbound socket — `net`, `http`, `https`, `fetch` |
| `net.server.socket` | YES | the deny-list that should stop `createServer` does not run — defect 3 |
| `http.client.request.created` | YES | carries method, host, path before the socket resolves |
| `http.client.request.start` / `response.finish` | YES | |
| `http.server.request.start` / `response.finish` | YES | |
| `undici:request:create`, `undici:client:sendHeaders` | YES | `fetch` only |
| `dns.lookup:*` / `tracing:dns.lookup:*` | no | no such channel in 22.x |
| `child_process`, `fs.operation`, `tls.*.handshake` | no | no such channel in 22.x |

The socket arrives **before it connects** — at publish time `_host` is `null`
and `remoteAddress` is `undefined`. It is a live handle, so the subscriber
attaches once and the facts arrive later:

```js
dc.subscribe('net.client.socket', ({ socket }) => {
  const ctx = als.getStore();                        // attribution, §6
  socket.once('lookup',  (_e, addr, _f, host) => …);  // 'localhost' → '127.0.0.1'
  socket.once('connect', () => …);                    // '127.0.0.1:46697'
  socket.once('close',   () => …);                    // bytesRead 106 / bytesWritten 61
});
```

DNS has no channel, but the socket's own `lookup` event carries the hostname the
app asked for **and** the address it resolved to. That is the pair the domain
allow-list cares about, and it costs one listener.

### 5.2 Deno 2.3.1

The same probe under the Deno runtime:

| | Node 22.22.3 | Deno 2.3.1 |
|---|:---:|:---:|
| `net.client.socket` fires | ✓ | ✓ |
| `http.client.*` fires | ✓ | ✗ |
| `undici:*` fires | ✓ | ✗ |
| peer address at `connect` | ✓ | ✓ |
| `bytesRead` / `bytesWritten` at `close` | ✓ | **always 0** |
| `fetch` observable at all | ✓ | **✗ — no event** |

Deno's `fetch` is native and never enters the node compatibility layer, so no
channel fires for it. Two consequences:

- **`net.client.socket` is the only portable channel.** Build the traffic record
  on it alone and let the `http.*` channels enrich the record where they exist.
- **The traffic record is best-effort, and its fidelity is a property of the
  runtime.** Stamp the runtime name on every record so a reader can tell a quiet
  app from a blind runtime.

## 6. Attribution

The channel publishes synchronously inside the app's own call, so an
`AsyncLocalStorage` entered at the JSON-RPC dispatch is visible in the
subscriber. Probed across an `await` and outside any handler:

```js
await als.run({ callId: 'rpc-1', handler: 'executePostMessageSent' }, dial);
await als.run({ callId: 'rpc-2', handler: 'executeSlashCommand' },
              async () => { await sleep(10); await dial(); });   // survives the await
await dial();                                                     // no run()
```

```json
[ { "callId": "rpc-1", "handler": "executePostMessageSent" },
  { "callId": "rpc-2", "handler": "executeSlashCommand" },
  null ]
```

> **`null` is the interesting value.** It means the app opened a socket while no
> handler was running — a timer or a listener it kept alive after it returned.
> That is the single most useful thing this record can surface, and it comes out
> of the mechanism for free.

## 7. The record and its route

The transport exists. stdout carries JSON-RPC
([`stdoutTransport.ts:10`](../../apps/node-runtime/src/lib/transports/stdoutTransport.ts)),
and **stderr already carries a JSON metrics channel** that the host parses —
`sendMetrics` writes it
([`metricsCollector.ts:15`](../../apps/base-runtime/src/lib/metricsCollector.ts)),
`parseError` reads it
([`BaseRuntimeSubprocessController.ts:571-575`](../../apps/src/server/runtime/base/BaseRuntimeSubprocessController.ts)).
Today it carries `{ pid, queueSize }` and the host only debug-logs it. Widen
that payload rather than opening a third channel:

```ts
type ModuleLoad  = { kind: 'load'; module: 'net'; specifier: 'node:net'; at: number };
type SocketClose = {
  kind: 'socket'; runtime: 'node' | 'deno';
  host: string; address: string; port: number;   // asked for, resolved to
  callId: string | null; handler: string | null; // null ⇒ outside a handler, §6
  ms: number; bytesRead: number; bytesWritten: number;
};
```

Two rules keep the volume bounded:

1. **Aggregate in the subprocess, not the host.** Emit a counter roll-up per
   host per interval, not one record per socket. A chatty app must not be able
   to flood the metrics channel by opening sockets in a loop.
2. **The load record is emitted once per module.** It is an inventory, not a
   counter; `sandboxRequire` is called once per specifier per app load anyway.

## 8. What this cannot see

Stated plainly, because a number no one has bounded is worse than no number:

| Blind spot | Why |
|---|---|
| Deno's `fetch` | native; no channel, no socket |
| bytes under Deno | the compat `Socket` does not keep the counters |
| a UDP socket, a raw `dgram` | `dgram` is not on the allow-list, so it cannot load — but nothing observes it if it ever is |
| an app that unsubscribes us | `dc.unsubscribe` is public API and the app shares the process |
| work inside a retained function reference | the load record still fires; only the Proxy's per-read count would miss it, and we do not use it |

The last row is the honest frame for the whole document. **This is telemetry,
not a boundary.** An app that means to hide its traffic can, because it runs in
the same process as the instrument. The value is that an app that is *not*
hiding — the overwhelming majority, and every bundled dependency, which has no
idea it is being watched — becomes legible.

## 9. The price

Measured over 3,000,000 iterations:

| Operation | ns/op |
|---|---:|
| raw module property read | 1.2 |
| **Proxy** passthrough property read | 43.0 |
| **Proxy** counting property read | 44.0 |
| `channel.publish`, no subscriber | 1.4 |
| `channel.publish`, one subscriber | 7.5 |

A Proxy costs 35× a raw property read. Against a socket that is nothing; against
`crypto`, `buffer`, `path` and `util` — hot modules with no IO to observe — it is
pure loss. **Proxy the two modules that need a veto. Leave the rest unwrapped.**

The channel costs 7.5 ns against a syscall. It is free.

## 10. Four defects the probes turned up

Each is checkable and independent of whether this report's recommendation ships.

1. **`tls` is not loadable, but `https` is.**
   [`require.ts:1-19`](../../apps/node-runtime/src/lib/require.ts) omits `tls`,
   so a bundled dependency that imports it dies with `Module tls is not allowed`
   after the app installed cleanly. The esbuild output in
   [§3](#3-what-a-bundle-emits) shows exactly that emission.

2. **The allow-list matches by prefix.**
   `normalized.startsWith(mod)` ([`require.ts:30`](../../apps/node-runtime/src/lib/require.ts))
   admits any specifier beginning with an allowed name:

   | Specifier | Verdict | Intended |
   |---|---|---|
   | `node:fs/promises` | pass | pass |
   | `crypto-js` | pass | deny |
   | `osmosis` | pass | deny |
   | `utils`, `urllib`, `stream-chain` | pass | deny |

   Compare against a normalized exact name, plus an explicit `/` sub-path rule.

3. **`requireNativeModule` is orphaned.** Nothing imports
   [`modules/index.ts:47`](../../apps/src/server/compiler/modules/index.ts) —
   grep returns the definition and no call site. The `createServer` deny-list
   and the `networking` permission check inside it therefore do not run in
   either subprocess runtime. The allow-list is the only surviving control.

4. **The process permission model already covers everything except the
   network.** Under the node runtime's flags
   ([`AppsEngineNodeRuntime.ts:22-24`](../../apps/src/server/runtime/node/AppsEngineNodeRuntime.ts)):

   | Operation | Result |
   |---|---|
   | `fs.readFileSync` inside an allowed dir | allowed |
   | `fs.writeFileSync` | `ERR_ACCESS_DENIED` |
   | `child_process.spawnSync` | `ERR_ACCESS_DENIED` |
   | `new Worker(…)` | `ERR_ACCESS_DENIED` |
   | `net.connect` | **allowed — the model has no network permission** |

   This is the argument for the whole report in one table. The kernel-level
   controls handle the filesystem and the process tree for us. The network is
   the one capability apps genuinely need, that no flag constrains, and that
   only an in-process instrument can describe.

## 11. Recommendation

1. Wrap `sandboxRequire` to emit **one load record per specifier**, then call
   through. It is 15 lines, it is platform-independent, and it is the only part
   of this an app cannot route around without giving up builtins entirely.
2. Subscribe to **`net.client.socket`** in both runtime bootstraps. Attach
   `lookup` / `connect` / `close` to the published socket. Enrich with
   `http.client.request.created` where the runtime publishes it.
3. Enter an **`AsyncLocalStorage`** at the JSON-RPC dispatch carrying
   `{ callId, handler }`, and read it in the subscriber.
4. Aggregate in the subprocess; emit over the **existing stderr metrics
   channel**; stamp the `runtime` on every record.
5. Keep the namespace `Proxy` for `net` / `http` / `https` **as a veto only**,
   and re-attach it — it is dead code today (defect 3).
6. Do not write a prototype patch. Do not patch a module export object.

## 12. Open questions

1. **Does the traffic record feed enforcement?** The domain allow-list under the
   `networking` scope ([42](../rfc/42-platform-permissions.md)) is gated at the
   `ctx.http` client boundary. A socket opened by a bundled dependency never
   passes that gate. Is an observed off-list host an alert, a disable, or a row
   in an admin table?
2. **Retention and cardinality.** A per-host counter per app per interval is
   cheap; a per-socket row is not. Which one does the admin surface need?
3. **Does the app author see this?** A "this app dialed 3 hosts you did not
   approve" panel is the strongest use of the record, and it is a product
   decision this document does not make.
4. **Deno's blind `fetch`.** Shadowing `fetch` in the Deno bootstrap globals
   ([`deno-runtime/main.ts:47`](../../apps/deno-runtime/main.ts) already shadows
   `Deno`) would restore the record. Is a wrapped `fetch` worth the divergence
   between the two runtimes' globals?
