# Watt runtime for the Apps-Engine

## TL;DR

`AppsEngineWattRuntime` is an **opt-in** runtime that manages Rocket.Chat apps
through a single [Platformatic Watt](https://github.com/platformatic/platformatic)
instance instead of spawning one Node `child_process` per app.

- **One process, many workers.** A single Watt runtime hosts every app as an
  *application* running in its own Worker Thread. There is no per-app subprocess.
- **Watt owns liveness, restarts and metrics.** The `LivenessManager` (ping/pong
  watchdog) used by the subprocess runtime is **not** reused. Worker supervision
  comes from Watt's health checks and worker-lifecycle events; metrics come from
  Watt's `getMetrics` API.
- **Same protocol.** Apps still speak the exact same JSON-RPC protocol. Only the
  transport (Node IPC → Watt inter-thread channel) and the process/worker
  lifecycle owner change.

The default runtime is unchanged: the Node subprocess runtime remains the
`defaultRuntimeFactory`. Selecting Watt is done by swapping in
`wattRuntimeFactory`.

## Architecture

```
                         ┌─────────────────────────────────────────────┐
                         │  Rocket.Chat host process                    │
                         │                                              │
  AppRuntimeManager ───► │  AppsEngineWattRuntime  (one per AppManager) │
                         │        │  owns 1 Watt Runtime                 │
   WattRuntimeController │        │  ┌──────────── Watt Runtime ──────┐  │
   (one per app) ◄──────►│  ◄────►│  │  Worker Thread: app A          │  │
        protocol state   │  sendCommandToApplication / worker events   │
                         │        │  │  Worker Thread: app B          │  │
                         │        │  └────────────────────────────────┘  │
                         └─────────────────────────────────────────────┘
```

Two classes make up the runtime:

- **`AppsEngineWattRuntime`** — the shared, process-wide manager (one per
  `AppManager`). It owns the single Watt `Runtime`, adds/removes/starts/stops apps
  as Watt applications, routes inbound worker messages to the right controller,
  and implements the restart bookkeeping and metrics fan-out that Watt drives.
- **`WattRuntimeController`** — one per app, implements `IRuntimeController` just
  like `NodeRuntimeSubprocessController`. It owns the JSON-RPC protocol state
  machine (requests, responses, ready/timeout handling) and the host-side request
  routing, but delegates *transport* and *worker lifecycle* to the shared manager.

### Shared request routing

The accessor/bridge dispatch that apps use to call back into the host was
extracted from `BaseRuntimeSubprocessController` into a transport-agnostic
`AppRequestRouter`. Both the subprocess controller and the Watt controller now
route those security-sensitive calls through the same code path (namespace
allow-list, `APP_ID` impersonation guard, ConfigurationExtend hijack during
restart).

### Transport

The base-runtime message loop is now transport-agnostic:

- Outgoing (app → host) goes through a swappable `HostTransport`
  (`setHostTransport`). The default is the `child_process` IPC channel; the Watt
  worker bootstrap swaps in a Watt inter-thread transport.
- Incoming (host → app) is provided to `startMainLoop(incoming)` as an
  `IncomingTransport`. The default subscribes to `process.on('message')`; the Watt
  worker subscribes to Watt's inter-thread channel.

The app bundle itself still travels over the JSON-RPC `app:construct` call, so the
Watt worker entrypoint (`watt-runtime/dist/main.js`) is generic and shared by
every app; Watt distinguishes workers by application id.

### Liveness, restarts and metrics — without the LivenessManager

| Concern    | Subprocess runtime                             | Watt runtime                                                             |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| Liveness   | `LivenessManager` ping/pong watchdog           | Watt worker health checks (ELU/heap) + `application:worker:unhealthy`     |
| Crash      | `child.on('exit'/'error')` → `restartApp`      | `application:worker:exited` / `application:worker:error` → `restartApp`   |
| Restart    | Kill + re-spawn the subprocess                 | `runtime.restartApplication(id)` (Watt re-creates the worker)            |
| Restart cap| `LivenessManager.maxRestarts` + restart log    | `AppsEngineWattRuntime` restart counter + logs, gives up → `stopApp`      |
| Metrics    | Ad-hoc, over the IPC channel                    | `runtime.getMetrics('json')`, polled and fanned out per app             |

`AppsEngineWattRuntime` still enforces a restart limit and records every restart
against the app's log (as the `LivenessManager` did), but the actual worker
lifecycle is Watt's responsibility.

## Enabling the Watt runtime

1. Install the optional dependency:

   ```sh
   yarn workspace @rocket.chat/apps add @platformatic/runtime @platformatic/node
   ```

   It is loaded lazily (`loadWattRuntime`) so the package builds and runs without
   it when the subprocess runtime is used.

2. Construct the `AppRuntimeManager` with `wattRuntimeFactory`:

   ```ts
   import { AppRuntimeManager, wattRuntimeFactory } from './managers/AppRuntimeManager';

   const runtimeManager = new AppRuntimeManager(appManager, wattRuntimeFactory);
   ```

## Integration seams to validate against the installed Watt version

Two spots bind the Apps-Engine channel to Watt's inter-thread communication and
should be confirmed against the exact `@platformatic/runtime` version in use:

- **Host side** — `AppsEngineWattRuntime.wireRuntimeEvents` listens for
  `application:worker:message` to receive app-initiated messages, and uses
  `sendCommandToApplication` to push messages to a worker.
- **Worker side** — `watt-runtime/src/lib/wattChannel.ts` uses
  `globalThis.platformatic.messaging` to send to the runtime host and to handle
  host commands.

The per-app metric attribution in `collectMetrics` assumes each metrics entry
carries an `application` label; adjust the mapping if the installed version
structures `getMetrics('json')` differently.
