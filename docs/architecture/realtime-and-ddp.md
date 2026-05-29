# Real-time architecture: the streamer and our DDP decision

**Who this is for:** any developer writing client-server communication or
real-time features. **After reading:** you understand why Rocket.Chat's
real-time layer does not behave like stock Meteor DDP, and which mechanism to
reach for when adding new code.

---

## TL;DR

- Rocket.Chat's real-time layer is an **event stream (the "streamer")**, not a
  synced collection mirror.
- We **intentionally bypass Meteor's DDP mergebox**.
- New client-server calls should go through **REST endpoints**, not
  `Meteor.methods`/DDP. Treat DDP as **legacy**.

---

## Background: how stock Meteor DDP works

In stock Meteor, a publication keeps a server-side **mergebox**: the server
tracks the exact set of documents each connected client is observing, diffs them
on every change, and pushes `added`/`changed`/`removed` messages so the client's
Minimongo is a faithful mirror of a server-side query.

That model is convenient for small apps but expensive at chat scale:

- The server holds per-connection observation state for every subscribed query.
- Every write fans out through diffing against all overlapping observers.
- Memory and CPU grow with `connections × documents observed`, which is brutal
  for large rooms and many concurrent clients.

## What Rocket.Chat does instead: the streamer

We bypass the mergebox. Our **streamer** broadcasts discrete **events** that
clients subscribe to and react to — it does not maintain a server-side mirror of
collection state per client.

- The client receives events (e.g. "this message was created/changed") and
  updates its local state itself, rather than receiving a diffed collection.
- The server does not keep per-connection mergebox bookkeeping for these
  streams; it emits events to the subscribers of a named stream.
- This scales with event volume, not with `connections × observed documents`.

Key code:

- `apps/meteor/server/modules/streamer/streamer.module.ts` — the `Streamer`
  implementation (subscriptions, allow/deny rules, emit).
- `apps/meteor/app/notifications/server/lib/Notifications.ts` — defines the
  application streams built on top of it.

> **Mental model:** a streamer subscription is a *firehose of events you opted
> into*, not a *live query whose results are kept in sync for you*. Don't expect
> Minimongo-style "the collection just stays correct" semantics.

### Practical consequences

- Streamer subscriptions are tracked **per connection, not per user** — one user
  with multiple tabs/clients has multiple subscriptions.
- The client is responsible for applying events to its local state. If it misses
  an event or starts cold, it reconciles via REST/initial load, not via a
  mergebox resync.

## The decision: moving off DDP

New client-server interactions are built as **REST endpoints**, not DDP
`Meteor.methods`. DDP methods are legacy and are being migrated out.

**Why:**

- Clear, typed, versioned HTTP contracts (see
  [API endpoint migration](../api-endpoint-migration.md)) instead of opaque RPC.
- Easier to authenticate, rate-limit, cache, test, and document.
- Decouples client-server calls from the Meteor/DDP runtime, aligning with the
  microservices direction.

**What this means for you:**

- Writing a new client-server call? Add a **REST endpoint**, not a Meteor method.
- Touching client code that still calls a Meteor method? It's legacy — prefer
  migrating it to REST over extending it.
- Real-time *notifications* still flow through the **streamer** (events), which
  is separate from the REST request/response path.

> The line-by-line migration tracker lives at `../ddp-remaining-methods.md`. It's
> a transient work log (intentionally unlinked from the docs index), not
> onboarding material — but useful if you're actively migrating a method.
