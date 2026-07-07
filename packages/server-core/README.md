# @rocket.chat/server-core

Meteor-free server runtime for Rocket.Chat, created to enable the incremental removal of Meteor from `apps/meteor`. See [`apps/meteor/METEOR_REMOVAL_PLAN.md`](../../apps/meteor/METEOR_REMOVAL_PLAN.md), especially §3.1 for this package's scope contract.

## Rules

1. **Never import from `meteor/*` here.** This package must run in a plain Node process.
2. **This package is not a 1-to-1 mirror of Meteor's API.** A Meteor idiom is not automatically a requirement. Every module is either:
   - a **target-architecture module** (`http`, `methods`, `accounts`) — designed as if Meteor never existed, composable by a future gateway or standalone service; or
   - a **transitional compat module** — a mechanical bridge for mass call-site migration, explicitly slated for deletion or re-homing after the migration.

   Meteor idioms that are neither (e.g. `check`/`Match`, function-level rate limiting) are **not replaced here** — validation belongs to endpoint/method schemas, rate limiting to transport middleware, small guards to `@rocket.chat/tools`.
3. Where a capability must be backed by Meteor during the transition, this package defines the interface and a registration hook; the Meteor-backed adapter lives in `apps/meteor/server/meteor-compat/` and is deleted at cutover.
4. Call sites migrate once: `import { X } from 'meteor/…'` → `import { X } from '@rocket.chat/server-core'`. Swapping the backing implementation later must not touch call sites.
5. After the migration this package is up for review: target-architecture modules may dissolve into focused packages; the compat area must be empty.

## Modules

- `onStartup` / `runStartupCallbacks` — **transitional** replacement for `Meteor.startup`. Callbacks registered before boot are run (sequentially awaited) by the server entrypoint; callbacks registered after boot run immediately, matching Meteor's semantics. End state: an explicit boot sequence in the server entrypoint.

Planned (see the migration plan): `http` (webServer facade), `methods` (schema-validated registry + AsyncLocalStorage invocation context), `accounts`.
