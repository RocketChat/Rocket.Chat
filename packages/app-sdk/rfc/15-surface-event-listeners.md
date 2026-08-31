# Event listeners — the big collapse

> Part of the [Apps Engine SDK RFC](README.md).

**Legacy** — to redact spam *and* block slurs on outgoing messages you implement
two interfaces (`IPreMessageSentModify`, `IPreMessageSentPrevent`), list both in
`implements[]`, and write `executePreMessageSentModify` / `checkPreMessageSentModify`
/ `executePreMessageSentPrevent`.

**Proposed** — one `defineListener`; intent is the return value (the Mastra
processor model: return modified, or `abort()`).
[`examples/reminder-app/listeners/moderate.ts`](../examples/reminder-app/listeners/moderate.ts):

```ts
export const moderate = app.listener({
  event: 'message.beforeSent',
  when: { roomTypes: ['channel', 'private'] },   // host-side filter — see below
  async handle(ctx) {
    const { message } = ctx.data;                // typed to the event
    const blocked = (await ctx.settings.get('blockedWords')).split(',').filter(Boolean);
    const hit = blocked.find((w) => (message.text ?? '').toLowerCase().includes(w));
    if (!hit) return ctx.event.pass();                            // observe / allow
    if (hit.startsWith('!')) return ctx.event.prevent('blocked'); // prevent (was …Prevent)
    return ctx.event.patch({ ...message, text: redact(message.text) }); // (was …Modify)
  },
});
```

`ctx.data` is precisely typed per event. `ctx.event.prevent` exists only on
`*.before*` events; `ctx.event.patch` only on events whose subject is modifiable —
encoded in the types (`PreventableEvent`, `ModifiableSubjects` in
[`src/listeners.ts`](../src/listeners.ts)), so you cannot call `patch` in a
post-event handler. Post events (`message.sent`, `room.created`, `user.updated`, …)
return `void`, and a bare `return` still means the same as `pass()`.

The factories sit under `ctx.event`, not on `ctx` itself. The outcome vocabulary
is one domain, and `ctx` already carries the platform surface (`ctx.rooms`,
`ctx.settings`, `ctx.scheduler`); three loose verbs on top of it read like
platform calls, which they are not. `ctx.event.name` holds the event name.

---

## The outcome vocabulary

The SDK covers three intents — `ctx.event.pass`, `ctx.event.patch` and
`ctx.event.prevent`. In-tree **ADR 0002**, "A unified `EventResult` return type
for apps-engine pre-events"
(`docs/adr/0002-unified-event-result-for-pre-events.md`, on branch
`feat/apps-media-call-hooks`), settled the same question for the *legacy* engine
and found a fourth: **prompt** — ask the user, and proceed only if they accept.

| Intent | This SDK | ADR 0002 variant |
|---|---|---|
| allow unchanged | `return` or `return ctx.event.pass()` | `pass` |
| change the subject | `return ctx.event.patch(…)` | `patch` |
| block the action | `return ctx.event.prevent(…)` | `prevent` |
| ask the user first | *missing* — see [Interactive UI](16-surface-interactive-ui.md) | `prompt` |

The ADR reached that vocabulary by inventory: the legacy engine has 16 `IPre*`
handler interfaces and **five** unrelated return contracts across them — boolean,
entity object, `IEmailDescriptor`, void-plus-throw, and fire-and-forget. Three of
its four variants therefore unify mechanisms that already exist; only `prompt` is
new. This redesign starts from the vocabulary instead of arriving at it, so
`defineListener` should ship all four intents, not three.

The rest of this document is what the ADR settled and the SDK sketch has not.

## `patch` is a patch, and a patch is an encoding

`ctx.event.patch(subject)` takes a whole subject. ADR 0002 argues for
`Partial<T>`, and the argument transfers: the host applies both through the same
shallow `Object.assign`, and a whole subject makes an app ship fields it never
touched across the transport.

The shallow merge has three limits. The ADR names them as accepted costs, not
as defects to fix in v1:

- It cannot express **intent**. "Append one attachment" and "replace the
  attachment array" arrive identically. That costs audit fidelity and rules out
  path-granular gating.
