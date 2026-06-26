# 0003 — Event-handler model

Status: **accepted** (grilling round 3, 2026-06-26)
Scope: how a v2 app subscribes to host events, what a handler receives and returns, the
pre/post split, and the event-name grammar. The `IPre*`/`IPost*` + `check*`/`execute*`
replacement.
Builds on [0001](0001-app-entry-and-transport-split.md) (`app.on(...)`, the injected `ctx`)
and [0002](0002-data-access-and-read-queries.md) (`ctx` repositories, queryable/writable
projections). Filtering is split out into [0004](0004-declarative-event-filtering.md).

## 1. A handler receives two parameters: `(event, ctx)`

```typescript
app.on('message:send:pre', async (event, ctx) => {
  const message = event.message;             // typed payload — varies per event
  const room = await ctx.rooms.findById(message.rid); // capability locator from 0002
  return event.patch({ msg: message.msg + ' ✓' });    // decision verb on the event
});
```

- **`event`** = *what happened*: the typed payload plus the decision verbs that act on it.
  Its shape varies per event name.
- **`ctx`** = *what I can do*: the injected, transport-agnostic service-locator from
  [0002] — `rooms`/`users`/`messages`/`http`/`persistence`/`logger`. **Identical in every
  handler, every contribution executor, and (via `connect`) remote.** Keeping `ctx` to this
  single meaning is the load-bearing invariant; the payload must not collapse into it.

Resolves the doc inconsistency where the design-doc sketch put `ctx.get('message')` and
`ctx.rooms` on one object — that predated [0002] fixing what `ctx` means.

### Conventions

- **`ctx` is the thing you destructure** — `(event, { rooms, users }) => …` or a first line
  `const { rooms } = ctx`. **`event` is never destructured** (its verbs stay bound to it, and
  `event.continue` sidesteps the `continue` reserved-word problem entirely).
- **Constraint on the [0002] locator:** every member of `ctx` must be **independently bound** —
  no method may rely on `ctx` as its `this`. `const { rooms } = ctx; rooms.findById(...)` has
  to work detached. Rules out a `ctx` implemented as a class with `this`-coupled getters.

## 2. Decisions are returned, never thrown; the verbs live on `event`

A `pre` handler returns a `Decision`. A `post` handler returns `void`.

```typescript
return event.continue;                         // proceed unchanged — a property, no parens
return event.patch({ msg: clean });            // proceed WITH changes — pipeline continues
return event.prevent({ i18n: 'spam_blocked' }); // veto — short-circuits the pipeline
```

- **Returned, not thrown — load-bearing.** The error model (design-doc §"Error handling")
  treats *any throw from a handler as a crash → fail-closed + escalate to the reconciler*.
  Keeping the verdict in the **return** channel and bugs in the **throw** channel means the
  runtime never has to sniff a "legitimate veto" throw apart from a real crash. It also lets
  TS type the handler return (`Promise<Decision>`) and flag a handler that forgets to return.
- **Verbs on `event`,** because `patch` needs to know *what* it patches and `prevent` *what*
  it vetoes — both are properties of this specific event. Nothing to import.

### The three verbs

| Verb | Form | Semantics |
|---|---|---|
| `event.continue` | property (no call) | proceed unchanged |
| `event.patch(partial)` | method | proceed **with** changes; **does not short-circuit** — the next handler in the order-agnostic pipeline sees the merged data |
| `event.prevent(reason)` | method | veto; **first `prevent` wins** and the rest of the pipeline is skipped |

- **`continue` is a property** — it carries no data, so the asymmetry with the two methods is
  honest. The runtime brand-checks the returned value, so `return event.prevent` (missing
  parens → returns the function) is caught, not silently passed.
- **`patch` takes a partial, not a mutated whole.** `event.patch({ msg })`, not
  `message.msg = …; patch(message)`. The partial's type **is the subject entity's writable
  projection from [0002]** — see §3.
- **`prevent(reason)`** carries a localizable reason: `{ message: string }` for a literal, or
  `{ i18n: string; i18nArgs?: Record<string, …> }` for a key — because the reason surfaces to
  the **end user** whose action was blocked.

Rejected: a single merged handler arg carrying payload + verbs + repositories (terser for
`e => e.continue`, but re-bundles the [0002] capabilities and makes the arg a different shape
per event); throwing `prevent` (forces the runtime to disambiguate veto-throws from crashes on
every event).

## 3. Two write paths, modeled separately (closes design-doc Q3)

Both paths write through the **same single writable projection per entity** (one governance
surface; carve-outs only if a concrete case forces it). They differ only in *failure &
atomicity*:

