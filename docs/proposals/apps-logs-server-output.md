# Proposal: App logs print to the server log, and apps can opt out of DB records

## Status

Agreed — 2026-08-21. Not implemented. Every fact below is verified against the code at
`dfb5ad5ae8`.

## Problem

App logs exist only as MongoDB documents. `AppLogStorage.storeEntries` is the single exit, and the
admin marketplace log tab is the only reader. Three consequences:

1. An operator cannot see app output in the server's structured log stream, so no log collector
   picks it up.
2. Logs are batched per request. If an app hangs, times out, or its subprocess is SIGKILLed
   mid-request, `handleResultMessage` never runs and **every entry from that request is lost** —
   which is exactly the incident an operator wants to diagnose.
3. A chatty app fills the collection with records nobody reads, and the app author has no way to
   decline.

This document records two agreed changes: app logs also print to the server log through
`@rocket.chat/logger`, and an app can decline DB records in its constructor.

`docs/apps-engine-migration.md:21` already names standardizing on `@rocket.chat/logger` as a goal
of the apps-engine extraction. This is a step along that path.

---

## How a log entry travels today

1. `Logger` (`packages/apps/base-runtime/src/lib/logger.ts`) accumulates entries in memory for one
   JSON-RPC request. Nothing prints.
2. `messenger.successResponse` / `errorResponse` attach `logger.getLogs()` to the response payload,
   but only when `hasEntries()` is true.
3. `BaseRuntimeSubprocessController.handleResultMessage` receives the batch and calls
   `this.logStorage.storeEntries(logs)`.
4. `AppRealLogStorage.storeEntries` stamps `instanceId`, runs `redact` over every `entry.args`, and
   inserts one document per request batch.

### Facts that constrain the design

- A live channel already exists but is dead. `messenger.log()` sends a `log` notification, nobody
  calls it, and the host handler is `console.log('SUBPROCESS LOG', message)`.
- `@rocket.chat/apps` has no dependency on `@rocket.chat/logger`. The Meteor orchestrator already
  owns `new Logger('Rocket.Chat Apps', { redact: redactionFieldPaths })` and exposes it as
  `getRocketChatLogger()`. `AppManager` never receives it.
- Apps use 6 severities (`debug`, `info`, `log`, `warning`, `error`, `success`). pino has 6
  different ones.
- `getPino` creates the root pino at `level: 'warn'`, and `new Logger()` defaults each child to
  `warn` until `Log_Level` changes. `0→warn`, `1→info`, `2→debug`.
- `redactionFieldPaths` entries are rooted at the log object: `headers.cookie`, `user.password`,
  `request.query`, `params[0].room.customFields.*`.
- Three `storeEntries` call sites exist in the controller. Only one carries app-authored logs.

| Line | Source | Owner |
|---|---|---|
| 281 | `restartApp` | engine |
| 494 | `logUnhandledError` (uncaught / unhandled) | engine |
| 515 | `handleResultMessage` — the app's request batch | app |

---

## Feature 1 — app logs also print to the server log

### Emit point

The subprocess sends a live notification per log call. The host prints it. The response batch
stays and keeps feeding the DB unchanged, so each entry crosses the wire twice when `storeLogs` is
true. That cost buys durability: a print that happens at request end is lost on a hang or a kill.

Two properties of the transport make this safe:

- Log notifications and the response travel the same FIFO `MessageQueue`, and the host decodes
  stdout sequentially. A log line always reaches the host before the response that ends its
  request. No ordering hazard.
- `parseStdout` emits `heartbeat` for every decoded message, so log notifications feed the liveness
  watchdog. Harmless — an app that is logging is running.

### Verbosity

No gate of our own. Every entry maps to a pino level and the global `Log_Level` decides.
**On a default install (`warn`) only `warning` and `error` from apps appear.** This is accepted.
A dedicated apps log-level setting is out of scope.

### `packages/apps/base-runtime/src/lib/logger.ts`

- `addEntry` calls the existing `Messenger.log(entry)` — one notification per log call, carrying
  the single `Entry` (`{ caller, severity, method, timestamp, args }`). The host knows `appId` from
  `appPackage.info`, so the wire does not repeat it.