- It cannot express **deletion**, because `JSON.stringify` drops `undefined`.
- It replaces nested objects and arrays wholesale.

The v1 rule that keeps the door open: **treat `Partial<T>` as one patch
*encoding*, not as the definition of a patch.** The runtime branches on the
payload's shape when it applies one, so a later `{ ops: [...] }` sibling is
purely additive. That costs nothing now; retrofitting it after apps ship would
be a wire-format break.

Two further rules come with the patch:

- **Patchable fields are an allow-list per subject**, mirroring what the legacy
  builders could already change. Identity and server-owned fields (`id`, `ts`,
  `updatedAt`) are never patchable.
- **Validate once**, after the last listener in the pass — not once per
  listener.

## `prevent` carries a reason the host can translate

`ctx.event.prevent(reason?: string)` takes a bare string. That is not enough: the
host puts the reason in front of a user, and the user's locale is a client fact.
So `prevent` takes either a literal or a translation key, and the two are
mutually exclusive members of a union:

```ts
return ctx.event.prevent({ reason: 'Attachment is larger than the workspace limit' });
return ctx.event.prevent({ i18n: { key: 'file_too_large', args: { max: '10 MB' } } });
```

The host resolves the key against the app's own translations, client-side, at
render time. An app that needs a literal fallback returns `reason` instead,
because a non-UI consumer of the error gets only the raw key and args.

- **The host stamps the attribution, not the app.** A prevented action names the
  app that blocked it. The runtime reads that name and those translations off
  the app record. Metadata an app sends itself is overwritten, never merged —
  the same reserved-key rule that protects
  [`ctx.actor`](40-platform-security-and-permissions.md).
- **Only `prevent` carries attribution.** A `pass` changed nothing, and a
  `patch` yields the subject as every app left it, so neither can be attributed
  to one app.

The legacy engine surfaces prevention reasons inconsistently — some call sites
throw the app's message, `updateMessage` and `deleteMessage` throw a canned
string and discard the reason. One vocabulary makes that one code path.

## Which events allow which outcome

[`src/listeners.ts`](../src/listeners.ts) already encodes two of the four
columns, as `PreventableEvent` and `ModifiableSubjects`. ADR 0002 supplies the
rest, and the rule that governs the fourth: **`prompt` is only realizable when
the operation can be aborted and safely retried** after the user answers,
without losing work or applying a side effect twice.

| Event | pass | patch | prevent | prompt |
|---|---|---|---|---|
| `upload.beforeUploaded` | ✅ | ⚠️ later | ✅ | ✅ |
| `message.beforeSent` / `message.beforeUpdated` | ✅ | ✅ | ✅ | ⚠️ later |
| `message.beforeDeleted` | ✅ | — | ✅ | ⚠️ later |
| `room.beforeCreated` | ✅ | ✅ | ✅ | ⚠️ later |
| `room.beforeDeleted` | ✅ | — | ✅ | ⚠️ later |
| `room.beforeUserJoined` / `room.beforeUserLeave` | ✅ | — | ✅ | ❌ |
| `email.beforeSent` | ✅ | ✅ | ✅ | ❌ |
| livechat room create | ✅ | — | ✅ | ❌ |
| every `*.sent` / `*.created` / post event | ✅ | — | — | — |

- **Upload can prompt** because the two-step `rooms.media` → `rooms.mediaConfirm`
  flow already stages the bytes and defers the message. Upload is also the shape
  to copy: its hard block and its prompt live on **different hooks** — the block
  at the pre-stage, the prompt on the confirm step.
- **Message and room prompting is possible but heavy.** Those run inside a
  synchronous server pipeline, so a prompt means aborting with a challenge and
  having the client re-issue the action with a token — the plumbing 2FA already
  has.
- **Join, leave, livechat and email cannot prompt.** They are often triggered by
  server-side flows with no user to ask.

## Many apps on one event

One event still runs every app that listens to it. The legacy engine chains
Modify handlers and short-circuits Prevent handlers; ADR 0002 writes down the
composition rules that were implicit, and `defineListener` needs the same ones:

1. **Precedence:** `prevent` > `prompt` > `patch` > `pass`. A prevent wins
   immediately and stops the loop.