| | **Path 1: `return event.patch(…)`** | **Path 2: `await ctx.rooms.update(…)`** |
|---|---|---|
| Mechanism | returned verdict, batched into the action | imperative call, its own roundtrip |
| Atomic with the action? | **yes** — rides core's persistence of the action | **no** — separate write |
| On failure | **action aborts** | **action proceeds**; rejected promise the handler can `try/catch` |
| Permission | the action's own gating | independent `write:<entity>` scope |

**The syntax encodes the seam** — Path 1 is a `return`, Path 2 is an `await`. They can't be
conflated by accident.

## 4. Canonical responsibility split — and `pre` has no write methods

A Path-2 side-effect write inside a `pre` handler is **speculative**: `patch` doesn't
short-circuit, so a *later* handler can still `prevent` the action while your
`ctx.rooms.update(...)` has already landed. "Separate atomicity" cuts both ways.

So the canonical split is:

- **`pre` = read + decide + patch the subject.** Reads to decide, `patch` to shape the action.
- **`post` = side-effects.** Runs only after the action is real, so writes there are tied to
  something that actually happened.

This is **enforced, not just documented**: **the `ctx` handed to a `pre` handler exposes no
write methods at all.** The repository interface splits into a **read-only view** (generic
reads + named finders) for `pre`, and the **full view** (reads + writes + domain ops) for
`post` and contributions. `event.patch(...)` remains available in `pre` because it is a
returned verdict, not I/O — zero roundtrip. Net: a `pre` handler can do read I/O and shape the
subject, but cannot perform a single write roundtrip. (Motivation: `pre` handlers are on the
hot path and must be fast.)

## 5. Transport invariant — `pre` is subprocess-only

`pre` events are available **only to apps running on the embedded/subprocess transport, never
over the network transport** — the synchronous-veto latency budget forbids a network hop.

Interaction with [0001]'s "one definition, two drivers": a definition that registers **any**
`pre` handler is **not portable to remote**. A `pre` security filter must never silently
not-run, so:

- The remote driver (`connect`) **rejects at load** an app whose registrations include a `pre`
  handler — loud failure, not silent disablement.
- The transport requirement is **derived from the registrations** (code is the single source
  of truth); the manifest summary reflects it.

Full design deferred (network transport is future work) — this records the invariant.

## 6. Event-name grammar: `<entity>:<verb>:<timing>`

Singular entity, **base-form** verb, explicit `pre`/`post`. Lifecycle events under a separate
**`lifecycle:*`** namespace (no timing axis). Every event name is therefore `namespace:rest` —
uniformly splittable, with **zero** irregular names.

```
message:send:pre      message:send:post
message:update:pre    message:update:post
message:delete:pre    message:delete:post
message:react:post                            // post-only; the union omits the pre variant
room:create:pre       room:create:post
room:userJoin:pre     room:userJoin:post
user:create:post      user:login:post   user:statusChange:post
upload:create:pre
email:send:pre
lifecycle:installed   lifecycle:enabled   lifecycle:updated   lifecycle:uninstalled
```

- **Base-form verb + explicit timing** keeps the timing segment the sole carrier of "when"
  (no tense contradiction; `message:send:pre` = "before a message is sent").
- **Plural repos, singular events** is deliberate: `ctx.messages` is a collection;
  `message:send:post` is one subject.
- **Timing always present on mutation events**, even post-only ones, so names are mechanical to
  enumerate/codegen; the `EventName` union simply omits variants the host doesn't offer.
- **`lifecycle:*` keeps lifecycle uniform** with entity events (it's the same grammar with the
  app as subject) and leaves headroom — e.g. a future enable veto slots in as
  `lifecycle:enable:pre`/`lifecycle:enable:post`.
- The string literal must drive a **type map** (`'message:send:pre'` → payload type → the
  filter type of [0004]); a uniform `:pre`/`:post` suffix makes that mapped type trivial.

Rejected: tense-encoded timing (`message:sending`/`message:sent`) — needs a per-verb irregular
conjugation table, is judgment-per-event, and complicates the literal→payload→filter type map.
Rejected: bare lifecycle names (`'installed'`) — makes lifecycle the one zero-colon special
case in every name-handling code path, with no headroom for a pre/post or disambiguation.

## Open / deferred

- **`post` handler exact shape** — `void` return, the *full* `ctx`, no decision verbs
  (assumed throughout, not yet separately ratified).
- **Permission edges** (design-doc Q7): does subscribing to `message:send:pre` require
  `read:messages`? Is `prevent` itself a declared capability an admin must consent to?
- **The full `EventName` catalogue** mapped from v1's families
  (`../apps-current-architecture/01` §3.3) — the complete union and each event's payload shape.
- Reference-resolution API for payload references (`message.u` → full user) — shared with
  [0002] §5.
