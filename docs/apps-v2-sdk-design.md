# Apps v2 SDK — Design Context

Status: **in-progress design grilling**. This captures motivations, locked decisions, and open
questions for a full rewrite of the Rocket.Chat apps SDK (`@packages/apps`, `@packages/apps-engine`).
Pick up from the "Open questions" section.

---

## Goal

A v2 apps SDK — a from-scratch rewrite for a better architecture. Large multi-session effort. This
document is the running spec/context, not the final design.

## Problems we're solving (from v1)

- **API too bureaucratic** — apps must implement a class; reads go through
  `read.get[Entity]Reader().getById`; writes go through
  `modify.getCreator().start[Entity]()` → builder → `finish(builder)`; per-entity types diverge from
  core and need conversion classes; events carry timing prefixes (`IPreMessageSent`), context
  suffixes (`...Prevent`/`...Extend`) and two methods each (`check*`/`execute*`).
- **Reads inflexible** — v1 `IMessage`/`IRoom` imply eager relationship resolution (e.g.
  `IMessage.sender: IUser`), making fetches costly and list endpoints impractical.
  - NOTE established during grilling: this is an **apps-engine invention**. Core `IMessage` already
    carries `u: Pick<IUser, …>` (an *unresolved* reference). Adopting core-typings fixes eager
    resolution for free; the real question becomes "how does an app resolve a reference *when it
    wants to*" — a Repository concern.
- **Permissions insufficient** — denied calls log to server console but throw nothing; the app can't
  detect the failure at runtime.
- **Hard to keep parity with HTTP endpoint APIs** — the friction above makes extending apps-engine
  laborious, so it lags the HTTP surface.
- **Not idiomatic JS/TS** — friction for proficient JS/TS devs.
- **Hard troubleshooting** — logs split across DB and console; often unclear where to look or missing.
- **App install/lifecycle too complex** — too many steps from installed → enabled, path unclear.
- **`AppManager` has too many responsibilities.**
- **Types not ergonomic** — many optional props, invariants unmodeled.

## Guiding ideas

- New and old apps must **coexist** before v1 is dropped.
- Use a **proper IoC container** (see decision: host-internal only).
- Use **`@packages/core-typings`** instead of bespoke types.
- **Repository pattern** for system entities (messages, rooms, users) with paging for bulk reads.
- Focus on a **local runtime** now, but design the API as if **network/remote** access is coming.
- Apps have two desired states (**enabled/disabled**); a runtime reconciler keeps running state aligned
  with target state.

---

## Locked decisions

### Packaging & coexistence
- v2 lives in a **new, independent package** (working name `@packages/apps-next`, or
  `@rocket.chat/apps-engine@next` / a `next` subpath — TBD). Independent from v1 `@packages/apps`
  (which already has `deno-runtime` and `node-runtime`).
- Core stays ignorant of the two versions. A single **`AppOrchestrator`** method fans out to both v1
  and v2.
- **Ordering: v1 → v2.** If v1 prevents an action, v2 is not invoked. v2 must never break the existing
  v1 flow.
- An app targets **exactly one major version**. The v2 manifest may be incompatible with v1's body.
- **Manifest envelope contract (pin):** one discriminator field (e.g. `engineVersion: 2`) must be
  readable by both marketplace and installer *before* choosing a parser, even though the rest of the
  manifest body differs across versions. Specify that field's stability contract.
- v1 will be **deprecated and eventually sunset** in a future major Rocket.Chat release — no hard date.
  Codemods to upgrade v1→v2 are a future nice-to-have.

### IoC vs service locator
- **IoC container is host-internal only** — it wires the engine's own services (bridges, permission
  service, log store, repository factory). Apps never see it.
- The **app-facing API is a service locator**: a `ctx` object exposing repositories/services. This is
  a deliberate choice; the spec must name it correctly and stop selling DI as an app-facing ergonomic.

