# 0001 — App entry point & transport-agnostic definition

Status: **accepted** (grilling round 2, 2026-06-24)
Scope: how a v2 app is authored, loaded, and connected to a host.

## Context

- A v2 app is **one app per package**, bundled into a **single file** that the runtime
  **evals whole**. App code therefore always executes — there is no "inspect without
  running" via static analysis.
- The runtime injects a **patched `require`**, so when the app imports
  `@rocket.chat/apps-engine/next`, the objects it receives (`defineApp`, and the capability
  `ctx`) are **runtime-controlled**, not library globals. Registration "side effects" land
  in a runtime-owned object, not global state.
- We want a single definition to run **embedded** (inside the host's runtime) today and
  **remote** (the app process connects to a host over the network) later — the design-doc
  goal "design the API as if network/remote is coming".

## Decision

### 1. The entry point is a runtime-invoked factory: `defineApp(setup)`

```typescript
import { defineApp } from '@rocket.chat/apps-engine/next';

export default defineApp((app, ctx) => {
  app.registerSlashcommand({ command: 'hello', /* … */ });
  app.on('message:pre', async (e) => e.continue);
});
```

- The author exports a **factory** as the module default. The driver (embedded runtime, or
  `connect`) **invokes** it when it wants — separating "code is loaded" from "an app
  instance exists". This seam serves the reconciler: enable → disable → re-enable and
  subprocess restarts can re-instantiate cheaply.
- The factory **mutates the `AppBuilder`** (`app.on(...)`, `app.registerSlashcommand(...)`)
  and returns `void | Promise<void>`. Async allows setup-time I/O (e.g. read a setting
  before registering). `defineApp` — not the factory — returns the resolved app.
- Because the factory may run more than once, **setup must be free of one-time side
  effects.**

Rejected alternative: **captured singleton** (`const app = createApp(); app.on(...)` at
module top level, runtime reads its reference back after eval). Marginally simpler authoring
but freezes construction at eval time and gives the reconciler no re-instantiation seam.

### 2. Typing: identity helper + brand + runtime guard

TypeScript **cannot** constrain the shape of a foreign module's `default export` from the
library side. So we invert it: the library exports a helper that *consumes* a typed factory
and *produces* a branded result.

```typescript
declare const brand: unique symbol;
export type App = { readonly [brand]: 'ResolvedApp' };   // opaque, unforgeable by authors

export type AppBuilder = {
  on<E extends EventName>(event: E, handler: Handler<E>): void;
  registerSlashcommand(cmd: SlashcommandDescriptor): void;
  // …
};
export type AppSetup = (app: AppBuilder, ctx: AppSetupContext) => void | Promise<void>;

export function defineApp(setup: AppSetup): App;
```

- The constraint lives on the **`setup` parameter** (fully checked, with inference).
- The return is a **branded `App`** authors cannot forge — `defineApp` is the only way to
  mint one.
- The **runtime validates the brand** on load: a default export lacking the brand (forgot
  `defineApp`, `export default 42`) is rejected with a precise error. This is the
  enforcement TS can't provide.
- TS guarantees *"if you used `defineApp`, you used it correctly"*; the runtime brand-check
  guarantees *"you used `defineApp` at all."*
- Optional belt-and-suspenders: the app scaffold's `tsc` step typechecks the entry file
  against `const _: App = (await import('./entry')).default`. This lives in **tooling**, not
  the SDK types.

### 3. `AppSetupContext` (second factory arg)

Construction-time needs only — **not** data repositories (those belong on the per-event
`ctx`). For now:

```typescript
type AppSetupContext = { logger; info; settings };   // expandable later
```

Mirrors v1's `initialize(configurationExtend, environmentRead)` split, cleanly separated.

### 4. The definition carries no transport (the future-proofing invariant)

> **The `App` definition never embeds or imports its transport. Every host capability
> (repositories, bridges, settings) is injected by whoever drives the factory** — the
> embedded runtime, or `connect`. Handlers and `setup` may only reach the host through
> injected `ctx`/builder, never through a module-level connection.

Consequences:

- **`hostUrl` does NOT go on the authored entry.** Connection target is a *deployment*
  concern, not a *definition* concern; baking it into source breaks portability and is
  meaningless to the embedded runtime.
- **Remote mode is a separate bootstrap** that drives the same definition:

  ```typescript
  import app from './app';
  import { connect } from '@rocket.chat/apps-engine/next/standalone';

  await connect(app, { hostUrl: 'https://example.rocket.chat', /* credentials */ });
  ```

  `connect` is the explicit analog of what the embedded runtime does implicitly: it builds a
  network-backed `ctx` and invokes the **same** `setup` factory with the **same**
  `AppBuilder` + `AppSetupContext`. Only the injected implementations differ.
- Remote thus reduces to a **transport swap behind the injected `ctx`**. `connect(app: App,
  …)` consumes the same brand `defineApp` mints — one contract, two drivers.

`@rocket.chat/apps-engine/next/standalone` and `connect`'s full options are **reserved,
named-but-unspecified** surface for now.

## Open / deferred

- Full `connect` signature, credentials/auth model for remote mode.
- Exact `AppBuilder` event names and contribution descriptors (later decisions).
- Whether the manifest also carries a contribution summary for the admin install screen,
  derived/validated against the factory (later decision).
