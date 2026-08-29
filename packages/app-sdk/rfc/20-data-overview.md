# The host data & query layer

> Part of the [Apps Engine SDK RFC](README.md).

**Status:** RFC / design proposal
**Companion to:** the app-facing docs — [the composition root](10-surface-composition-root.md)
and [the context](11-surface-context.md) design the shape an app author writes
(`defineApp`, `ctx`, schemas). This domain designs what sits **behind**
`ctx.rooms`, `ctx.messages`, `ctx.users`, … on the host, and the contract that
crosses the process boundary when the apps runtime runs out of process.
**Scope:** platform data. App-private persistence (`ctx.store`) appears only
where its query language must agree with this one.

> This is a ground-up design. It reasons from two inputs: Rocket.Chat's own
> domain model, and how other plugin platforms solve the same problem. It does
> not treat any existing apps API as a baseline or a constraint.

---

## TL;DR

The recommendation is a **hybrid**, not a single pattern:

| Layer | Pattern | Why |
|---|---|---|
| Host code organization | **Repository (gateway) per record** | One place owns each record. Testable. Swappable storage. |
| App-facing read | **Explicit selection** — the caller names the fields and the relations it wants (the Shopify Admin API idea, expressed in TypeScript, not in a query string) | One round trip per statement, and one entity type instead of a deep/shallow fork. |
| App-facing write | **Named commands** over server use-cases (the VS Code `WorkspaceEdit` idea: a write is a value, the host applies it) | Room and message writes are not CRUD. They carry invariants. |
| Derived entities (Thread, Discussion, DM) | **Lenses and traversals**, not repositories | They have no record of their own. |
| Query language | A **closed, versioned filter DSL** | A Mongo filter on the wire freezes our schema forever. |

The reason the answer is a hybrid is in [the entity analysis](21-data-entities.md): the six
entities the SDK talks about — Message, Room, Thread, Discussion, Team, User —
are **three different kinds of thing** stored in **four collections**. One
mechanism cannot serve all three kinds without lying about at least one of them.

---

## What this layer must deliver

1. **One shape per entity.** An app must never have to choose between a "full"
   and a "shallow" variant of the same entity, and the platform must never have
   to ship both.
2. **A serializable request.** [The deployment model](41-platform-deployment-and-isolation.md) makes the in-process vs.
   out-of-process split a packaging decision. That only holds if every read and
   every write is a value that survives NATS. This layer defines that value.
3. **A cost ceiling.** A shared apps runtime serves many apps. One app must not
   be able to ask for the whole workspace in one call.
4. **A stable public contract.** Apps compile against this. Once it ships, every
   field is a promise. The layer must therefore hide the storage model, not
   mirror it.
5. **Permission at the source.** The gateway decides what an app or an actor may
   see. Not the client, and not the app.