### App authoring surface (split on *audience*, not on host-vs-app)
- **`app` = authoring surface.** Everything an app contributes registers here so it shares the app's
  lifecycle, permission set, and log stream: `app.on('message:pre', …)`, `app.on('enabled', …)`,
  `app.registerSlashcommand(…)`, `app.registerEndpoint(…)`. One owner → clean teardown.
- **`Engine` = host control plane.** `createApp`, plus host-only verbs (enable/disable/reconcile/
  list/inspect). An app author calls `Engine` once (`createApp()`) and never again; control verbs are
  unreachable from inside handlers (so an app can't enable/disable neighbors).
- Responsibility gating lives in the **event name namespace** (`message:pre`, `lifecycle:enabled`),
  not in which object you call.

### Event model
- Keep the **timing axis** as pre/post markers (syntax TBD). Drop the v1 capability/blocking-ness
  suffixes and `check*`/`execute*` duality.
- **`pre` handlers return a `Decision`**: `continue`/`allow`, `prevent(reason)` (reason as
  `{ message }` or `{ i18n }`), `patch(subject)` where applicable. `post` handlers return void.
- **Pipeline semantics**, but handlers are **order-agnostic**: each handler receives the current data
  and acts on it; whether another app modified it first is irrelevant from the app's perspective. No
  ordering guarantees are exposed.
- **First `prevent` short-circuits** the rest of the pipeline.
- **No middleware / `next`** for the app-facing contract — use the `Decision` return only. (`next`,
  if ever used, is an internal engine detail, never cross-app.)

### Error handling in event execution (3 cases)
- **Engine/bridge error (our bug):** may fail open — our crash must not brick the server.
- **App handler throws unknown error (their bug):** **stop execution** and treat as **fail-closed for
  that action** (the safe default). Declared prevention no longer needs a "known exception" — the
  `Decision` return replaces it.
- **Intentional `prevent`:** not an error.
- Repeated crashes escalate to the **reconciler**, which flips the app to `disabled(errored)` so one
  broken app doesn't fail-closed every action forever. (Bias chosen: safe-by-default over
  never-disrupt-traffic — see open question to confirm wording.)

