# Glossary

**Who this is for:** anyone hitting a Rocket.Chat-specific term in code, reviews,
or docs. **After reading:** the non-obvious vocabulary stops being a blocker.

Terms are grouped roughly by area. Many encode a deliberate design choice — the
"gotcha" lines are where people get burned.

---

## Real-time & transport

- **DDP** — Meteor's Distributed Data Protocol (WebSocket RPC + pub/sub). In
  Rocket.Chat, DDP methods are **legacy**; new client-server calls go through
  REST. See [realtime-and-ddp](../architecture/realtime-and-ddp.md).
- **Mergebox** — stock Meteor's server-side bookkeeping that keeps each client's
  Minimongo a live mirror of a server query. **We intentionally bypass it.**
- **Streamer** — our real-time mechanism: broadcasts discrete **events** clients
  react to, instead of syncing collection state.
  *Gotcha:* a subscription is a firehose of opted-in events, not a self-syncing
  query; and subscriptions are tracked **per connection, not per user**.
- **ddp-streamer** — the microservice that holds client WebSocket connections in
  scaled deployments (`ee/apps/ddp-streamer`).
- **Transporter** — how services talk to each other (`TRANSPORTER` env): **TCP**
  by default, **NATS** in the docker/production stack.

## Data & models

- **Models** — the typed MongoDB accessors in `@rocket.chat/models`
  (`Messages`, `Rooms`, `Users`, …). All **async**.
- **Proxify** — models and `core-services` are exposed as lazy **proxies**; a
  call resolves to the real implementation at runtime
  (`packages/models/src/proxify.ts`).
  *Gotcha:* a proxied call **waits** for its backing implementation/service to be
  available — a missing/misconfigured service makes calls hang rather than throw.
- **Updater** — pattern for atomic multi-field updates: accumulate changes with
  `Model.getUpdater()` then apply with `updateFromUpdater(query, updater)`
  (`IBaseModel`, `packages/models/src/updater.ts`). Prefer this over scattered
  `$set`s.
- **Raw model** — the underlying collection class (e.g. `*Raw`) behind a proxied
  model.

## API & validation

- **Typed API / `addRoute`** — REST endpoints are defined on the API class
  (`apps/meteor/app/api/server/ApiClass.ts`). New code uses the typed
  `.get()/.post()/...` pattern; older code uses `API.v1.addRoute()`. See
  [api-endpoint-migration](../api-endpoint-migration.md).
- **rest-typings** — `@rocket.chat/rest-typings`: per-endpoint request/response
  types **and** the **AJV** validators used at runtime.
  *Gotcha:* TypeScript types are compile-time only — runtime validation needs an
  AJV schema.
- **Error code convention** — `error-<domain>-<issue>` (e.g.
  `error-invalid-params`, `error-room-not-found`), thrown via `Meteor.Error` /
  service errors.

## Extension points

- **Callbacks** — in-repo hooks run at lifecycle points
  (`apps/meteor/server/lib/callbacks.ts`): event-style (`afterSaveMessage`) and
  transformative (return a modified value). Have priorities (HIGH/MEDIUM/LOW).
- **Apps-Engine** — the marketplace **App** SDK (`packages/apps-engine`). Apps
  react to events like `IPreMessageSentPrevent`, `IPreMessageSentExtend`,
  `IPostMessageSent`.
  *Gotcha:* post-events are often dispatched **fire-and-forget** (`void
  triggerEvent(...)`) so an app crash can't block core flows.
- **Settings registry** — admin-configurable settings registered at startup
  (`apps/meteor/app/settings/server/SettingsRegistry.ts`).
  *Gotcha:* `settings.get()` reads a fast **cache** that can lag the DB; use the
  model read when you need a guaranteed-fresh value.
- **Slash commands** — `/command` handlers
  (`apps/meteor/app/utils/server/slashCommand.ts`,
  `app/slashcommands-*/`).
- **Integrations / webhooks** — incoming/outgoing HTTP hooks with sandboxed
  scripts (`apps/meteor/app/integrations/server/`).

## Build & platform

- **Monolith** — the main Meteor app, `apps/meteor`. Most code lives here.
- **Workspace / Yarn workspaces** — the monorepo packaging; act on one with
  `yarn workspace <name> run <script>`.
- **Turborepo (Turbo)** — task runner/cache for `build`/`lint`/`testunit`/etc.
- **Fuselage** — Rocket.Chat's React design system (`@rocket.chat/fuselage*`,
  `fuselage-ui-kit`).
- **EE / Community Edition** — `ee/*` holds license-gated Enterprise code;
  without a license the app runs as Community Edition.
- **Apps-Engine vs Apps** — `packages/apps-engine` is the app SDK/runtime;
  `packages/apps` integrates it into the monolith.

---

**See also:** [architecture overview](../architecture/overview.md) ·
[critical-flows](../architecture/critical-flows.md)
