# Apps v1 — Current Architecture (analysis)

Purpose: a grounded, file-referenced snapshot of **what the Apps SDK and engine look like today**, so
the v2 design discussion in [`../apps-v2-sdk-design.md`](../apps-v2-sdk-design.md) can be argued
against the real implementation rather than from memory. This describes *what exists*, not what we
want to build.

## The one structural fact to internalize

The "apps SDK" is **two packages**:

| Package | What it is | What's in it |
|---|---|---|
| `@rocket.chat/apps-engine` | the **app-facing contract** apps compile against | only `src/definition/` — types, the `App` base class, accessor/event/contribution interfaces, manifest types, exceptions |
| `@rocket.chat/apps` | the **engine** that implements that contract | `AppManager`, `ProxiedApp`, managers, storage, bridges, compiler, the Deno/Node subprocess runtimes |

Apps never import from `@rocket.chat/apps`. Both are in scope for the v2 rewrite.

## Documents

1. **[01 — App-facing SDK](./01-app-facing-sdk.md)** (`apps-engine`)
   The `App` class & `AppStatus`; the accessor SDK (`IRead`/`IModify` + readers/builders/extenders,
   persistence, HTTP); the event/listener model (timing × context × `check*`/`execute*`); contributions
   (slashcommands, api, settings, UIKit, scheduler, …); manifest & permissions; exceptions. Maps each
   piece to the "problems we're solving" in the design doc.

2. **[02 — Engine architecture & app state](./02-engine-architecture-and-state.md)** (`apps`)
   `AppManager` as god-object; the **state model** (status triplicated across subprocess / in-memory
   item / DB; `previousStatus` vs `getStatus()`); the full lifecycle/state-transition flows
   (load → enableAll, install, enable/disable, update, remove, license refresh); storage
   (`IAppStorageItem`); the ~16 managers and how each gates behavior on status. *(Primary answer to
   "how is app state management done today.")*

3. **[03 — Runtime sandbox, bridges & compiler](./03-runtime-and-bridges.md)** (`apps`)
   The out-of-process Deno(default)/Node subprocess model over JSON-RPC/msgpack; accessor proxies and
   the `bridges:`/`accessor:`/`app:` namespaces; the bridge `do*` permission-wrapper pattern (and the
   silent-denial defect); compiler/packaging; the orchestrator glue and converter layer.

## How this connects to `apps-v2-sdk-design.md`

Quick index from v1 reality → v2 intent:

- "API too bureaucratic" → `App` class + `read.get*Reader().getById` + `modify.get*().start*()…finish()`
  + per-entity converters (doc 01 §1–2, doc 03 §4).
- "Reads inflexible / eager resolution" → bespoke `IMessage.sender: IUser` and the parallel `*Raw`
  types; every read is an RPC (doc 01 §2.7, doc 03 §5).
- "Permissions insufficient" → bridge `do*` denies by logging + returning `undefined` (doc 03 §2.1).
- "AppManager has too many responsibilities" → the god-object inventory (doc 02 §2).
- "App install/lifecycle too complex" + "two desired states + reconciler" → the 12-value `AppStatus`,
  triplicated state, and manual enable/disable fan-out (doc 02 §3, §5).
- "Use core-typings instead of bespoke types" → the converter tax (doc 03 §4).
- "Local now, designed as if remote is coming" → the RPC subprocess boundary already exists (doc 03 §1).