### Reads / writes direction
- Use **core-typings** entity types.
- **Repository pattern** with paging for reads.
- Writes: a **single batched `update`-style call** is desired (not tied to Mongo's API) so apps can
  bundle multiple mutations to the same entity into minimal DB ops; alternatively the runtime batches
  domain calls and the server reconciles. (Consequences still open — see below.)
- **Permission granularity is coarse:** scope ≈ `read`/`write` × entity type, surfaced to admins at
  install time ("this app can read/write these data types"). Finer-grained protection for sensitive
  fields is handled by exposing them only as **domain operations** and excluding them from generic
  patch.

### Distributed concerns
- **Deferred intentionally.** The distributed nature of apps-engine is about to change. For now each
  instance is aware only of itself; the system propagates target-state changes and each instance
  reacts. Design the reconciler single-instance.

---

## Sketch of the intended app shape (illustrative, NOT final)

```typescript
import { Engine } from '@rocket.chat/apps-engine/next'; // path TBD

const app = Engine.createApp();

app.registerSlashcommand({
  command: 'hello',
  i18nDescription: 'i18n_description_key',
  i18nParams: 'i18n_params_key',
  actions: {
    async run(ctx: SlashcommandExecutionContext): Promise<SlashcommandResponse> {
      const roomId = ctx.get('rid');
      await ctx.rooms.update({ _id: roomId }, { /* … */ }, { /* options? */ });
      return ctx.success();
    },
    // async preview?(ctx: SlashcommandPreviewContext): Promise<SlashcommandPreviewResponse>,
  },
});

// Lifecycle (belongs on `app`)
app.on('installed', (ctx: AppInstallationContext): Promise<void> => { /* … */ });
app.on('updated',   (ctx: AppInstallationContext): Promise<void> => { /* … */ });

// Host-side event subscription (also belongs on `app`, namespaced event name)
app.on('message:pre', async (ctx: MessageEventContext) => {
  const message = ctx.get('message');
  message.msg = `${message.msg} - validated`;
  return ctx.patch(message);
  // return ctx.continue; // or ctx.allow
  // return ctx.prevent({ i18n: 'reason_key' });
});
```

Open stylistic points flagged in the sketch: `ctx.get('rid')` stringly-typed access vs typed `ctx`
properties; exact `Decision` constructors; `success()` response shape; when `preview` is required.

---

## Open questions (resume here)

These were posed in the last grilling round and are **not yet answered**:

1. **Engine/app collapse — confirm.** Can every contribution hang off `app` with no exceptions? Name a
   contribution type that genuinely doesn't belong to an app's lifecycle, or accept `Engine` as
   factory + host-only control plane.

2. **Unit-of-work / batched writes:**
   - **Flush timing:** implicit at handler end, or explicit `await ctx.commit()`?
   - **Read-your-writes:** if writes are deferred, a write-then-read in the same handler returns stale
     data. Maintain a local overlay (reads merge pending writes) or document "deferred writes, don't
     read them back"?
3. **Two write paths — confirm the seam is modeled separately:**
   - *Path 1:* mutating the **subject of the action** in a `pre` handler (`return ctx.patch(message)`)
     — rides the action into core's persistence, no repository, no roundtrip; failure aborts the action.
   - *Path 2:* **side-effect writes on other entities** (`ctx.rooms.update(...)`) — separate atomicity,
     separate permission scope; failure does not abort the action.
4. **Writable projection — who owns it?** Generic patch must operate on a curated, whitelisted writable
   projection per entity type (not the raw document), or apps could write `_id`, `u`, `t`, counters.
   That projection table *is* the write API contract. Define its owner/location. Sensitive fields are
   the carve-outs exposed only as domain ops.
5. **Concurrency on `update` (debt, unanswered twice):** no transaction spans the RPC boundary →
   lost-update. Optimistic precondition (`_updatedAt`/version → throw `ConflictError`) or
   last-write-wins? Changes the `update` signature.
6. **Cursor contract (debt, dodged twice):** stateful server cursor vs **stateless keyset/opaque
   cursor**. Claim on the table: stateless keyset is the only defensible choice for a restartable,
   eventually-remote runtime; accepted cost is no snapshot isolation (rows shift between pages).
   Accept or rebut.
7. **Permission edges:**
   - Does subscribing to `message:pre` require `read:messages` (receiving the payload *is* reading)?
   - Is **`prevent` itself a declared capability** an admin must consent to, separate from
     `read:messages`? (An app that can veto every message is dangerous.)
8. **Error bias — confirm wording:** "fail-closed for the action + escalate to disable on repeated
   crash" vs unknown-throw fails *open* and only declared `prevent` blocks.

## Still to grill (future rounds)

- **Permission exceptions across the bridge:** typed `PermissionDeniedError` (carrying the missing
  scope) surfaced as a rejected promise; install-time-consented (static) vs runtime-granted. If static,
  the type system can't know per-install which repos are present → likely **present-and-throws**, which
  dents the "types map invariants" goal (acknowledge the dent).
- **Reconciler state machine** (single-instance): states (installed, enabled, disabled, errored,
  crash-loop), transitions, persistence of desired state, behavior on boot.
- **Logging/troubleshooting:** single sink, structured logs, correlation IDs across host/runtime
  boundary, retention.
- **`AppManager` decomposition:** the concrete component boundaries that replace it (Registry/Store,
  Installer, Runtime/Lifecycle reconciler, Bridge/HostAPI, EventDispatcher, PermissionService,
  LogStore).
- **SDK contract versioning:** semver of the SDK and capability negotiation between an app's declared
  engine version and the host.