- `addEntry` serializes errors to real objects (`{ name, message, stack }`), at the top level
  **and** nested, via a `JSON.stringify` replacer. Today a top-level `Error` becomes a JSON
  *string*, and a nested one is destroyed:

  ```js
  JSON.stringify({ msg: 'x', err: new Error('boom') }, null, 2)
  // => { "msg": "x", "err": {} }
  ```

  The wrapper has no `stack` or `message` at its root, so it falls past both guards in `addEntry`.
  Without this fix there is almost never a real `.err` object to lift and pino's error serializer
  has nothing to render. The fix also improves the DB records. The admin viewer is shape-agnostic
  (`AppLogsItem.tsx:23` passes strings through and `JSON.stringify`s everything else, and
  `AppLogsItemEntry` pretty-prints the whole document), so there is no UI migration.
- `addEntry` skips accumulation when `AppObjectRegistry.get('storeLogs') === false`.
- New `clearEntries()`.

### `packages/apps/src/server/runtime/base/BaseRuntimeSubprocessController.ts`

- `case 'log'` replaces the `console.log('SUBPROCESS LOG', …)` stub.
- One shared formatter turns an `ILogEntry`-shaped record into a pino call.

  | App severity | pino level |
  |---|---|
  | `debug` | `debug` |
  | `info`, `log`, `success` | `info` |
  | `warning` | `warn` |
  | `error` | `error` |

  `msg` resolution, in order: a leading string arg; else `args[0].msg` when it is a string; else
  lift `args[0].err` to the top level as `err` so pino's error serializer renders it; else no
  `msg`.

  Fields: `{ appId, method, caller, severity, args }`. `severity` is explicit because `info`, `log`
  and `success` all collapse onto pino `info` and would otherwise be indistinguishable. The
  entry's own `timestamp` is dropped, because live emission makes pino's `time` equivalent.
- `restartApp` (281) and `logUnhandledError` (494) route their `AppConsole` entries through the
  same formatter. A restart loop or an uncaught exception currently leaves nothing in stdout at
  all, and this is the highest-value case for an operator.
- The controller gets its logger from `manager.getAppLogger(appId)`.

### `packages/apps/src/server/AppManager.ts`

- `IAppManagerDeps` gains `logger: Logger`. **Required**, used duck-typed, with no `instanceof`
  check — unlike the four existing deps. The 11 test constructions pass a minimal stub cast to
  `Logger`, so no pino instance and no `pino-pretty` transport worker runs inside `node --test`.
  (`getPino` enables the transport whenever `NODE_ENV !== 'production'`, and `packages/apps` tests
  run with `NODE_ENV=test`. pino transports keep the event loop alive.)
- `getAppLogger(appId)` memoizes `logger.section(appId)` in a `Map`.

  This memoization is required, not an optimization. `Logger.section()`
  (`packages/logger/src/index.ts:38`) registers `logLevel.on('changed', …)` and **discards the
  returned unsubscribe function**. `AppRuntimeManager.startRuntimeForApp` builds a fresh controller
  on every app enable and `stopRuntime` drops it, so one `section()` call per controller would leak
  one `logLevel` listener — plus the dead pino child it closes over — on every enable/disable
  cycle. Memoizing bounds the calls to one per distinct app. Fixing `packages/logger` to be
  disposable is the alternative; it was not chosen, to keep the change off a shared package.

### Redaction

App args nest under an `args` key, so none of the existing `redactionFieldPaths` match them. Left
alone, a slashcommand's `params[0].sender.password` or an outbound request's
`request.headers.authorization` would print in clear text to stdout while staying redacted in the
DB.

`redactor.ts` therefore also exports an `args[*].`-prefixed copy of every path, and the
orchestrator builds the logger with both lists. fast-redact supports intermediate array wildcards
(`a[*].c.d`), and pino children inherit the parent's redaction when they do not override it
(`pino/lib/proto.js:158` only replaces when `options.redact` is present), so `section(appId)` keeps
it.

### `packages/apps/package.json`

Gains `"@rocket.chat/logger": "workspace:^"`. `base-runtime` stays free of it — that code runs
inside the Deno and Node sandboxes and only needs `Messenger.log`. `@rocket.chat/apps-engine` must
never depend on it.

### `apps/meteor/ee/server/apps/orchestrator.ts`

Passes `this._rocketchatLogger` into `new AppManager({…})`.

---

## Feature 2 — an app declines DB records

### API

`packages/apps-engine/src/definition/IAppOptions.ts` — new file beside `IApp.ts`:

```ts
export interface IAppOptions {
	storeLogs?: boolean;
}
```

`App` takes a 4th optional constructor parameter, so `undefined` means `true` and every existing
app is unaffected:

```ts
super(info, logger, accessors, { storeLogs: false });
```

