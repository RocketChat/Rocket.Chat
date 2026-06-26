# Watt / Platformatic discoverability spike — findings

**Date:** 2026-06-26
**Branch:** `spike/watt-discoverability`
**Goal:** Validate the apps-v2 design assumption: *"Watt/Platformatic as orchestrator, one worker thread per app, with per-worker resourceLimits + individual terminate."*

All examples are throwaway exploration code under `scratch/` and are runnable. Everything below is what was **actually observed** (commands run + real output), not what the docs claim.

---

## Versions installed

Node `v22.22.3`, npm via yarn 4.12.0. Packages (all `3.57.0`, the current latest 3.x line):

| package | version |
|---|---|
| `@platformatic/runtime` | 3.57.0 |
| `wattpm` | 3.57.0 |
| `@platformatic/node` | 3.57.0 |
| (transitive) `@platformatic/basic`, `@platformatic/itc`, `@platformatic/globals`, `@platformatic/foundation` | 3.57.0 |

> Note: `wattpm` is just the CLI wrapper. **None of the runnable examples use it** — everything boots through the `@platformatic/runtime` programmatic API.

To run the examples:

```sh
cd scratch
yarn install        # standalone project (has its own empty yarn.lock so it is NOT part of the RC yarn workspace)
node boot.mjs        # Q1, Q3 ping-pong, Q4 resourceLimits, Q5a/b graceful stop+start
node crash-test.mjs  # Q5c forced crash -> auto-restart
node metrics-test.mjs# Q6 Prometheus metrics
```

---

## Q1 — Programmatic API (no CLI). **VERDICT: YES, clean.**

The runtime is booted entirely from code via `create()` exported by `@platformatic/runtime`. No `wattpm`/`platformatic` CLI involved.

```js
import { create } from '@platformatic/runtime'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

// create(root, configFileOrConfigObject, context)
//  - setupSignals:false  -> do NOT install SIGINT/SIGUSR2 handlers (we own the host process)
//  - start:true          -> init() + start() all workers immediately
const runtime = await create(root, join(root, 'watt.json'), { setupSignals: false, start: true })

// runtime is an EventEmitter with a rich API:
runtime.getApplicationsIds()                       // ['ponger','pinger']
await runtime.getApplicationDetails(id, true)      // {status,...}; 2nd arg allowUnloaded
await runtime.startApplication(id) / stopApplication(id) / restartApplication(id)
await runtime.getMetrics('text' | 'json')
await runtime.inject(id, { method, url, ... })     // HTTP into a service without a socket
await runtime.sendCommandToApplication(id, name, msg) // low-level ITC command
await runtime.close()
```

Key signatures (from `node_modules/@platformatic/runtime/index.js` + `index.d.ts`):

- `create(configOrRoot, sourceOrConfig, context)` — the main entry. Returns a `Runtime`.
- `loadConfiguration(...)`, `wrapInRuntimeConfig(...)` — if you want to build/validate config separately.
- `new Runtime(config, context)` — the class is exported too, but `create()` is the supported path.
- `setupLoopbackMessaging(targetId, opts)` — lets the **host process** join the messaging mesh (see Q3 caveat).

The config can be a JSON file (as here) or, with a bit more plumbing (`loadConfiguration` / `wrapInRuntimeConfig`), an in-memory object. A config **file** is by far the least friction because app paths resolve relative to `root`.

---

## Q2 — Worker-thread-per-service. **VERDICT: YES, this is exactly Watt's model.**

Confirmed by reading `lib/runtime.js`: each application worker is a real Node `worker_threads.Worker`:

```js
import { Worker } from 'node:worker_threads'           // runtime.js:27
const kWorkerFile = join(import.meta.dirname, 'worker/main.js')  // shared bootstrap
...
const worker = new Worker(kWorkerFile, {
  workerData: { config, applicationConfig, worker: { id, index, count }, resourceLimits, ... },
  execArgv, env: workerEnv,
  resourceLimits: { maxOldGenerationSizeMb, maxYoungGenerationSizeMb, codeRangeSizeMb },
  stdout: true, stderr: true,
  name: workerId
})
```