2. **Patches chain.** Each app sees the subject as the previous apps left it.
   The runtime forwards the **patched subject**, never the outcome wrapper.
3. **First prompt wins.** A prompt suspends the operation at once. On resume the
   chain re-runs from the top, so a later app may prompt in turn, and an app that
   would have prevented gets its say on the second pass.
4. **An outcome the event does not allow is logged and treated as `pass`**
   (fail-open). The types make this unreachable for a well-formed app; the rule
   covers a tampered payload. A disallowed variant is never a legitimate block,
   and failing open degrades better than a user-facing outage on a hot path.

Rule 3 has a cost the ADR accepts explicitly: a prompt can fire even though a
later, un-consulted app would have prevented the action. Consulting every app
before resolving would forfeit the short circuit on the hottest paths.

## The outcome must survive the transport

`ListenerOutcome` is a compile-time brand. At runtime the outcome crosses
JSON-RPC, and two facts decide its runtime shape:

- **A class instance arrives stripped of its prototype and methods.** The
  runtime always sees plain data, so the outcome is a plain object and the
  `ctx.event.*` helpers are factories that stamp it. Nothing is lost by making
  them factories, and the app author never writes the stamp.
- **The discriminator cannot be `type`.** `IMessage` and `IRoom` both carry a
  top-level `type` field, so `'type' in result` cannot tell an outcome from a
  message — and a value allow-list would let a future `MessageType` collide on a
  hot path. ADR 0002 reserves `'@kind': 'EventResult'` instead, recognized by one
  guard that runs **before** any legacy branch. The `@` prefix keeps it out of
  the space of legitimate property names.

This is also what gives the engine a **non-exceptional prevention channel**:
blocking an action no longer means throwing an exception across the transport
and matching on its name at the other end.

## The host type is derived, not restated

ADR 0002 derives its host-side outcome type from the app-facing union: it strips
the marker, which has done its job once the guard recognized the result, and adds
attribution to the `prevent` variant alone.

