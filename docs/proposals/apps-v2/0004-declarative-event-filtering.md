# 0004 — Declarative event filtering

Status: **accepted** (grilling round 3, 2026-06-26)
Scope: how an app subscribes to a *subset* of an event ("only `message:send` in room X",
"only from users X/Y/Z") without receiving and discarding the rest.
Builds on [0003](0003-event-handler-model.md) (the `on(...)` subscription) and
[0002](0002-data-access-and-read-queries.md) (the closed operator vocabulary and per-entity
queryable projection that filtering reuses).

## Prior art (why declarative, host-side)

Every mature event system does **declarative content-based filtering evaluated before
delivery**, over a **closed operator vocabulary** — not arbitrary code:

- **AWS EventBridge** — event patterns (prefix, numeric range, exists, anything-but, wildcard).
- **Azure Event Grid** — advanced filters (key + op + values; nested fields; no array-of-objects).
- **GCP Pub/Sub** — filter expressions (`=`, `!=`, `:` exists, `hasPrefix`, AND/OR/NOT;
  attributes only, no regex).
- **Stripe** — per-endpoint event-type selection (coarse).
- **Svix** — JS predicate (the lone "arbitrary code" outlier, and even it runs host-side).

The Enterprise Integration Patterns naming pins the fork: **Selective Consumer** (filter lives
in the endpoint — what v1 forces: `if (msg.rid !== X) return` inside the handler) vs **Message
Filter** (filter lives in the messaging system; only qualifying events are delivered). This
decision moves us to **Message Filter**.

## 1. Decision: declarative, host-side filtering as an optional `on()` arg

```typescript
app.on('message:send:pre', handler);                              // unfiltered (0003)
app.on('message:send:pre', { rid: { in: ['roomX'] } }, handler); // only room X
app.on('message:send:pre', { 'u._id': { in: ['userX','userY'] } }, handler);
```

The filter is **declarative data, stored host-side, inspectable — not a callback.** This is
load-bearing for our specific constraints:

1. **It preserves `pre` speed (0003 §4).** Host-evaluated against the in-hand payload, it lets
   the host **skip waking the app** when it doesn't match. A predicate *callback* would mean a
   sandbox hop just to decide whether to invoke the handler — reintroducing the latency.
2. **It enables the network transport (0001/0003 §5).** Host-side evaluation ships only matching
   events across the wire; a callback would need a roundtrip per event to evaluate.
3. **It rules out the Svix JS-predicate style** for the app-facing contract.

## 2. The `on()` shape: positional bare filter (optional middle arg)

```typescript
on(event, handler): void;
on(event, filter, handler): void;
```

Keeps [0003]'s two-arg form intact; the filter is the bare query object (no wrapper) so the
common filtered case stays terse, and TS infers the filter's type from the event name. Rejected:
fluent `.where().handle()` (terminal-call footgun), criteria-object wrapper `{ filter }` (ceremony),
single descriptor object (loses the `on('event', handler)` shorthand). If per-subscription
options (`once`, `debounce`) ever land, they can be added via an additional overload without
breaking this one.

## 3. Filter surface = the event's own filterable projection

The filter targets **the event payload's filterable projection**, defined per event:

- **Single-subject events** (`message:*`) — the projection *is* that entity's [0002] queryable
  projection. (So [0002] §2's projection now serves three consumers: `find()`, event filters,
  and — via the writable projection — writes. One governance table per entity, three uses.)
- **Multi-subject events** (`room:userJoin` → room + actor + target) — a **bespoke filterable
  projection over the composite payload**, not forced through any single entity. You filter the
  payload you actually receive.

### Hard constraint: payload-only, no resolution

A filter may reference **only fields present in the event payload** — no resolution, no joins.
`message.rid`, `message.u._id` are on the payload → filterable. *"messages from users with the
admin role"* needs a user lookup → **not** declaratively filterable; that stays in-handler.
This keeps host-side evaluation O(1) against the in-hand object — the whole point of (1).

## 4. Operator vocabulary: a richer superset of reads

Filters carry a **richer operator vocabulary than [0002] reads**. [0002] banned
substring/regex/`contains` because they aren't index-friendly — but filters are evaluated
**in-memory host-side against one payload, where index-friendliness is irrelevant**. So
substring/`contains`-style operators are admissible here (e.g. "capture messages whose text
contains 'urgent'"). Likely "same fields, more operators." TS autocomplete makes the larger
surface discoverable.

We therefore maintain **two vocabularies**: the index-safe closed read-query vocab ([0002] §3)
and this event-filter superset. The exact extra operators are **enumerated in a later pass**.

## 5. Filtering is a delivery optimization, NOT a permission boundary

The filter's only job is **fewer handler invocations**. It does **not** narrow the required
consent: subscribing to `message:send:pre` needs the same coarse `read:<entity>` scope whether
filtered or not.

Reason it cannot be a security scope: the filter lives in **app code and can change on every
app update**, so an admin can't trust "only #support" as enforced. Consequence we honor: **do
not surface the filter to admins as a guarantee** — at most show it as clearly-labeled,
non-binding info. (This explicitly retracts an earlier pitch that a narrow filter could narrow
consent.)

## Open / deferred

- **Enumerate the event-filter operator superset** (§4) and whether any field is filter-excluded.
- **Per-event filterable projection** for each multi-subject event (§3) — lands with the full
  `EventName` catalogue in a [0003]-followup.
- Whether per-subscription options (`once`, `debounce`) are ever added, and via which overload (§2).
