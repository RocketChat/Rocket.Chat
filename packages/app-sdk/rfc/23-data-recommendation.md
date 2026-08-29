# The recommendation

> Part of the [Apps Engine SDK RFC](README.md).

**Bounded repositories, explicit selection, named commands.** Six rules.

1. **One client per record**, exposed on `ctx`: `messages`, `rooms`, `users`,
   `uploads`, `teams`. Backed by one host gateway each.
2. **Every read takes a selection** — `select` for fields, `with` for relations.
   The return type is inferred from it. One entity type, no twins.
3. **Every write is a named command** with a schema, mapped to a domain
   operation that owns the invariants. No `save`.
4. **Views are guards and lenses on a record client**, never their own client —
   unless the view owns a record, which only Team does.
5. **Filters are a closed, versioned DSL.** Serializable. Never a Mongo filter.
6. **The host gateway owns projection, policy, and batching**, in that order.

---

## Why not just one pattern?

| If we shipped only… | The failure |
|---|---|
| Repositories | relation cost has no release valve, so a shallow twin of every entity appears within a year |
| A GraphQL-style query surface | apps write query strings, lose inference, and the host loses the named-command write path that protects invariants |
| A document/query API | the Mongo schema becomes the public contract, permanently |
| A live proxy graph | the apps runtime can never leave the monolith |

The hybrid keeps the repository where it is strong (host structure), the
selection set where it is strong (the read contract), and named commands where
they are non-negotiable (writes with invariants).