- **One application = N worker threads**, where N is the per-app `workers` count (default 1). Set `workers: 1` per app to get exactly the "one thread per app" model.
- All workers share **one OS process** (confirmed empirically: every worker logged the **same `pid`**, e.g. `153302`). Isolation is thread-level (separate V8 isolate/heap), not process-level. **This is the single most important caveat for apps-v2:** a worker thread is NOT a process. There is no per-thread OS-level memory cgroup; isolation is V8 heap limits + the ability to terminate the thread. A native crash / OOM-killer event still takes down the whole host process. (V8 heap-limit overruns, however, are contained to the thread — see Q4/Q5.)
- The entrypoint app, if it has >1 worker, additionally needs `reusePort` (Linux) for load-balancing; the runtime warns and forces `workers:1` if unavailable. Non-entrypoint background apps can scale freely.
- App **types/capabilities**: a service declares `module: "@platformatic/node"` (generic Node app), or `@platformatic/service`/`@platformatic/gateway`/etc. For apps-v2, `@platformatic/node` with **`node.hasServer: false`** gives a pure background worker (no HTTP listener) — ideal for an app that only talks over messaging.

---

## Q3 — Minimal ping-pong. **VERDICT: WORKS. This is the core deliverable.**

Watt has **two** inter-thread channels:

