# Cost, permission, consistency

> Part of the [Apps Engine SDK RFC](README.md).

## Cost

Borrowed from Shopify, simplified:

| Control | Proposed default |
|---|---|
| Relation depth | 2 (`room.creator` yes; `room.parent.creator.…` no) |
| Page size | 100, hard cap |
| Relation fan-out per page | one batched query per relation |
| Requests per execution | budgeted per app, logged per envelope |
| Unbounded list without `where` | rejected — a workspace-wide list needs an explicit permission **and** a cursor |

The last row matters. "List every room in the workspace" is a full collection
scan. It must be a deliberate, permissioned, paged capability, not a default
reachable from any handler.

Two gaps in this table are argued in [the query surface](31-data-query-surface.md): every
control here is *per request*, so nothing bounds an app that pages 2,000 times; and the
closed `where` leaves analytics apps with no delegated path at all. That document
recommends a per-execution row cap and a separate `aggregate` op.

## Permission

Every envelope carries a principal, and the default is the app, not the user:

```ts
await ctx.rooms.get(id);                       // as the app
await ctx.rooms.get(id, { as: ctx.actor });    // as the triggering user — permission-gated
```

This is Forge's `api.asApp()` / `api.asUser()` split, and it agrees with
[the context](11-surface-context.md), where `ctx.actor` is set by the platform and is not forgeable.
The gateway enforces it. The client only transports it.

## Consistency

- **Read-your-writes inside one execution** — the per-execution loader is
  invalidated by any command the same execution issues.
- **No guarantee across executions.** State that plainly in the docs.
- **Lost updates** — see [conditional writes](25-data-write-surface.md#conditional-writes).