The flag is a **static property of the app**, declared once. A
`logger.stopPersisting()` method was considered and rejected: `mainLoop.requestRouter` creates
`new Logger(method)` per request and `wrapAppForRequest` makes `this.logger` resolve to that
per-request instance, so the receiver would live for one request and the method would have to
write process-wide state to have any lasting effect — a scope its receiver misrepresents. It would
also need to go on `ILogger`, forcing a no-op implementation in `AppConsole`, and its timing is
unconstrained, whereas `super()` cannot be called late. `App`'s own docstring already warns the
constructor "*might* be called more than once" and steers developers to `initialize()`.

`App` exposes `getOptions(): IAppOptions` — a whole-bag getter, so a second option needs no new
method. `construct.ts` cannot read a private field.

No defensive `typeof app.getOptions === 'function'` check is needed. `sandboxRequire`
(`node-runtime/src/lib/require.ts`) resolves `@rocket.chat/apps-engine` from the **runtime's**
copy, not the app's bundle, so every installed app extends the server's `App` base class.
`requiredApiVersion` gates only the types a developer compiles against.

### `packages/apps/base-runtime/src/handlers/app/construct.ts`

After the existing method checks, in this order:

1. read `storeLogs` from `app.getOptions()`
2. `AppObjectRegistry.set('storeLogs', storeLogs)`
3. when false: `logger.clearEntries()`, **then** log the "this app does not store logs" notice
4. return `{ storeLogs }` instead of `true`

Step 3's order matters. `App`'s base constructor calls
`this.logger.debug('Constructed the App …')`, which runs before the flag can be read. Without the
clear, `hasEntries()` is true and the construct batch is still attached and stored — for an app
that asked to go dark. The notice is logged *after* the clear, so it reaches stdout on the live
channel and is not accumulated.

`setupApp` currently discards the `app:construct` result, and both sides of this protocol ship in
the same package, so widening the return value is safe.

### `packages/apps/src/server/runtime/base/BaseRuntimeSubprocessController.ts`

- `setupApp` reads `storeLogs` from the `app:construct` result and stores it on the controller.
  Construct runs exactly once per spawn and `restartApp` re-runs it, so the value is always fresh.
- Default is `true` until construct returns. `logUnhandledError` can fire before construct
  resolves, and an unknown flag must not lose a crash record.
- **All three** `storeEntries` sites are guarded. Everything for that app goes dark in the DB,
  restart and crash records included.
- stdout is unaffected by the flag. `messenger.ts` needs no change, because `hasEntries()` is
  already false.

The trade-off is recorded deliberately: an app author can erase the evidence of its own crashes
from the admin UI. stdout still carries it, subject to `Log_Level`.

---

## Tests

`base-runtime`
- `addEntry` emits one `log` notification per entry.
- `storeLogs: false` leaves `hasEntries()` false, so neither `successResponse` nor `errorResponse`
  attaches logs.
- Top-level and nested errors keep `name`, `message` and `stack`.

Construct handler
- reads `storeLogs` off the instance and returns it
- clears entries and then emits the notice, in that order

Controller
- a `log` notification calls the child logger at the mapped level, with the expected fields
- `storeLogs: false` suppresses all three `storeEntries` sites

---

## Changeset

One file naming three packages, all `minor`: `@rocket.chat/apps`,
`@rocket.chat/apps-engine`, `@rocket.chat/meteor`. No new user docs — app-author documentation
lives on the developer docs site.

---

## Out of scope

- A dedicated config class centralizing env var reads and runtime settings. Wanted, tracked
  separately. The current surface in `packages/apps` is `APPS_ENGINE_RUNTIME_TIMEOUT`
  (`BaseRuntimeSubprocessController.ts:31`), `APPS_ENGINE_RUNTIME_BACKEND` (`AppRuntimeManager.ts:22`,
  read at **module load**), `DENO_DIR` (`AppsEngineDenoRuntime.ts:101`), `NODE_ENV`
  (`AppPermissionManager.ts:12`), and the 5 hard-coded liveness timings (`LivenessManager.ts:9`).
- An admin UI notice for an opted-out app. The flag stays reachable on the controller; the log tab
  stays silently empty until a follow-up. Note `GET /apps/:id/logs` has a strict ajv response
  schema (`required: ['offset', 'logs', 'count', 'total', 'success']`) and `useLogs.ts` is its only
  consumer.
- A dedicated apps log-level setting.
- A per-request opt-out.
- A severity threshold for storage. The storage unit is a whole request batch, so anything finer
  than all-or-nothing means filtering entries inside a batch or dropping batches by worst
  severity.