1. **ITC** (`@platformatic/itc`, over each worker's `parentPort`) — the runtime's private control plane (start/stop/getStatus/getMetrics/...). Host→worker only. Reachable from code via `runtime.sendCommandToApplication(id, name, msg)` but only for handlers the runtime registers.
2. **Messaging mesh** (`MessagingITC`, over `MessageChannel` `MessagePort`s brokered by the runtime) — the **app-to-app** channel. This is the one to use for app business messages. Inside a worker it is `globalThis.platformatic.messaging`:
   - `messaging.handle(name, fn)` — register a request handler; return value becomes the reply.
   - `messaging.send(targetAppId, name, payload)` — request/reply to another app (Promise).
   - `messaging.notify(targetAppId, name, payload)` — fire-and-forget broadcast.

### Worker code

`scratch/apps/ponger/main.js` (the responder, a `hasServer:false` background service):

```js
const { messaging, logger } = globalThis.platformatic
messaging.handle('ping', payload => {
  logger.info({ payload }, '[ponger] received ping')
  return { reply: 'pong', echo: payload, repliedAt: Date.now(), pid: process.pid }
})
```

`scratch/apps/pinger/main.js` (the caller):

```js
const { messaging, logger } = globalThis.platformatic
const reply = await messaging.send('ponger', 'ping', { seq: i, from: 'pinger' })
logger.info({ reply }, `[pinger] got reply for seq=${i}`)
```

### Real output (`node boot.mjs`, trimmed)

```
[ponger] worker booting, registering "ping" handler
[pinger] worker booting (V8 heap_size_limit) heapLimitMb=144
[ponger] received ping  payload={"seq":1,"from":"pinger"}
[pinger] got reply for seq=1  reply={"reply":"pong","echo":{"seq":1,"from":"pinger"},"repliedAt":...,"pid":152357}
[ponger] received ping  payload={"seq":2,"from":"pinger"}
[pinger] got reply for seq=2  reply={"reply":"pong",...}
[ponger] received ping  payload={"seq":3,"from":"pinger"}
[pinger] got reply for seq=3  reply={"reply":"pong",...}
[pinger] done pinging
```

Three full request/reply round-trips between two worker threads. ✅

**Caveat on "host ↔ worker" specifically:** the messaging mesh is fundamentally **app↔app**. To have the *host* (parent runtime process) participate, you call `setupLoopbackMessaging(targetId)`, which mounts a loopback `globalThis.platformatic.messaging` in the host so the host can `send()`/`handle()` like any app. In testing this worked for setup but is timing-sensitive (the target handler must be registered first, or you get `PLT_ITC_HANDLER_NOT_FOUND`). For apps-v2, the robust pattern is **worker↔worker** business messaging plus the host using the **ITC control plane** (`stopApplication`, `getMetrics`, lifecycle events) for orchestration. If the host genuinely needs to exchange app messages, dedicate a small "coordinator" service rather than relying on loopback.

---

## Q4 — Per-worker V8 resourceLimits. **VERDICT: YES, fully supported, per-app, via config.**

Per-app `health.maxHeapTotal` / `health.maxYoungGeneration` / `health.codeRangeSize` (numbers or strings like `"256MB"`) are translated into the `Worker` `resourceLimits` option (`maxOldGenerationSizeMb`, `maxYoungGenerationSizeMb`, `codeRangeSizeMb`) in `runtime.js`:

```js
const maxOldGenerationSizeMb = Math.floor(
  (maxYoungGeneration > 0 ? maxHeapTotal - maxYoungGeneration : maxHeapTotal) / (1024*1024))
// passed to: new Worker(file, { resourceLimits: { maxOldGenerationSizeMb, maxYoungGenerationSizeMb, codeRangeSizeMb }})
```

These keys exist in the schema at **per-application** scope (`applications[].health`, `services[].health`, `web[].health`) AND a global default (`health` top-level, defaults: maxHeapTotal 4GB, maxYoungGeneration 128MB, codeRangeSize 256MB). So you can set a **different limit per app**.

### Proof (measured `v8.getHeapStatistics().heap_size_limit` inside each worker)

`watt.json` set ponger=`256MB`, pinger=`128MB`. Observed:

| app | `health.maxHeapTotal` | measured V8 `heap_size_limit` |
|---|---|---|
| ponger | 256MB | **288 MB** |
| pinger | 128MB | **144 MB** |
| (no limit / Node default) | — | **4144 MB** |

Different, low, and clearly driven by the per-app config. ✅ (The +16/+32MB deltas are V8 rounding plus the young-generation reservation.)

> The runtime ALSO runs a health checker (ELU + heap) that can restart a worker exceeding `maxHeapTotal` (`health.enabled`, `maxELU`, etc.) — a second, softer guard on top of the hard V8 limit.

---

## Q5 — Terminate / kill switch. **VERDICT: YES, on both axes.**

The runtime calls `worker.terminate()` internally (many sites in `runtime.js`: stop, start-timeout, crash cleanup, force-close). From code you get:

**(a) Graceful single-app stop & restart** — `node boot.mjs`:

```
=== stopApplication("ponger") ===
[EVENT] application:worker:exited {"application":"ponger","worker":0,"workersCount":1}
[EVENT] application:stopped "ponger"
ponger status after stop: stopped
=== startApplication("ponger") ===
[EVENT] application:worker:started {"application":"ponger","worker":0,"workersCount":1}
ponger status after restart: started
```

So `runtime.stopApplication(id)` / `startApplication(id)` / `restartApplication(id)` are the host's per-app kill switch. (A stopped app is fully unloaded — `getApplicationDetails(id)` then throws `PLT_RUNTIME_WORKER_NOT_FOUND`; pass `allowUnloaded=true` to get `{status:'stopped'}`. **Gotcha.**)

**(b) Forced crash → auto-restart** — `node crash-test.mjs`: the worker calls `process.exit(1)` (kills only its own thread, NOT the host — proving thread isolation). Runtime reaction:

```
[EVENT] application:worker:exited {"application":"crasher","worker":0,"workersCount":1}
[EVENT] application:worker:error  {"application":"crasher","worker":0,"workersCount":1,"code":1}
"The worker 0 of the application "crasher" unexpectedly exited with code 1."
"The worker 0 of the application "crasher" will be restarted in 5000ms ..."
... (5s backoff) ...
[crasher] RESTARTED boot -> surviving
[EVENT] application:worker:started {"application":"crasher","worker":0,"workersCount":1}
"The worker 0 of the application "crasher" has been successfully restarted ..."
```

So: a dead worker is auto-restarted (config `restartOnError`, **default true**; can be `false` or a numeric backoff ms). Events `application:worker:exited`, `application:worker:error`, `application:worker:started`, and `application:worker:unvailable` are all emitted on the `Runtime` EventEmitter — usable for apps-v2 supervision/alerting.

**Gotchas observed:**
- Auto-restart applies a backoff (~5000ms for a normal crash; "immediate" up to a threshold of 10). Not instantaneous.
- `restartOnError` is currently a **runtime-global** flag, not per-app, in 3.57.0 — to make one app non-restartable you'd need per-app handling on top.
- There is no public `runtime.terminateWorker(appId, index)` for a *specific worker index* in the typings; you operate at the **application** granularity (`stopApplication`). With `workers:1` per app (the apps-v2 model) that is exactly per-worker control, so this is fine for the design.

---

## Q6 — Observability freebies. **VERDICT: strong, mostly config-only.**

- **Metrics (Prometheus):** set `metrics: { enabled: true }` (or `metrics: true`) in config → done. `node metrics-test.mjs` got **49 metric families** out of the box, e.g. `platformatic_application_restarts_total`, `process_cpu_*`, `process_resident_memory_bytes`, `nodejs_heap_size_*`, `nodejs_eventloop_*`, plus HTTP metrics for services with a server. Scrape via the runtime's metrics server (configurable `port`/`endpoint`) or pull programmatically with `runtime.getMetrics('text'|'json')`. **Config, not code.**
- **Tracing:** `telemetry: { enabled: true, applicationName, exporter: [{ type: 'otlp'|'zipkin'|'console'|'file'|'memory', options }] }`. OpenTelemetry-based, auto-instruments HTTP + the messaging spans (the messaging layer already emits `startOutgoingMessagingSpan` / `traceIncomingMessagingHandler`). **Config, not code.**
- **Logging:** structured pino by default; per-worker logs are multiplexed to the host stdout (each line tagged with the app `name` and `worker` index, as visible in all output above). `logger.level`, `transport`, formatters all configurable.
- **Management API:** `managementApi: true` opens a control socket so an external CLI/tool (`wattpm` / `@platformatic/control`) can query status, metrics, logs, inject HTTP, restart apps — same surface as the programmatic `Runtime`/`ManagementClient`.

---

## Overall go/no-go: worker-thread-per-app + per-worker resourceLimits + individual terminate

# ✅ GO — the assumption holds, with documented caveats.

| Requirement | Result |
|---|---|
| Boot Watt from code, no CLI | ✅ `create()` |
| One worker thread per app | ✅ `workers:1`, real `worker_threads.Worker` per app |
| Per-worker V8 resourceLimits | ✅ per-app `health.maxHeapTotal/...` → measured 144MB vs 288MB vs 4144MB default |
| Individually terminate a worker | ✅ `stopApplication(id)` (per-app == per-worker at workers:1); forced crash handled |
| Restart / supervision | ✅ auto-restart on crash + lifecycle events on the Runtime EventEmitter |
| Observability | ✅ Prometheus + OTel + structured logs, config-only |

### The caveats apps-v2 must design around
1. **Threads share ONE OS process.** V8 heap limits + `terminate()` give soft isolation, but a native/abort/OOM-kill event in any worker downs the whole host. If hard process-level isolation per app is a hard requirement, worker threads are **not** enough — you'd need a process-per-app model (which Watt does not give you out of the box; it is thread-based by design). For untrusted third-party app code this is the biggest risk.
2. **Control granularity is per-application, not per-worker-index** in the public API. The apps-v2 "1 worker per app" choice sidesteps this, but if you ever want >1 worker per app you lose individual-worker addressing from the host.
3. **`restartOnError` is runtime-global** in 3.57.0; per-app restart policy needs extra handling.
4. **Business messaging is app↔app** (`globalThis.platformatic.messaging`); host↔worker is the ITC control plane. Host participation in app messaging via `setupLoopbackMessaging` works but is timing-sensitive — prefer a coordinator service or the control plane.
5. **Restart backoff** (~5s default) means crash recovery is not instant.
6. **Minor gotchas:** worker `process.cwd()` is the runtime root (not the app dir); `getApplicationDetails` on a stopped app needs `allowUnloaded:true`; entrypoint with >1 worker needs Linux `reusePort`.

### Recommended apps-v2 shape (validated here)
- Each app = a `@platformatic/node` service, `node.hasServer:false`, `workers:1`.
- Per-app `health.maxHeapTotal` for memory caps.
- Apps communicate via `globalThis.platformatic.messaging` (handle/send/notify).
- Host orchestrates via the programmatic `Runtime`: `start/stop/restartApplication`, `getMetrics`, and the `application:worker:*` events for supervision.
- Enable `metrics` + `telemetry` in config for free observability.

---

## Files in this spike

```
scratch/
  package.json, yarn.lock        # standalone (empty yarn.lock => not part of RC workspace)
  watt.json                      # runtime config: pinger + ponger, per-app health limits
  watt-crash.json                # runtime config: crasher (restartOnError)
  watt-metrics.json              # runtime config: metrics enabled
  boot.mjs                       # Q1/Q3/Q4/Q5a-b  (programmatic boot, ping-pong, stop/start)
  crash-test.mjs                 # Q5c             (forced crash -> auto-restart)
  metrics-test.mjs               # Q6             (Prometheus metrics)
  apps/pinger/  (main.js, watt.json, package.json)
  apps/ponger/  (main.js, watt.json, package.json)
  apps/crasher/ (main.js, watt.json, package.json)
```
