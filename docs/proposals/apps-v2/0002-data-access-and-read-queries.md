# 0002 — Data access: unified repositories & read-query model

Status: **accepted** (grilling round 2, 2026-06-24)
Scope: the `IRead`/`IModify` replacement — how an app reads and writes system entities.
Builds on [0001](0001-app-entry-and-transport-split.md) (`ctx` is the injected, transport-
agnostic service-locator handed to every handler and contribution executor).

## 1. `ctx` is the single service-locator; one unified repository per entity

Replaces v1's split hubs (`read.get*Reader().getById` + `modify.get*().start*()…finish()`).

- Each system entity gets **one repository** exposing reads, writes, and that entity's
  **domain operations** together: `ctx.rooms`, `ctx.users`, `ctx.messages`.
- Repositories are namespaced **directly on `ctx`**, alongside non-entity capabilities
  (`ctx.http`, `ctx.persistence`, `ctx.logger`). `ctx` is the one "provider" object — the
  service locator from [0001] / design-doc §IoC-vs-service-locator.
- Each repository has **three method families**:
  1. **generic reads** — `findById`, `find` (see §3);
  2. **generic writes** — `create`, `update`, `delete` over a **writable projection** (not
     the raw document) — *semantics deferred, see §5*;
  3. **domain operations** — named methods for sensitive/semantic mutations excluded from
     generic write (`ctx.users.deactivate(...)`, `ctx.messages.addReaction(...)`).

The read/write *capability* split that a separate `ctx.read`/`ctx.write` would give for free
is instead recovered at the **permission layer** (`read:<entity>` vs `write:<entity>` scopes
gating individual methods), which we need regardless — so object-level splitting is
redundant.

## 2. Per-entity projections are the governance point

Three hand-authored, per-entity surfaces, decoupled from the stored document, owned in one
place (owner/location TBD — design-doc open Q4). This is also where **permission scoping and
index guarantees attach**:

- **queryable projection** — what you may filter on (§3).
- **sortable subset** — the queryable fields you may sort by; every one must be index-backed.
- **writable projection** — what generic `update`/`create` may set (§5).

## 3. Read-query model: constrained typed query, **never raw Mongo**

Requirement: not bound to Mongo, **index-friendliness is paramount**, portable to a
remote/non-Mongo backend.

### Closed operator vocabulary (ours, not Mongo's)

```typescript
interface ComparableFilter<T> { eq?: T; ne?: T; gt?: T; gte?: T; lt?: T; lte?: T; in?: readonly T[] }
type TextFilter = string | { eq?: string; in?: readonly string[] };   // equality/set only
// a bare scalar (`active?: boolean`, `username?: string`) means implicit `eq`.
```

- **No regexes, no substring/`contains`/`startsWith`, no string operations** — left out for
  now precisely because they are not reliably index-friendly. May be revisited.
- Per-entity **queryable projection** is a hand-authored TS interface, e.g.:

  ```typescript
  interface UserSearchQuery {
    username?: TextFilter;
    active?: boolean;
    createdAt?: ComparableFilter<Date>;
    updatedAt?: ComparableFilter<Date>;
  }
  ```

### Combinators

- Top-level fields are **AND-ed**.
- **Disjunctive-array OR is in the contract now**: `find([qA, qB])` = OR of whole queries
  (disjunctive normal form). Cheap to commit to up front; avoids a later breaking change.
- **No** nested `$or`/`$and`/`$not` operator tree.

### Two-tier read surface (the load-bearing rule)

- **Generic `find(query)` can only ever return the entity's base type** (`find(...)
  : Page<IUser>`). It is parameterized by *data*, not by *type*.
- **A named finder is required exactly when the access pattern guarantees a different or
  narrower *return type*** — `ctx.users.findByFederationId(id): IFederatedUser | null`. The
  finder name *is* the type-discriminator; no filter object can carry that invariant.
- Corollary: "extend the queryable projection" vs "add a named finder" is decided by whether
  the *return type* changes, not by query complexity.

### Result & paging shape

- `find(query, opts)` returns **`Page<T>`** (items + opaque **keyset cursor**, per design-doc
  open Q6) — never a bare array.
- `opts = { limit; cursor; sort }`; `sort` restricted to the entity's **sortable subset**, so
  every sort is index-backed and keyset-pageable.
- Single-result finders (`findById`, `findByFederationId`) return **`T | null`**.
- Accepted cost of keyset paging: no snapshot isolation (rows may shift between pages).

## 4. Entity types come from `@packages/core-typings`

No bespoke eager-resolved `IMessage`/`IRoom`/`IUser`; no `*Raw` variants. Relationship
resolution is a *repository* concern (resolve a reference when the app wants to) — **exact
resolution API deferred** to a later decision.

## 5. Deferred to later decisions (NOT settled this session)

- **Write semantics:** batched/unit-of-work `update`, flush timing, read-your-writes overlay,
  the two write paths (patch-the-subject vs side-effect writes), optimistic concurrency on
  `update` — design-doc open Q2/Q3/Q5.
- **Writable-projection ownership/location** (shared with queryable projection) — Q4.
- **Reference resolution API** (how an app resolves `message.u` → full user on demand).
- **Permission-denied error type** surfaced across the boundary — design-doc "still to grill".
