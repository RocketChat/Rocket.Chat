# The query surface: filters, aggregates, and the analytics gap

> Part of the [Apps Engine SDK RFC](README.md).

**Status:** research report
**Companion to:** [the data-layer docs](20-data-overview.md) and
[`30-data-cursor-pagination.md`](30-data-cursor-pagination.md). The proposal defines the entity model and
the closed `where`; the pagination report defines how a list turns pages. This document
asks a third question both of them defer: **what is an app allowed to ask, and what shape
does the answer come back in?**
**Scope:** the read predicate and the response shape. Writes, selection, identity and the
cursor codec belong to the other two documents.

---

## 1. TL;DR

**The closed filter DSL is correct for `list` and wrong as the only read path.**

[the read surface](24-data-read-surface.md#lists-are-cursors-with-a-closed-filter) states the rule plainly — "`where` accepts only the keys
the entity declares. It is not a Mongo filter" — and
[cursor pagination §7](30-data-cursor-pagination.md#7-cost-and-the-reject-unbounded-list-rule) hardens it into index-or-refuse. Both are
right. But together they leave one legitimate class of app with no viable path:
**analytics**. An app that wants a grouped count must stream every matching row across the
transport and count in JavaScript. Under the per-execution request budget in
[the cost ceiling](29-data-cost-permission-consistency.md#cost) it cannot even do that — it runs out of budget and fails.

The design treats `list` as the universal read primitive. It is not. A data layer needs at
least two read shapes: a **row stream** and an **aggregate**. Once the second exists, the
closed filter stops being a limitation and becomes a correct specialization of the first.

**Recommendation, in three parts, in increasing order of cost:**

| # | Change | Effort | Unblocks |
|---|---|---|---|
| **C** | Widen the closed filter set per entity | one line per filter + an index audit | filtered counts, most "reporting" |
| **D** | Add `op: 'aggregate'` with a closed dimension allow-list | a new op, a descriptor field, a permission | grouped metrics over raw rows |
| **E** | Expose the rollups the platform already maintains | a read-only entity | daily per-room counts, at zero marginal cost |

Three findings from the codebase drive this, and they are developed below:

1. **The cost ceiling does not bound cost.** `assertWithinBudget`
   ([`src/data.ts:454-466`](../src/data.ts)) checks relation depth, page size, and whether
   `where` is present. Nothing caps total rows, total pages, or wall-clock time.
2. **The infrastructure for D already exists and is proven.** Models call
   `col.aggregate(…, { readPreference: readSecondaryPreferred() })` in **44 places**.
   `Analytics` pins an entire model to secondaries (`Analytics.ts:12`); `Sessions` keeps a
   second handle on one collection at a different read preference (`Sessions.ts:741`).
3. **There is no query timeout anywhere.** `maxTimeMS` appears in neither
   `packages/models` nor `apps/meteor/server`. Any wider query surface must add one first.

---

## 2. The gap, made concrete

### 2.1 A worked example

Take an ordinary app request: *"messages per user per week in this room, over the last six
months."* A moderation dashboard, a team-health report, a billing integration — all want
this shape.

What the app can express today. `MessageEntity.filters`
([`src/data.ts:190-197`](../src/data.ts)) is five keys:

```ts
// src/data.ts:190-197
readonly filters: {
    readonly from?: readonly UserId[];
    readonly since?: Date;
    readonly until?: Date;
    readonly threads?: 'include' | 'exclude' | 'only';
    readonly hasUpload?: boolean;
};
```

`{ since }` passes. The grouped count does not exist in the DSL, so the app must compute it:

```ts
const perUser = new Map<UserId, number>();
for await (const m of ctx.rooms.messages(roomId, { where: { since: sixMonthsAgo } })) {
    perUser.set(m.senderId, (perUser.get(m.senderId) ?? 0) + 1);
}
```

### 2.2 What that costs

For a busy room, six months is on the order of 200,000 documents.

| | Delegated to Mongo | Streamed to the app |
|---|---|---|
| Documents materialized | ~50 (the groups) | 200,000 |
| Documents serialized to JSON | ~50 | 200,000 |
| Round trips through the transport | 1 | 2,000 (at `MAX_PAGE_SIZE` 100) |
| Policy evaluations | 1 query-level | 200,000 row-level |
| Where the scan runs | secondary, off the hot path | primary, plus every layer above it |

**The index-or-refuse rule does not remove the scan. It relocates it to the least
efficient place available.** The database was going to walk a `(rid, ts)` index range
either way. The difference is whether 200,000 documents cross a process boundary to have
one field read and the rest discarded.

### 2.3 The budget makes it worse, not better

`assertWithinBudget` is the whole enforcement today:

```ts
// src/data.ts:454-466
export function assertWithinBudget(request: DataRequest): void {
    const depth = selectionDepth(request.with);
    if (depth > MAX_RELATION_DEPTH) { … }
    const size = request.page?.size;
    if (size !== undefined && size > MAX_PAGE_SIZE) { … }
    if (request.op === 'list' && !request.where) { … }
}
```

Three checks. All three are **per request**. The app that wanted an aggregate simply issues
2,000 requests, and every one of them passes. The ceiling in
[cursor pagination §7](30-data-cursor-pagination.md#7-cost-and-the-reject-unbounded-list-rule) bounds the page, not the query.

Now add row 4 of the [the cost ceiling](29-data-cost-permission-consistency.md#cost) cost table — *"Requests per
execution: budgeted per app, logged per envelope"*. That row and the analytics use case
are in direct conflict:

- **Budget enforced** → the app exhausts it at request 500 and cannot finish. Analytics is
  not slow; it is impossible.
- **Budget not enforced** → the platform has no total cost control at all, and the
  index-or-refuse rule was protecting nothing.

The design as written has to choose, and both answers are bad. Adding a cheap delegated
path is what dissolves the dilemma.

---

## 3. Two motives, and only one of them is negotiable

[cursor pagination §7](30-data-cursor-pagination.md#7-cost-and-the-reject-unbounded-list-rule) and [§8](30-data-cursor-pagination.md#8-migration) argue for the
closed DSL with cost reasons. The closed DSL actually serves **two** motives, and
conflating them is why the trade-off looks harsher than it is.

### 3.1 Cost — negotiable

An unindexed predicate is a collection scan. That is an engineering budget, and indexes,
secondaries, disk-use limits and timeouts all move it. Nothing about it is absolute.

### 3.2 Confidentiality — not negotiable

**An open predicate reads fields that the projection hides.** [the entity declaration](27-data-host-gateways.md#declare-the-entity-once)
gives each entity a field policy — `roomEntity.policy.field` gates `topic` behind
`view-room-administration` ([`src/data.ts:504-507`](../src/data.ts), applied at `:541-544`). The projection removes
the field from the response. A free-form filter reads it anyway:

```ts
// If `where` were a Mongo filter, this returns rows or does not.
// Either answer is one bit of a field the app may never read.
where: { rid, msg: { $regex: '^password: a' } }
```

Repeat with a binary search and the app reconstructs content it was never granted. **No
cost budget closes this channel.** Only a closed key set does.

This also constrains the obvious fix. "Aggregates are safe because the result is small" is
false: `count(where msg =~ /^password: a/)` leaks the same bit. Small results do not close
the channel. **Restricted dimensions** close it — see [§5.2](#52-dimensions-are-not-predicates).

### 3.3 The platform has already ruled on open passthrough

REST still accepts a client-supplied Mongo `query`, behind
`ALLOW_UNSAFE_QUERY_AND_FIELDS_API_PARAMS`. The deprecation message is unambiguous
([`parseJsonQuery.ts:58-60`](../../../apps/meteor/server/api/lib/parseJsonQuery.ts)):

> The usage of the "query" parameter … **breaks the security of the API and can lead to
> data exposure**. It has been deprecated and will be removed in the version 9.0.0.

That is Rocket.Chat's own institutional verdict. A new open-filter surface for apps would
re-open, for a *less* trusted principal, exactly what the platform is closing. Rule out
Mongo passthrough permanently and stop revisiting it.

---

## 4. The design space

| Option | Analytics support | Leak risk | New machinery | Verdict |
|---|---|---|---|---|
| **A.** Closed filters, `list` only (today) | none, under a request budget | none | none | too narrow |
| **B.** Mongo filter passthrough | full | **high** — predicate reads hidden fields ([§3.2](#32-confidentiality--not-negotiable)) | none | **ruled out** ([§3.3](#33-the-platform-has-already-ruled-on-open-passthrough)) |
| **C.** Widen the closed filter set | filtered counts | none, per filter | none | **adopt now** |
| **D.** A separate `aggregate` op | grouped metrics | controlled by a dimension allow-list | one op, one descriptor field, one permission | **adopt** |
| **E.** Expose existing rollups | daily counts, free | none | a read-only entity | **adopt where it fits** |

C, D and E are complementary, not alternatives. C handles "how many, filtered". E handles
the pre-computed time series. D handles everything left over.

---

## 5. Recommendation D — `op: 'aggregate'`

D is the structural change, so it gets the most space. C and E follow, and are shorter.

### 5.1 An aggregate is a different request shape

The temptation is to bolt `groupBy` onto `list`. Resist it. The two shapes differ on every
axis that matters to the host:

| | `list` | `aggregate` |
|---|---|---|
| Returns | rows, paged | groups, bounded by dimension cardinality |
| Cost bound | per page, unbounded in total | one query, one timeout |
| Result size | app-controlled, via page count | schema-controlled, via the dimension set |
| Node | primary | secondary (`readSecondaryPreferred`) |
| Failure mode | slow, leaky if the filter opens | slow only — the dimension set closes the leak |
| Permission | `message.read` | should be its own scope |

A shape this different deserves its own op. Folding it into `where` forces the `list` path
to carry a cost model, a node selection and a permission gate it does not need.

### 5.2 Dimensions are not predicates

This is the control that makes D safe, and it is the whole reason D can be wider than `list`.

- A **filter** narrows rows. It reads a field value the app supplies. That is the leak
  channel of [§3.2](#32-confidentiality--not-negotiable).
- A **dimension** partitions results. The app names a field; the host returns the distinct
  values it finds. The app cannot supply a value to test.

An app may therefore group by `sender` and learn the distribution. It may **not** group by
`msg`, because message content is not in the entity's dimension allow-list. The allow-list
is the security boundary, and it is per entity, declared once, exactly like `filters`.

The rule: **a field is eligible as a dimension only if it is low-cardinality, non-content,
and already readable under the entity's field policy.**

### 5.3 The request

`DataRequest` grows one op ([`src/data.ts:387-397`](../src/data.ts)):

```ts
export interface DataRequest {
    readonly v: 1;
    readonly entity: string;
    readonly op: 'get' | 'list' | 'aggregate';    // ← was 'get' | 'list'
    // …
    readonly aggregate?: AggregateSpec;
}

export interface AggregateSpec {
    /** Same closed DSL as `list`. The predicate space does not widen. */
    readonly where: Readonly<Record<string, unknown>>;
    /** Drawn from the entity's declared dimensions. Empty = one global group. */
    readonly groupBy?: readonly string[];
    /** Time dimensions need a bucket width; without one `ts` is unbounded cardinality. */
    readonly granularity?: 'hour' | 'day' | 'week' | 'month';
    /** Closed measure set over declared numeric fields. */
    readonly measure: readonly Measure[];
    /** Cap on returned groups. Hard-capped like MAX_PAGE_SIZE. */
    readonly limit?: number;
}

export type Measure =
    | { readonly op: 'count' }
    | { readonly op: 'sum' | 'avg' | 'min' | 'max'; readonly field: string };

export const MAX_GROUPS = 1000;
export const MAX_DIMENSIONS = 3;
```

Note what did **not** change: `where` is the same closed DSL. D widens the *response
shape*, not the *predicate space*. That is what keeps [§3.2](#32-confidentiality--not-negotiable)
satisfied.

### 5.4 The descriptor

`EntityDescriptor` ([`src/data.ts:495-512`](../src/data.ts)) gains one field, beside the
`filters` allow-list it already has:

```ts
export interface EntityDescriptor {
    // …
    /** The closed filter DSL. A key absent here cannot be queried. */
    readonly filters: readonly string[];
    /** The closed dimension set. A key absent here cannot be grouped by. */
    readonly dimensions?: Readonly<Record<string, DimensionDescriptor>>;
    /** Numeric fields a measure may reference. */
    readonly measures?: readonly string[];
}

export interface DimensionDescriptor {
    /** Storage field to group on. */
    readonly field: string;
    /** `time` needs a granularity; `ref` resolves ids to a relation for hydration. */
    readonly kind: 'scalar' | 'time' | 'ref';
    /** Refuse the query unless this index backs (where-prefix, dimension). */
    readonly index: string;
    /** Inherits the entity's field policy; may narrow it further. */
    readonly requires?: string;
}
```

Worked example, matching `roomEntity` in [`src/data.ts:515-546`](../src/data.ts):

```ts
export const messageEntity = defineEntity({
    name: 'message',
    // … fields, relations, commands, policy as today
    filters: ['from', 'since', 'until', 'threads', 'hasUpload'],
    dimensions: {
        sender: { field: 'u._id', kind: 'ref',    index: 'rid_1_ts_1' },
        room:   { field: 'rid',   kind: 'ref',    index: 'rid_1_ts_1' },
        time:   { field: 'ts',    kind: 'time',   index: 'rid_1_ts_1' },
        type:   { field: 't',     kind: 'scalar', index: 'rid_1_ts_1' },
    },
    measures: [],                       // count only, for now — see Open question 3
    policy: { read: 'canSeeRoom', aggregate: 'message.aggregate' },
});
```

`msg`, `md`, `attachments` and `reactions` are absent, and that absence is the security
control. A dimension must be *added* deliberately, with an index named and a policy
checked — the same discipline `filters` already imposes.

### 5.5 Compilation, and where it runs

The gateway compiles `AggregateSpec` to a fixed three-stage pipeline. The app never
supplies a stage:

```ts
// host, inside the aggregate gateway
function compile(spec: AggregateSpec, d: EntityDescriptor, policyFilter: Filter<T>) {
    const dims = (spec.groupBy ?? []).map((name) => {
        const dim = d.dimensions?.[name];
        if (!dim) throw new DataBudgetError(`'${name}' is not a dimension of ${d.name}`);
        return [name, dim] as const;
    });
    if (dims.length > MAX_DIMENSIONS) throw new DataBudgetError('too many dimensions');

    const _id = Object.fromEntries(
        dims.map(([name, dim]) =>
            dim.kind === 'time'
                ? [name, { $dateTrunc: { date: `$${dim.field}`, unit: spec.granularity ?? 'day' } }]
                : [name, `$${dim.field}`],
        ),
    );

    return [
        { $match: { ...compileWhere(spec.where, d), ...policyFilter } },   // §11.2 runs first
        { $group: { _id, ...compileMeasures(spec.measure, d) } },
        { $limit: Math.min(spec.limit ?? MAX_GROUPS, MAX_GROUPS) },
    ];
}
```

Three properties fall out, and each maps to an existing Rocket.Chat practice:

1. **The policy filter is a `$match` stage, applied first.** Same compilation as `list`
   ([permission](29-data-cost-permission-consistency.md#permission)). An aggregate can never see a row a `list` could not.
2. **It runs on a secondary.** This is not new machinery. Models do it in **44 places**:

   ```ts
   // ModerationReports.ts:196
   return this.col.aggregate(pipeline, { allowDiskUse: true, readPreference: readSecondaryPreferred() });
   ```

   `readSecondaryPreferred` ([`packages/models/src/readSecondaryPreferred.ts`](../../models/src/readSecondaryPreferred.ts))
   already handles tag-set inheritance from the `Db` options.
3. **It needs a timeout, and that timeout does not exist yet.** `maxTimeMS` appears
   **nowhere** in `packages/models` or `apps/meteor/server`. Today a slow aggregate runs
   until it finishes. An app-triggered aggregate must carry `maxTimeMS`, or one app pins a
   secondary indefinitely. **This is a prerequisite, not a refinement.**

### 5.6 Two access paths on one collection, which RC already does

D asks for one collection to be reachable two ways: row reads on the primary, aggregates on
a secondary. `Sessions` is the precedent, and it is a two-line pattern:

```ts
// Sessions.ts:735-741
export class SessionsRaw extends BaseRaw<ISession> implements ISessionsModel {
    private secondaryCollection: Collection<ISession>;

    constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ISession>>) {
        super(db, 'sessions', trash);
        this.secondaryCollection = db.collection(getCollectionName('sessions'), {
            readPreference: readSecondaryPreferred(db),
        });
    }
```

`BaseRaw` itself exposes no `aggregate` — only `watch` (`BaseRaw.ts:548`) — so every model
that aggregates reaches for `this.col` directly. The aggregate gateway should follow the
`Sessions` shape rather than widen `BaseRaw`: a second handle, pinned to secondaries, used
only by the aggregate path.

### 5.7 Permission

Read access must not imply aggregate access. The existing catalog
(`AppPermissions.ts`) is a scope/verb grid — `message.read`, `message.write`,
`room.read`. The natural extension is a third verb:

```ts
// packages/app-sdk/src/manifest.ts:18 — PermissionScope gains:
| 'message.aggregate'
| 'room.aggregate'
| 'user.aggregate'
```

The reason to separate them is the [§5.2](#52-dimensions-are-not-predicates) residual: an
aggregate over a user-identifying dimension is a profile, even when every individual row was
readable. An admin approving an app should see that request distinctly.

---

## 6. Recommendation C — widen the closed filter set

C is the cheapest change in this document and it should not wait for D.

Five message filters is thin, not principled. The list reads like a first draft, and the
missing entries are ordinary chat concepts an app has every reason to ask about:

| Candidate filter | Backing index today (`Messages.ts`) | Cost |
|---|---|---|
| `type` (system message `t`) | `{ rid: 1, t: 1, 'u._id': 1 }` (`:48`) | **free** — `(rid, t)` is a covered prefix |
| `hasThread` | `{ rid: 1, tlm: -1 }` partial on `tcount` (`:70`) | **free** — already room-scoped |
| `inThread` (by `tmid`) | `{ tmid: 1 }` sparse (`:68`) | adequate; a large thread wants `(tmid, ts, _id)` |
| `pinned` | `{ pinned: 1 }` sparse (`:56`) | single-field only — `(rid, pinned, ts)` for a room-scoped list |
| `mentions` | `{ 'mentions.username': 1 }` sparse (`:55`) | **by username, not id** — the filter must take a username, or a new index |
| `hasReactions` | none | needs a partial index on existence |

Three of the six are free today. Each one is a single string in the `filters` array plus
an index audit — and the `mentions` row shows why the audit is not a formality: the index
is on `mentions.username`, so a filter that takes a `UserId` would silently scan. None widens the
predicate space in the dangerous direction, because none of them tests *content* — the
[§3.2](#32-confidentiality--not-negotiable) hazard is specific to free-form matches on
`msg` and friends.

**The discipline to keep:** a filter enters the allow-list only with a named index. That is
the half of [cursor pagination §7](30-data-cursor-pagination.md#7-cost-and-the-reject-unbounded-list-rule) rule 2 that
`assertWithinBudget` does not yet implement — it rejects a missing `where`, but not a
`where` whose shape no index serves.

---

## 7. Recommendation E — the rollups already exist

A significant slice of "analytics" is already computed, on every message write, and no app
can read it.

`Analytics` maintains a per-room, per-day counter by upsert (`Analytics.ts:24-44`):

```ts
// Analytics.ts:24-44
saveMessageSent({ room, date }) {
    return this.updateMany(
        { date, 'room._id': room._id, 'type': 'messages' },
        {
            $set: { room: { _id: room._id, name: room.fname || room.name, t: room.t, … } },
            $setOnInsert: { _id: Random.id(), date, type: 'messages' as const },
            $inc: { messages: 1 },
        },
        { upsert: true },
    );
}
```

…and read through pipelines already pinned to secondaries (`Analytics.ts:132`, `:175`,
`:211`, `:328`).

So "messages per room per day, over six months" — the example from
[§2.1](#21-a-worked-example), minus the per-user dimension — is a **~180-document read**
that costs the platform nothing extra, because the write already happened. The proposal
should expose it as a read-only entity with `date` and `room` dimensions, rather than let
an app derive it from 200,000 raw rows.

**One caveat, and it needs checking before E ships.** The rollup's indexes
(`Analytics.ts:16-22`) are:

```ts
{ key: { date: 1 } },
{ key: { 'room._id': 1, 'date': 1 }, unique: true, partialFilterExpression: { type: 'rooms' } },
{ key: { 'room.t': 1,  'date': 1 },                partialFilterExpression: { type: 'messages' } },
```

The composite on `room._id` is **partial on `type: 'rooms'`**, but `saveMessageSent` writes
`type: 'messages'`. So a per-*room* message series is not index-backed today — only a
per-room-*type* one is. The fix is a partial `{ 'room._id': 1, date: 1 }` on
`type: 'messages'`, which is also the index the hot write path wants: `saveMessageSent`
upserts on `{ date, 'room._id', type }` on **every message sent**, and today only `date`
narrows it.

The limitation is honest and worth stating: the rollup carries the dimensions someone chose
in advance. It has `room` and `date`; it has no `sender`. Where the app needs a dimension
the rollup lacks, it falls through to D. E is the fast path, not the whole answer.

---

## 8. The cost ceiling, corrected

With C, D and E in place, the ceiling can finally be stated on the axis that matters. The
proposal's [the cost ceiling](29-data-cost-permission-consistency.md#cost) table becomes:

| Control | `get` | `list` | `aggregate` |
|---|---|---|---|
| Relation depth | 2 | 2 | n/a — no `with` |
| Page size | n/a | 100 hard cap | n/a |
| Result cap | 1 | **rows per execution**, not per page | `MAX_GROUPS` 1000 |
| Dimensions | n/a | n/a | `MAX_DIMENSIONS` 3 |
| Index required | by `_id` | `(where, sort)` must be backed | `(where, groupBy)` must be backed |
| Wall clock | — | — | **`maxTimeMS`, mandatory** |
| Node | primary | primary | secondary |
| Permission | `<entity>.read` | `<entity>.read` | `<entity>.aggregate` |

Two rows are the actual fix:

- **`list` gains a per-execution row cap**, not only a per-page one. This is the hole from
  [§2.3](#23-the-budget-makes-it-worse-not-better). A row cap is enforceable in
  `assertWithinBudget` if the loader threads a running count through the execution.
- **`aggregate` gains a wall-clock cap**, which is the only meaningful bound on a query
  whose cost the page size cannot describe.

With a cheap delegated path available, capping `list` stops being hostile. Today the cap
would block the only route to a legitimate answer. With D, the cap simply pushes the app
onto the route that was correct anyway.

---

## 9. What this does not solve

Stated plainly, so the trade-off is not oversold:

1. **It is a second query language.** [cursor pagination, open question 4](30-data-cursor-pagination.md#open-questions)
   already worries about one cursor codec across two stores. `AggregateSpec` is a third
   surface to version, document and keep consistent with `filters`.
2. **A closed dimension set will never satisfy every app.** Some analytics genuinely needs
   a dimension nobody predicted. Those apps still stream rows, and still hit the budget. D
   narrows the gap; it does not close it.
3. **Aggregates leak through cardinality.** A group of size 1 identifies its member. Where
   a dimension is user-identifying, a minimum bucket size is the standard guard. That is a
   real decision, not a detail — see Open questions.
4. **Secondaries are stale.** `readSecondaryPreferred` accepts replication lag by
   definition. An aggregate and a `list` issued in the same execution can disagree.
   [consistency](29-data-cost-permission-consistency.md#consistency) promises read-your-writes within an execution; **that
   promise cannot extend to `aggregate`**, and the docs must say so.

---

## 10. Phasing

Nothing here blocks the data layer from shipping. The order is by cost and by dependency:

1. **`maxTimeMS` on the aggregate path.** A prerequisite for D, and independently valuable —
   there is no query timeout in the server today.
2. **C, the widened filter sets.** No new machinery. Ships with the entity descriptors.
3. **The `list` per-execution row cap.** Closes [§2.3](#23-the-budget-makes-it-worse-not-better).
   Safe to add only once D exists, or it blocks apps with no alternative.
4. **E, the rollup entity.** Read-only, no new indexes, immediate value.
5. **D, the aggregate op.** The largest change. Start with `measure: [{ op: 'count' }]` and
   one entity (`message`), and widen by evidence.

---

## Open questions

1. **Minimum bucket size?** Should `aggregate` suppress groups below *k* members when a
   dimension is user-identifying, and if so, what is *k*? Suppression protects individuals
   but makes small-room results useless — which is most rooms.
2. **Does `aggregate` run as the app or as the actor?** [permission](29-data-cost-permission-consistency.md#permission)'s
   `as: 'app' | 'actor'` split applies, but an aggregate spans many rooms. Reading "as the
   actor" means the policy filter must expand to the actor's full room set — potentially a
   large `$in`. Is that acceptable, or is `aggregate` app-principal only?
3. **`count` only, or the full measure set?** `sum`/`avg` need declared numeric fields, and
   messages have almost none. Is the measure set worth building before an entity needs it?
4. **Where does the staleness show up?** A secondary read inside an execution that also
   wrote violates the read-your-writes promise of [consistency](29-data-cost-permission-consistency.md#consistency). Do we
   document it, refuse an `aggregate` after a write in the same execution, or route it to
   the primary when the execution is dirty?
5. **Should E be an entity or a client method?** The rollup has no stable identity per row
   and no relations. It may not fit `EntityDescriptor` at all, in which case it is a
   `ctx.analytics.*` client rather than a sixth entity.
6. **Who audits the dimension allow-list?** `filters` and `dimensions` are both security
   boundaries declared in code. Is a review rule enough, or does the descriptor need a lint
   that refuses a dimension whose field is absent from `policy.field`?