That is [the sixth design principle](00-overview.md#design-principles) applied to
one return type, and it buys a property worth naming: **a new variant costs one
edit.** Widening the app-facing union widens every host outcome type with it,
where a hand-written host union would silently keep the old vocabulary.

---

## `when` — who gets called

The outcome vocabulary says what a listener answers. `when` says whether the
listener runs at all. The host answers that second question alone, before any app
code runs, and the whole design falls out of one measurement.

### The `check…` gate cannot save the call it guards

The legacy engine pairs every `execute…` with an optional `check…` on the same
app. `AppListenerManager.executePreMessageSentModify`
(`packages/apps/src/server/managers/AppListenerManager.ts`) calls
`checkPreMessageSentModify`, and then calls `executePreMessageSentModify` only if
the first returned true. Both are `app.call(...)` — a JSON-RPC round trip into the
app runtime.

The gate that exists to avoid an app call **is** an app call. For a message no app
wants, a workspace pays two round trips per app that listens, where it used to pay
one. The gate saves the app author an early `return`, and saves the host nothing.

The rule that falls out: **a filter that runs app code is not a filter.** `when` is
static data. The host reads it; the app never sees it.

### Match, then convert, then call

An event reaches apps through three stages today, and the first two charge before
anyone asks whether a single app wants the event:

| Stage | Where | Cost, always paid |
|---|---|---|
| trigger | `Apps.triggerEvent` (`apps/meteor/ee/server/apps/orchestrator.ts`) | none — it guards on `isLoaded()` alone |
| payload | `AppListenerBridge.messageEvent` / `roomEvent` | the converter runs (`convertMessage`, `convertRoom`) |
| dispatch | `AppListenerManager.execute…` | one `app.call` per app that listens, plus its `check…` call |

`AppListenerBridge.uploadEvent` is the extreme case: it writes the uploaded bytes
to a temporary file on disk **before** it asks the listener manager anything. The
migration plan already names that cost. It wants upload validation decoupled so
the engine is "not forced to transfer file contents over NATS"
([`docs/apps-engine-migration.md`](../../../docs/apps-engine-migration.md)).

So the order is a rule, not an implementation detail:

1. **Match** `when` on the **host-native** record the call site already holds.
   The host translates each key as it matches. The app wrote none of those names.
2. **Convert** the payload once, and only if at least one listener survived.
3. **Call** the survivors.

Step 1 is what makes step 2 skippable. It also fixes the direction of the current
code: a filter evaluated on the app-facing entity would force the conversion
first, which is the cost we set out to avoid. The host pays for the reordering
with a translation step, and that translation is the rule the whole vocabulary
rests on.

### The filter index

Legacy registration builds one map, `event → appId[]`, from
`getImplementationList()` (`AppListenerManager.registerListeners`). The map has
one dimension because the manifest carries one fact: the app implements the
interface.

A listener definition carries two facts — the event and the filter — so the index
becomes `event → (appId, filter)[]`, built at install and rebuilt on enable,
update and disable. The shape does not change; the entry grows a field.

Two properties follow:

- **An empty surviving set skips the event outright**, payload build included.
  The legacy engine cannot reach that state, because emptiness is knowable only
  after the app calls that the emptiness would have saved.
- **The index is host state, not app state.** It survives an app-runtime restart,
  and the host reads it without a bundle loaded. That is what lets the host decide
  before it talks to the runtime at all — in-process or over NATS
  ([41](41-platform-deployment-and-isolation.md)).

### An app filters in the vocabulary it already knows

Two gates decide whether a predicate is admissible, and they are independent.

**Gate 1 — the app names only what the app can see.** A `when` key names a field
of the app-facing model, and a `when` value uses that field's app-facing values:
`roomTypes: ['channel']`, never `t: ['c']`. The author writes the filter against
the same `IRoom`, `IMessage` and `IUpload` that `ctx.data` hands the handler, so
one vocabulary covers the filter and the body of the listener.

**Every divergence from that vocabulary is the host's to absorb.** The host owns
the mapping, versions the mapping with itself, and renames a stored field without
touching an installed app. This is
[principle #6](00-overview.md#design-principles) applied to the filter: a `when`
that named `room.t` would be an app that reached around `ctx` into server
internals, and it would be an app that a schema migration breaks.

The mapping is not always a rename. `IRoom.type` offers six values where the room
record carries four: `'discussion'` means `prid` is set, and `'team'` means
`teamMain` is set. The host computes both. That is still the host's work, and it
is still cheap, because both fields sit on the record already in hand.

**Gate 2 — the host answers without a read.** A predicate must be answerable from
the event payload and the app record. No database query, no network call. A
predicate that costs a query costs more than the call it saves.

| Predicate | App-facing field | The host answers it from |
|---|---|---|
| `roomTypes` | `IRoom.type` | `room.t`, plus `prid` / `teamMain` for the two derived values |
| `roomIds` | `IRoom.id` | `room._id` |
| `senders` | `IMessage.senderId` → `IUser.type` | `message.u._id`, `message.bot` |
| `inThread` | `IMessage.threadId` | `message.tmid` |
| `hasAttachment` | `IMessage.attachments` | `message.attachments`, `message.file` |
| `mimeTypes` | `IUpload.type` | `upload.type` |
| `maxSize` | `IUpload.size` | `upload.size` |

Gate 2 rejects the sender's roles, the room's member list, the user's subscription
state, and every fact about the app's own stored records. Each one is a read. Each
one belongs in the handler.

Gate 1 rejects a different set, and its remedy is different. Two filters an app
plainly wants — "only system messages of this kind" and "only messages that
mention me" — have no app-facing field to name, because `IMessage` in
[`src/models.ts`](../src/models.ts) carries neither a message kind nor a mention
list. The remedy is not a `messageTypes` key that reads `message.t` behind the
app's back. The remedy is to give `IMessage` the field, in the app-facing
vocabulary, and then let a filter name it like any other. **A missing predicate is
a gap in the model, not a licence to leak the host field.**

Two consequences for the sketch. `EventFilter` in
[`src/listeners.ts`](../src/listeners.ts) carries `[k: string]: unknown`, and that
index signature is a hole: nothing validates it, it cannot vary per event, and the
host cannot evaluate a key it does not know. Close it, and key the filter by event
the way `EventPayloads` already keys the data:

```ts
export interface EventFilters {
  'message.beforeSent': {
    roomTypes?: RoomType[];
    roomIds?: RoomId[];
    senders?: ('user' | 'bot' | 'app')[];
    inThread?: boolean;
  };
  'upload.beforeUploaded': {
    roomTypes?: RoomType[];
    mimeTypes?: string[];      // 'image/*' matches a family
    maxSize?: number;
  };
  // … one entry per event; an event with no filterable facet declares none
}

export interface ListenerDef<Env extends AppEnv, E extends EventName> {
  event: E;
  when?: EventFilters[E];      // was: EventFilter
  handle(ctx: ListenerContext<Env, E>): Promise<ListenerOutcome | void> | ListenerOutcome | void;
}
```

An absent key is no constraint. Keys **AND** each other; the values inside one key
**OR** each other. That is the whole algebra — no negation, no nesting, no boolean
tree. A flat conjunction of disjunctions costs O(keys) to evaluate, has no
evaluation-order pathology, and stays indexable if a hot event later deserves an
index over the filter set instead of a scan. A predicate tree is where a filter
language turns into a query language, and the query language has its own scope
([24](24-data-read-surface.md)). An event that truly needs negation gets a named
key (`excludeRoomIds`), never a combinator.

**One default is not "no constraint".** An app that posts a message and listens on
`message.sent` triggers itself. Every app writes that guard by hand today, and no
app wants the loop. So `senders` drops the messages of the app's own user unless
the filter asks for them. That is the one key whose absence means something, and
the exception earns its keep.

### `when` narrows delivery; permissions narrow authority

A filter is a delivery hint. It grants an app nothing, and it never widens what an
app receives: the app is still called only for events its declared permissions
cover ([40](40-platform-security-and-permissions.md)). The two mechanisms compose
in one direction — permissions first, `when` second — so a `when` that names a
room the app cannot read simply never matches.

That is what makes the failure mode easy to pick. **The host drops a filter key it
does not recognize, and calls the listener.** An old host running a new app
over-delivers; the handler is the backstop and returns `pass()`. The opposite
choice — read an unknown key as "no match" — silently disables a listener on a
host that is merely out of date, and the app author sees no error anywhere.

This is the fail-open rule from [many apps on one event](#many-apps-on-one-event),
aimed at a different question. There, fail-open means "do not block". Here it
means "do not stop delivery in silence". Both prefer the loud, cheap error to the
quiet, expensive one.

### What `when` deliberately cannot express

Every predicate above is a fact about the event. Real apps also want facts about
themselves: "only the rooms the admin configured", "only rooms I hold a record
for". Neither is static data, so neither is a `when` value in v1. Three ways out,
in the order to take them:

1. **Filter in the handler.** The call happens and the app returns `pass()` in
   microseconds. Correct today, and one round trip is the whole cost.
2. **Let a value reference an app setting.** The host already holds the app's
   settings on the app record, so `roomIds: { setting: 'watchedRooms' }` needs no
   app call and no query. This covers most of case 1 in practice, because "the
   admin configured it" means a setting.
3. **Let the app maintain a delivery set on the host** — the association surface
   from [18](18-surface-store-associations.md), read as a subscription. Genuinely
   stateful, genuinely larger, and not v1.

Ship 1. Shape the types for 2 now, because the move is the one the patch encoding
already makes: **a filter value is a union from the first release** — a literal,
or a reference — so the runtime branches on the value's shape and a later
reference form stays additive. A bare `RoomId[]` would make case 2 a wire-format
break.

### The filter is also documentation

The `check…` gate could never have this property: the install screen can state
what an app sees. "This app reads messages in public channels" follows from a
`when` and a permission; it does not follow from the body of a `check…` method. An
admin who reviews an app today gets the permission list and nothing narrower.
`when` turns the narrower answer into a fact the host already parsed.

Gate 1 is what makes that answer renderable. The filter is already written in the
vocabulary the admin screen speaks, so the screen prints `roomTypes: ['channel']`
as "public channels" and never has to explain a `t` of `'c'`.

Three decisions here deserve a challenge: the self-delivery default; the closed
per-event filter, which trades an index signature for one filter entry per new
event; and gate 1's remedy, which makes every new predicate a change to the
app-facing model rather than a change to the filter alone.
