# ADR 0002 — A unified `EventResult` return type for apps-engine pre-events

## Status

**Accepted — partially implemented.** The branded variants and the `EventResult.*` factories landed
in `packages/apps-engine/src/definition/eventResult/`, the host-side `isEventResult()` guard and
`HostEventResult` in `packages/apps/src/server/eventResult/`, and the media-call pre-create event is
their first consumer (see [ADR 0003](./0003-media-call-events-for-apps.md)). Two parts of this
decision are deliberately not in the code yet:

- **`prompt` has no type definitions.** No event permits it today, and no flow can suspend and
  resume to serve it. The variant is specified below and lands with the first event that needs it —
  see [Follow-ups](#follow-ups) item 4. The shipped union is `pass | patch | prevent`.
- **The existing message / room / upload / email handlers are not widened.** That is Strategy B
  below, still open.

- **Date:** 2026-08
- **Scope:** `packages/apps-engine` (definitions), `packages/apps` (engine runtime),
  `apps/meteor/app/apps/server/bridges` (host)
- **Supersedes:** the `apps-engine-event-result-return-type` proposal

## Decision

One uniform return type for apps-engine pre-events — `pass` / `patch` / `prevent` / `prompt` —
replaces the five inconsistent return contracts in use today (boolean, entity-object,
`IEmailDescriptor`, void+throw, fire-and-forget). `prompt` is the one genuinely new capability;
`pass` / `patch` / `prevent` unify mechanisms that already exist across messages, rooms, uploads and
email.

The variant vocabulary is a discriminated union on `type`:

```ts
// the variants, written without the marker each shipped one carries
type EventResultVariants<T> =
  | { type: 'pass' }                                   // allow unchanged
  | { type: 'patch'; patch: Partial<T> }               // patch the subject (message/room/upload/…)
  | { type: 'prevent'; reason: string }                // literal, pre-formatted
  | { type: 'prevent'; i18n: { key: string; args?: { [key: string]: string | number } } }
  | { type: 'prompt'; message: string }                // simple text form …
  | { type: 'prompt'; i18n: { key: string; args?: { [key: string]: string | number } } }
  | {                                                  // … or rich form (the confirmation UI payload)
      type: 'prompt';
      title?: TextObject;
      text?: TextObject;
      blocks?: Block[];
      confirmLabel?: string;                           // default "Send"
      cancelLabel?: string;                            // default "Cancel"
    };
```

`TextObject` is `@rocket.chat/ui-kit`'s `TextObject` (`PlainText | Markdown`); the apps-engine
`ITextObject` is deprecated in favor of it. Because ui-kit text renders through the
app-translation-aware surface renderer (`useStringFromTextObject` → `useAppTranslation`), a rich
prompt's `title`/`text` can itself be an app i18n key resolved client-side at render time. The
`i18n: { key, args? }` member on `prevent` and on the simple `prompt` is the explicit translation
channel for the non-UIKit paths (a thrown `Meteor.Error`, a plain modal).

**There is no marker-free `EventResult<T>` type in the code.** Every shipped variant carries the
reserved marker — see [The discriminator](#the-discriminator--reserved-kind-eventresult) — and an
author annotates against `MarkedEventResult<T>`, or against a per-event alias that restricts it. The
marker still never appears in app source, because the factories stamp it. One union carrying the
marker, rather than a marker-free twin of it, is what lets a host type be derived from the app-facing
one instead of restated beside it.

**`prompt` is specified here, not implemented.** `PromptEventResult`, its payload type and the
`EventResult.prompt()` factory are absent from `packages/apps-engine`, and `MarkedEventResult` is
`pass | patch | prevent`. Shipping a variant no event accepts would put a factory in every app
author's autocomplete that can only ever fail to typecheck, and would pull `@rocket.chat/ui-kit`'s
`Block` and `TextObject` into the definitions for a payload nothing reads. The variant is designed
in full so the first event that needs it inherits the decisions rather than reopening them; adding
it later is purely additive, because `isEventResult()` dispatches on `@kind` and the executors
already treat an unknown variant as `pass`.

### The ten design decisions

1. **`patch` chains the patched *subject*, not the wrapper.** The manager unwraps a `patch`
   decision, applies it to the subject, and feeds the **patched subject** to the next app —
   identical to today's Modify chain (`msg = await app.call(…, msg)`). What must never flow to the
   next app is the raw `EventResult` wrapper. "Break the chain" only ever means "don't forward the
   wrapper."
2. **Short-circuit execution.** `prevent` stops the listener loop immediately (matching today's
   "first truthy prevents"). `prompt` suspends the operation immediately (first-prompt-wins); on
   resume the gate re-runs from the top and a later app may prompt again. We accept that a `prompt`
   can fire even though a later, un-consulted app would have `prevent`ed — the alternative (run
   every app before resolving) forfeits short-circuiting on hot paths. `prevent` still beats
   `prompt` within one app's decision and across a resume.
3. **Strategy B is the destination; Strategy A is the bootstrap.** Existing handlers are ultimately
   re-typed to return their restricted `EventResult` union (semantics unchanged), with consumption
   sites accepting **both** legacy shapes and `EventResult` behind the guard. We bootstrap with the
   guard plus new, additive handlers (Strategy A), then widen existing events per event.
4. **Reserved discriminator `'@kind': 'EventResult'`.** A single `isEventResult(x)` guard checks
   `@kind` and runs **before** any legacy `typeof === 'object'` / truthiness branch. Authors never
   write `@kind`; the factories stamp it.
5. **`EventResult.*` factories.** `EventResult` is a *value* namespace of factory functions, and
   nothing else: the name is not also a type. Factories stamp the marker and return
   **branded per-variant types**. Per-event narrowing comes from **each handler interface's
   restricted return-type alias** — not from a new accessor and not from a generic `IModify`.
6. **`patch` merge is shallow** — one level of spread over the subject, as `Object.assign` does at the
   existing Modify call sites; nested objects and arrays are replaced wholesale.
7. **Patchable fields mirror the builder surface** per subject (an explicit allow-list constant
   tracking `IMessageBuilder` / `IRoomBuilder` / …). Re-validate **once, at end of pass**.
8. **`prevent` carries either `reason` (literal) or `i18n: { key, args? }`** — two mutually
   exclusive union members. `i18n` translation is **client-side**, via the `error-app-prevented`
   error `details`. Surfacing is standardized across **all** call sites.
9. **Upload confirmation is the intended first application of `EventResult.prompt`**, via a new
   upload handler, superseding the standalone `IUploadConfirmationRequest`. That work has its own
   proposal and is not in this repo yet.
10. **Disallowed variant at runtime → log and treat as `pass`** (fail-open); the static types make
    this unreachable for well-formed apps.

## Context

Apps-engine has **16** `IPre*` handler interfaces, and they do **not** share a contract. Five
distinct consumption patterns already exist:

| Pattern | Return | "Block" mechanism | Events |
| --- | --- | --- | --- |
| **Boolean-prevent** | `Promise<boolean>` (first truthy short-circuits) | return `true` | `IPreMessageSentPrevent`, `IPreMessageDeletePrevent`, `IPreMessageUpdatedPrevent`, `IPreRoomCreatePrevent`, `IPreRoomDeletePrevent` |
| **Object-chain Modify/Extend** | `Promise<IMessage>` / `Promise<IRoom>` (result replaces subject, fed to next app) | n/a | `IPreMessageSent{Extend,Modify}`, `IPreMessageUpdated{Extend,Modify}`, `IPreRoomCreate{Extend,Modify}` |
| **Object-replace + fallback** | `Promise<IEmailDescriptor>` | throw | `IPreEmailSent` |
| **Void + throw-to-block** | `Promise<void>` | throw a typed exception | `IPreFileUpload` (`FileUploadNotAllowedException`), `IPreLivechatRoomCreatePrevent` (`AppsEngineException`), `IPreRoomUserJoined` / `IPreRoomUserLeave` (`UserNotAllowedException`) |
| **Fire-and-forget** | `Promise<void>` | n/a | all `IPost*` |

None of them can express *"prompt the user and proceed only if they accept,"* and there is no single
vocabulary an app author can reach for regardless of which event they hook.

Existing inconsistencies, which are the evidence this space needs unifying:

- `IPreLivechatRoomCreatePrevent` carries the `Prevent` suffix but is void/throw, not boolean — and
  its `AppMethod` string even drops the `Pre` (`executeLivechatRoomCreatePrevent`).
- In the listener type map `IListenerExecutor`
  (`packages/apps/src/server/managers/AppListenerManager.ts:47`), `IPreMessageUpdatedExtend` is
  typed `result: boolean` while its sibling `IPreMessageSentExtend` is `IMessage`;
  `IPreMessageUpdatedPrevent` is `result: unknown`; `IPreEmailSent` is typed `IUIKitResponse` but
  the implementation returns `IEmailDescriptor`.
- Prevention exists in **three** forms today (boolean return, thrown exception, and — for email —
  either).
- `prevent` reasons are surfaced **inconsistently**: `createRoom.ts:267`, `FileUpload.ts:206` and
  `addUserToRoom.ts:75` throw the app's `error.message`, but `updateMessage.ts:34` and
  `deleteMessage.ts:42` throw a canned generic string and discard the app's reason entirely.

Requirements taken as given: **must not break existing apps**, and **different events may allow
different subsets** of `EventResult` (upload may allow `prompt`; a login pre-event may not).

### Where return values are actually interpreted

This is the crux of the non-breaking analysis. Return values are consumed at three tiers:

1. **`AppListenerManager`** — the per-event executors. Every one consumes the app's return with a
   **blind cast, no shape inspection**: `as boolean` (`:512`) or `as IMessage` / `as IRoom` (`:561`,
   `:741`, `:834`). Prevent loops short-circuit on the first truthy value (`:514`); Modify/Extend
   **chain** the returned object into the next app (`msg = await app.call(...)`, `:538`, `:561`).
2. **`AppListenerBridge`** (`apps/meteor/app/apps/server/bridges/listeners.ts`) — only **two** sites
   duck-type the result, and coarsely: `messageEvent` (`:377`) and `roomEvent` (`:421`) both treat
   "boolean or undefined → pass through, anything else → it is the entity, convert it".
3. **The Rocket.Chat server call sites** — `sendMessage.ts:241`/`:252`, `createRoom.ts:265`,
   `deleteMessage.ts:40`, `updateMessage.ts:32`, `FileUpload.ts:203`, `email/api.ts:176`.

Two facts fall out of this and drive the whole design:

- **The `patch` variant is not new machinery.** `sendMessage.ts:252` and `createRoom.ts` already do
  `Object.assign(subject, result)` (shallow) with the object an app returns from Modify/Extend, and
  re-validate once afterward. `EventResult.patch` formalizes what the object-chain pattern already
  does implicitly.
- **The interpretation points are few and centralized** — the manager executors, two bridge
  duck-type sites, and about six call sites. An `EventResult` can be recognized and dispatched at
  these known choke points.

## Architecture

### Serialization boundary — not a problem

App handlers run in a sandboxed runtime; `ProxiedApp.call` (`packages/apps/src/server/ProxiedApp.ts:64`)
dispatches over JSON-RPC. Any return must be JSON-serializable. This has a useful corollary for the
authoring API: a class *instance* would arrive **stripped of its prototype and methods**, so the
manager always sees plain data (`{ '@kind': 'EventResult', type: 'prevent', … }`) regardless of how
the author constructed it. `EventResult` is a plain object, and `Block[]` already crosses this
boundary for UIKit interactions and for `IMessage.blocks`, so all four variants serialize with no
new work.

Today's "throw to prevent" relies on `AppsEngineException` crossing back as a JSON-RPC error
(`ProxiedApp.ts:70`). `EventResult.prevent` gives a **non-exceptional** prevention channel, which
removes the `error.name === AppsEngineException.name` string-matching at call sites.

### The discriminator — reserved `'@kind': 'EventResult'`

The naïve design (discriminate on `.type`) has a concrete collision: **`IMessage` has a top-level
`type?: MessageType` field** (`IMessage.ts:37`), and `IRoom` similarly carries a `type`. So
`'type' in result` cannot distinguish an `EventResult` from a legitimate message or room, and a
value allow-list (`result.type in {pass,patch,prevent,prompt}`) is fragile — a future `MessageType`
value, or an app that sets a custom `type`, could collide and make `Object.assign` merge an
`EventResult`'s fields onto a real message on a hot path.

The decision is a **reserved marker the entities never carry** — `'@kind': 'EventResult'` — checked
by a single `isEventResult(x)` type guard used everywhere, running **before** any legacy branch. The
`@` prefix keeps it out of the space of legitimate property names, so there is zero overlap with
`IMessage` / `IRoom` / `IEmailDescriptor`. `MarkedEventResult<T>` is the union carrying `@kind`, and
it is the type both the manager and the app author work against; the factories are the only thing
that writes the marker.

### Would an `EventResult` be misinterpreted if returned today? Yes

If an app returned an `EventResult` from an existing handler *without* the consumers being updated:

- from a **Modify/Extend** handler it would be chained forward as the new message and pushed through
  `convertAppMessage` and `Object.assign` — corrupting the message;
- from a **Prevent** handler any non-empty object is truthy, so `{type:'pass'}` would wrongly
  **block**;
- from a **void** handler it would be silently dropped.

This confirms the two ordering rules below: the guard must run *before* the existing branches, and
consumers must be taught about `EventResult` before any handler is allowed to return one.

### Non-breaking guarantee

Existing apps return `boolean` / `IMessage` / `IRoom` / `IEmailDescriptor` / `void` / throw. As long
as (1) the `isEventResult()` guard is checked **before** the legacy `typeof === 'object'` and
truthiness branches at every consumption site, and (2) legacy return shapes keep flowing down the
unchanged path, then apps that never return an `EventResult` behave exactly as before.

Legacy ↔ `EventResult` mapping, mechanical at each guarded site:

- Legacy `boolean true` from a Prevent handler ≡ `EventResult.prevent`.
- A legacy returned entity from a Modify/Extend handler ≡ a full `patch`: both funnel through the
  same shallow `Object.assign(subject, x)` plus a single end-of-pass validate, and the **accumulated
  subject** is what chains forward.

This mapping is what lets an app migrate `return true` → `EventResult.prevent(…)` or
`return message` → `EventResult.patch(…)` with identical runtime behavior.

### Authoring API — `EventResult.*` factories

`EventResult` is a *value* namespace of factories. This gives one discoverable entry point, keeps the
marker an implementation detail, and lets per-event restriction come from the **handler's return
type** rather than a new accessor.

```ts
// value namespace stamps '@kind':'EventResult' and returns BRANDED per-variant
// types, so disallowed variants fail to typecheck at the `return`.
export const EventResult = {
  pass:    (): PassEventResult                     => ({ '@kind': 'EventResult', type: 'pass' }),
  prevent: (o): PreventEventResult                 => ({ '@kind': 'EventResult', type: 'prevent', ...o }),
  patch:   <T>(p: Partial<T>): PatchEventResult<T> => ({ '@kind': 'EventResult', type: 'patch', patch: p }),
  // not shipped — lands with the first event that permits it:
  // prompt: (o): PromptEventResult                 => ({ '@kind': 'EventResult', type: 'prompt', ...o }),
};
```

Each handler interface declares its allowed union as its return type; the branded factory returns
then enforce the subset:

```ts
type MessageModifyEventResult  = PassEventResult | PatchEventResult<IMessage>;
// an event that permits every variant names the whole union instead of listing it:
// type MediaCallCreateEventResult = MarkedEventResult<MediaCallCreatePatch>;

interface IPreMessageSentModify {
  executePreMessageSentModify(msg, builder, read, http, persis): Promise<MessageModifyEventResult>;
}

// app author:
async executePreMessageSentModify(msg, builder): Promise<MessageModifyEventResult> {
  return EventResult.prevent({ reason: 'no' });     // ❌ PreventEventResult ∉ pass | patch
  return EventResult.patch({ text: 'redacted' });  // ✅ patch checked as Partial<IMessage>
  return EventResult.pass();                        // ✅
}
```

- **No generic `IModify`, no new `IModifyDecide` accessor.** `IModify` is a single shared interface
  that cannot infer the event; putting `decide` there would give the same unrestricted union
  everywhere. The event identity already lives in *which interface the author implements* and *what
  that interface returns*.
- The restricted return type also gives `EventResult.patch(...)` correct `Partial<T>` checking via
  contextual typing.
- **Tradeoff accepted:** typing `EventResult.` lists all four variants in autocomplete; disallowed
  ones simply fail to typecheck at the `return`.

### Multi-app composition and precedence

1. **Precedence:** `prevent` > `prompt` > `patch` > `pass`. Any `prevent` wins immediately.
2. **`patch` composition:** apply sequentially in listener order, chaining like Modify does today —
   each app sees the accumulated patched subject. Re-validate once at the end.
3. **Multiple `prompt`s:** first prompt wins; on resume the gate re-runs and the next app may prompt
   again — the same "one challenge resolved per round-trip" model TOTP uses.
4. **Short-circuit consequence:** because the loop stops at the first `prompt`, a later app that
   would have `prevent`ed is not consulted in that pass; on resume the loop re-runs from the top and
   that app's `prevent` blocks then.

### Runtime enforcement

The capability matrix is enforced **statically** (each handler's declared return-type union) and, as
defense in depth, **at runtime**. If an app returns a variant the event does not permit — reachable
only via a bug or a tampered JSON-RPC payload — the manager **logs a warning and treats the decision
as `pass`** (fail-open). A disallowed variant is never a legitimate block (a well-formed `prevent`
is allowed on every event in the matrix), and proceeding as `pass` degrades more gracefully than
turning a malformed return into a user-facing outage on a hot path.

### The host-side shape — `HostEventResult`

The host reads back the vocabulary the app spoke. `HostEventResult<M>` is **derived** from the
app-facing union `M`: it strips the marker, which has done its job once the guard recognized the
result, and adds `meta` to the `prevent` variant alone.

```ts
type HostEventResult<M extends MarkedEventResult<any>, U = DistributiveOmit<M, '@kind'>> =
  U extends { type: 'prevent' } ? U & { meta: EventResultMeta } : U;
```

Two things follow, and both are the point of deriving rather than restating:

- **A new variant costs one edit.** Widening `MarkedEventResult` with `prompt` widens every host
  outcome type with it. A hand-written host union would silently keep the old vocabulary.
- **`meta` is where it is needed and nowhere else.** Only a `prevent` has to name the app: the host
  puts that app's name and its translations in front of a user. A `pass` changed nothing, and a
  `patch` carries the subject as every app left it, so neither attributes anything to one app.

`EventResultMeta` is stamped by the engine from the `ProxiedApp`, never sent by an app. `meta` on the
wire is overwritten, not merged: `isEventResult` recognizes the marker and nothing under it, so an
app can send a `meta` of its own and it must not be believed.

## Per-variant feasibility

| Variant | Feasibility | Notes |
| --- | --- | --- |
| `pass` | Trivial | Equivalent to today's "return `false`" (prevent) / "return the unchanged subject" (modify) / "return void". |
| `patch` | Easy | Already effectively implemented as shallow `Object.assign(subject, result)` at `sendMessage.ts:252` / `createRoom.ts`. Merge is shallow. Patchable fields mirror the builder's setter surface per subject (an explicit allow-list constant), giving parity with what Modify can already change — so widening stays non-breaking, while identity/server fields (`_id`, `ts`, `_updatedAt`) are excluded because the builder never exposes them. Re-validate once at end of pass. |
| `prevent` | Easy | Unifies the boolean-return and throw-exception channels. Maps onto `Meteor.Error('error-app-prevented', …)` with the key/args in `details` for client-side translation against the user's actual UI locale. Surfacing is standardized across all call sites — including `updateMessage` / `deleteMessage`, which currently discard the reason. |
| `prompt` | **Hard, event-dependent** | Genuinely new. Requires the triggering flow to suspend and resume — a TOTP-style challenge. Two shapes: simple (`{ message }` or `{ i18n }`) and rich (`{ title?, text?, blocks?, confirmLabel?, cancelLabel? }`). |

### Which events can support `prompt`

`prompt` is only realizable when the operation can be aborted and safely retried after the user
answers, without losing work or double-applying side effects.

- **File upload — yes.** The two-step `rooms.media` → `rooms.mediaConfirm` flow already stages the
  bytes and defers the message; the prompt fits on the confirm step. Upload's `prevent` and `prompt`
  live on **different handlers**: hard blocks stay on the block-only `IPreFileUpload` at the
  `rooms.media` pre-stage, while `prompt`/`pass` go on a new confirmation handler at
  `rooms.mediaConfirm`.
- **Message send / update, room create — possible but heavy.** These run inside a synchronous server
  pipeline. Prompting means aborting with a challenge error and having the client re-issue the send
  with a confirmation token — the client message-send path would need the same challenge/re-send
  plumbing 2FA has.
- **Delete — possible** (the client can re-issue with a token).
- **Room user join/leave, livechat room create, email** — often triggered by non-interactive or
  server-side flows with no user to prompt. `prompt` is **disallowed** for these.

## Per-event capability matrix

| Event | pass | patch | prevent | prompt |
| --- | --- | --- | --- | --- |
| Media call created (pre) | ✅ | ✅ | ✅ | ⚠️ later |
| File upload | ✅ | ⚠️ later | ✅¹ | ✅¹ |
| Message sent / updated | ✅ | ✅ | ✅ | ⚠️ later |
| Message delete | ✅ | — | ✅ | ⚠️ later |
| Room create | ✅ | ✅ | ✅ | ⚠️ later |
| Room delete | ✅ | — | ✅ | ⚠️ later |
| Room user join / leave | ✅ | — | ✅ | ❌ |
| Livechat room create | ✅ | — | ✅ | ❌ |
| Email sent | ✅ | ✅ | ✅ | ❌ |
| (future) Login | ✅ | — | ✅ | ❌ |

¹ Upload's `prevent` and `prompt` live on different handlers, as described above. The row is an
aggregate across both hooks, not a single four-way union. Upload `patch` is deferred: there is no
upload-modify path today, and `patch` needs its own `IUploadDetails` allow-list that nothing yet
depends on.

## Rollout

1. **Done.** Land the `EventResult` type, the `EventResult.*` factories and the `isEventResult()`
   guard in `@rocket.chat/apps-engine` (`definition/`). Both packages are in-repo, so no external
   package release is required — only the definitions are published
   (`files: ["definition/**"]`).
2. **Done.** Implement Strategy A for the media-call event hooks, returning the correct
   `EventResult` variants. This establishes the pattern later events reuse — see
   [ADR 0003](./0003-media-call-events-for-apps.md).
3. **Open.** Widen the existing events (Strategy B) per event: re-type each `execute*` to its
   restricted union, add the guard ahead of every legacy branch, and standardize `prevent` reason
   surfacing (fixing `updateMessage` / `deleteMessage`).
4. **Open, optional.** Deprecate the throw-to-prevent exceptions in favor of `EventResult.prevent`.

Backward compatibility holds at every step, because new handlers use new `AppMethod` keys and
widened handlers accept legacy shapes behind the guard-before-legacy ordering.

## Alternatives considered

- **Discriminate on `.type` alone.** Rejected: `IMessage.type` and `IRoom.type` collide with it, and
  a value allow-list is fragile on a hot path.
- **A class instance (`new PreventResult(…)`) as the authoring API.** Rejected as pointless: the
  JSON-RPC boundary strips the prototype, so the manager sees plain data either way. The choice is
  purely one of authoring ergonomics, and the companion object gives narrowing for free.
- **A new `IModifyDecide` accessor, or a generic `IModify<Event>`.** Rejected: `IModify` cannot
  infer the event, so `decide` there would offer the same unrestricted union everywhere. Restriction
  belongs on the handler's return type. A narrowed accessor that hides invalid variants from
  autocomplete could be layered on later without changing the return types.
- **"Strategy A forever"** — keep existing handlers frozen on legacy types and only ever add
  parallel `EventResult` interfaces. Rejected: it leaves two ways to do the same thing indefinitely
  and makes the capability matrix aspirational rather than honest. Strategy B makes each event
  express its real, restricted capability in one vocabulary.
- **RFC 6902 JSON Patch written by app authors.** Rejected for `patch`: stringly-typed JSON Pointers
  forfeit the compile-time `Partial<T>` checking that per-event narrowing depends on, and under the
  fail-open rule a single typo'd pointer would silently discard an app's entire patch. See the
  builder-generated alternative under Follow-ups.

## Consequences

- App authors get one vocabulary across every pre-event, and one discoverable entry point
  (`EventResult.`).
- The engine gains a non-exceptional prevention channel, so preventing a call no longer requires
  throwing across the JSON-RPC boundary.
- Strategy B will have to edit the hottest paths in the product (message send, room create). The
  guard-before-legacy ordering is the only thing keeping those edits safe, so it is a review
  invariant, not a stylistic preference.
- `patch` is deliberately less expressive than the builders (see Follow-ups); an app migrating
  `return builder.getMessage()` → `EventResult.patch(…)` gives up positional operations.

## Follow-ups

> **Nothing below this heading is decided.** These are open problems and candidate answers,
> recorded so the analysis is not redone: the op-log encoding, the builder-generated patches and
> the `prompt` design are sketches, and where an item says a future implementation "must" do
> something, read it as the constraint that sketch depends on, not as a rule the current code
> already follows. Item 4 is the one with a named first consumer, and even that is unscheduled.

1. **`patch` allow-list drift.** The allow-list constant must stay in sync with the builder surface
   as subjects gain fields; re-validation at end-of-pass is the backstop.
2. **`patch` cannot express intent, appends, positional edits or deletion.** A shallow `Partial<T>`
   merge can only say *replace this field*, while the builders Modify handlers still receive expose
   operations that are structurally not merges: appends (`addAttachment`, `addBlocks`,
   `IRoomBuilder.addUsername`), positional edits (`replaceAttachment(position, …)`,
   `removeAttachment(position)`) and keyed inserts that reject an existing key (`addCustomField`).
   Under `patch` an app expresses an append as read-modify-write, which is **correct** — the
   listener loop chains strictly sequentially, so there is no lost-update hazard — but *intent* is
   lost: the server cannot distinguish "appended one attachment" from "replaced the whole array".
   That costs audit fidelity and rules out path-granular gating. Two further consequences: shallow
   merge forces whole-subtree rewrites for nested fields, and because `patch` is JSON-serialized —
   where `JSON.stringify` drops `undefined` — it cannot express **field deletion** at all.

   **The v1 constraint that keeps the door open:** treat `{ type: 'patch'; patch: Partial<T> }` as
   *one* patch **encoding**, not as the definition of `patch`. The manager must branch on the patch
   payload's shape at apply time rather than assuming `Partial<T>`, so a future
   `{ type: 'patch'; ops: [...] }` sibling is purely additive. This costs nothing now, but
   retrofitting it later would be a wire-format break.
3. **Builder-generated patches.** The tractable way to close item 2 is to have `EventResult.patch`
   **generate** the ops, so the authoring surface stays typed and the op encoding stays an
   implementation detail. Most of the generator already exists: `MessageBuilder`
   (`packages/apps/base-runtime/src/lib/accessors/builders/MessageBuilder.ts`) is already a change
   recorder — it keeps `private changes: Partial<IMessage>` (`:17`) and exposes `getChanges()`
   (`:254`) — and it already demonstrates the exact intent erasure described above:
   `addAttachment`, `setAttachments`, `replaceAttachment(position, …)` and
   `removeAttachment(position)` all collapse to one `attachmentsChanged` flag (`:122`–`:164`), so
   `getChanges()` emits the whole array wholesale (`:257`). `RoomBuilder.getChanges()` (`:182`) has
   the same shape. The work is to upgrade `changes` from `Partial<T>` plus two boolean flags into an
   op log, making `EventResult.patch()` approximately `builder.getPatch()`. Notable properties:

   - **No new API for app authors.** The builder methods they already call *are* the declarative
     surface; `removeAttachment(2)` emits `remove /attachments/2`. A future `unset` emits
     `remove /alias`, closing the deletion hole.
   - **It also fixes `ModifyUpdater`**
     (`packages/apps/base-runtime/src/lib/accessors/modify/ModifyUpdater.ts:92`, `:122`), which today
     ships the entire attachments array to the server for any single-attachment change.
   - **It rules out two tempting alternatives.** Structural diffing (`patch(before, after)`) cannot
     recover the append-vs-replace distinction that is the whole point, and Immer's
     `produceWithPatches` would mean bundling a dependency into every app sandbox — `apps-engine`
     publishes only `definition/**` with exactly one runtime dep (`uuid`), and the `base-runtime`
     builders are dependency-free plain-object code.
   - **A closed generator shrinks the server-side validator.** Because the generator is the only
     producer, the op vocabulary is a known subset: no `move`, no `copy`, no arbitrary deep
     pointers, and paths rooted in allow-listed fields by construction.
   - **New hazard: index staleness — conditional, not general.** Within the listener chain,
     index-based ops are safe for the same reason read-modify-write is: each app sees the
     accumulated patched subject. Staleness only arises if ops are applied somewhere other than the
     chain step that produced them — concretely the `prompt` resume path. The rule is **apply
     immediately, or regenerate on resume**.
4. **Implement `prompt` with the first event that permits it.** That means adding `PromptPayload`,
   `PromptEventResult` and the `EventResult.prompt()` factory, widening `MarkedEventResult`, and
   giving that event's executor a suspend/resume path — the variant is inert without one. Upload
   confirmation is the intended first case; message and room prompting needs the client send-path
   challenge plumbing and should be its own proposal.
5. **Prompt UX across multiple apps.** v1 is sequential re-prompting (first-prompt-wins, re-run on
   resume); revisit if prompt fatigue proves a problem.
6. **Client-side `i18n` resolution.** The `prevent` `i18n` and the simple `prompt` `i18n` form rely
   on the client having the app's translations loaded (as it does for UIKit) and knowing the user's
   locale. Non-UI and REST consumers only get the raw `key`/`args` in `details` — there is no
   literal fallback for the `i18n` member, so apps that need one should return the `reason` member
   instead. Rich prompts inherit UIKit's existing translation path.

## Implementation record

The split follows what an app has to know. `packages/apps-engine/definition/` is what an app
imports, so it holds the union an author annotates against and the factories that stamp the marker.
The guard, the host-stamped metadata and the outcome envelopes have no app-side reader, so they live
in `packages/apps` beside the manager that produces them. The dependency runs one way — `apps` →
`apps-engine` — so the host side may name the app-facing types and never the reverse.

- `packages/apps-engine/src/definition/eventResult/EventResult.ts` — the branded per-variant types,
  the `pass | patch | prevent` union `MarkedEventResult`, and the `EventResult.*` factories.
  `prompt` is absent, as recorded in Status.
- `packages/apps-engine/src/definition/eventResult/index.ts` — exports.
- `packages/apps/src/server/eventResult/isEventResult.ts` — the `@kind` guard. Host-side: an app
  produces a marked result with the factories and never has to recognize one. It imports
  `EVENT_RESULT_KIND` from apps-engine, so the guard and the stamp share one constant.
- `packages/apps/src/server/eventResult/HostEventResult.ts` — `HostEventResult`, derived from the
  app-facing union, and `EventResultMeta`, what the engine tells the host about the app that produced
  a result. `EventResultMeta` lives beside the type that uses it, because `prevent` is the only
  variant that carries one. See [the prevented-call
  proposal](../proposals/media-call-prevented-call.md), D2.
- `packages/apps/src/server/eventResult/makeHostEventResult.ts` — the one place a marked result
  becomes a host one: it drops `@kind` and stamps `meta`, reading the app's name, its i18n namespace
  and its translations of the key the result named off the `ProxiedApp`.
- First consumer: `packages/apps-engine/src/definition/mediaCalls/MediaCallEventResult.ts`
  (`MediaCallCreateEventResult` = `MarkedEventResult<MediaCallCreatePatch>`, every variant permitted),
  dispatched by `packages/apps/src/server/managers/AppListenerManager.ts`.
- The manager's outcome envelopes — `MediaCallEvent` and `PreMediaCallCreatedOutcome` — live beside
  it in `packages/apps/src/server/mediaCalls/IMediaCallEvent.ts` and are re-exported from
  `@rocket.chat/apps`. Apps never see them; only the manager and the host read them.
- The fail-open backstop for an unknown variant lives in that manager's
  `executePreMediaCallCreated` `default` branch, covered by
  `packages/apps/tests/server/managers/AppListenerManager.mediaCalls.test.ts`. The test hand-builds
  a `@kind`-marked payload, because no factory can produce a variant the types do not declare.
- `packages/apps-engine/definition/` is build output and gitignored; only `src/definition/` is
  edited.

## Reference index

- Handler definitions: `packages/apps-engine/src/definition/{messages,rooms,uploads,email,livechat}/IPre*.ts`
- Enums: `packages/apps-engine/src/definition/metadata/AppInterface.ts`, `.../AppMethod.ts`
- Listener type map, executors and blind casts: `packages/apps/src/server/managers/AppListenerManager.ts:47` (map), `:359` (dispatch), `:493`/`:522`/`:545` (prevent/extend/modify templates), `:1191` (upload), `:1199` (email)
- Runtime / JSON-RPC boundary: `packages/apps/src/server/ProxiedApp.ts:64`
- Bridge duck-typing: `apps/meteor/app/apps/server/bridges/listeners.ts:377` (message), `:421` (room), `:198`/`:291` (upload)
- Server call sites: `apps/meteor/server/lib/messages/sendMessage.ts:241`/`:252`, `.../deleteMessage.ts:40`, `.../updateMessage.ts:32`, `apps/meteor/server/lib/rooms/createRoom.ts:265`, `apps/meteor/server/lib/media/file-upload/lib/FileUpload.ts:203`, `apps/meteor/server/lib/notifications/email/api.ts:176`
- Builder setter surface (the `patch` allow-list's source of truth): `packages/apps-engine/src/definition/accessors/IMessageBuilder.ts:23`/`:56`/`:68`
- Collision field: `packages/apps-engine/src/definition/messages/IMessage.ts:37` (`type?: MessageType`)
