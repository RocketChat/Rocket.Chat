# Proposal: A unified `Decision` return type for apps-engine pre-events

## Status

Draft — design decided (see [Design decisions](#design-decisions))

## TL;DR

- **What:** one uniform `Decision<T>` return type for apps-engine pre-events —
  `pass` / `patch` / `prevent` / `prompt` — replacing today's five inconsistent
  return contracts (boolean, entity-object, `IEmailDescriptor`, void+throw).
- **Why:** the [file-upload confirmation proposal](./app-file-upload-confirmation.md)
  needs a handler to say *"prompt the user and proceed only if they accept."*
  No pre-event can express that today. `prompt` is the one genuinely new
  capability; `pass`/`patch`/`prevent` just unify mechanisms that already exist.
- **Verdict:** feasible, worthwhile, **moderate effort**. `patch` is already what
  the Modify chain does; the risk is that it touches hot paths (message send,
  room create).
- **Non-breaking:** a reserved `kind: 'Decision'` marker + an `isDecision()` guard
  that runs *before* every legacy branch. Apps that never return a `Decision`
  behave exactly as before; `return true` ≡ `Decision.prevent`, `return message`
  ≡ a full `Decision.patch`.
- **How it ships:** bootstrap on a **new** upload handler (Strategy A, unblocks
  the companion proposal), then **widen existing handlers** to their restricted
  `Decision` union per event (Strategy B, the destination) — semantics unchanged.
- **Authoring:** `Decision.*` factories (`Decision.prevent({ i18n: { key } })`);
  the author-facing type is marker-free; each handler's return-type alias narrows
  which variants are legal (no new accessor, no generic `IModify`).
- **Key rules:** `patch` chains the *patched subject* (shallow-merge, builder-
  surface allow-list, validate once at end); `prevent`/`prompt` short-circuit;
  disallowed variant at runtime → log + treat as `pass`.

## Context

This document is a **prerequisite feasibility study** for
[App-requested user confirmation for file uploads](./app-file-upload-confirmation.md).
That proposal needs a pre-event handler to be able to say *"prompt the user and
proceed only if they accept."* Today no pre-event can express that. Rather than
bolt a one-off "prompt" onto the upload hook, this study evaluates introducing a
single, uniform `Decision` return type for **all** apps-engine pre-events, of
which "prompt" is one variant.

The **author-facing** shape is a marker-free discriminated union (the reserved
`kind` marker in §"Discriminator" is stamped by the factories, not written by
app authors):

```ts
type Decision<T> =
  | { type: 'pass' }                                   // allow unchanged
  | { type: 'patch'; patch: Partial<T> }               // patch the subject (message/room/upload/…)
  | { type: 'prevent'; reason: string }                // literal, pre-formatted
  | { type: 'prevent'; i18n: { key: string, args?: { [key: string]: string | number } } }
  // prompt — simple text form …
  | { type: 'prompt'; message: string }
  | { type: 'prompt'; i18n: { key: string, args?: { [key: string]: string | number } } }
  // … or rich form (superset; carries the confirmation UI payload)
  | {
      type: 'prompt';
      title?: TextObject;
      text?: TextObject;
      blocks?: Block[];
      confirmLabel?: string;          // default "Send"
      cancelLabel?: string;          // default "Cancel"
    };
```

`TextObject` here is `@rocket.chat/ui-kit`'s `TextObject`
(`packages/ui-kit/src/blocks/TextObject.ts:4` — `PlainText | Markdown`); the
apps-engine `ITextObject` is deprecated in favor of it. Because ui-kit text is
rendered through the app-translation-aware surface renderer
(`useStringFromTextObject` → `useAppTranslation`), a rich `prompt`'s `title`/`text`
can itself be an app i18n key resolved client-side at render time. The `prevent`
and simple `prompt` `i18n: { key, args? }` form is the *explicit* translation
channel for the non-UIKit paths (a thrown `Meteor.Error`, a plain modal).

Requirements taken as given: **must not break existing apps**, and **different
events may allow different subsets** of `Decision` (e.g. upload may allow
`prompt`, a login pre-event may not).

**Verdict up front:** feasible and worthwhile, at **moderate effort**. The
`pass` / `patch` / `prevent` variants are a clean unification of mechanisms that
already exist (and are currently inconsistent). The `prompt` variant is the only
genuinely new capability and is only realizable on events whose triggering flow
can be suspended and resumed — which is exactly the TOTP-style challenge the
companion proposal describes.

---

## Design decisions

These were settled during design review and drive the rest of the document.

1. **`patch` chains the patched *subject*, not the wrapper.** The manager
   unwraps a `patch` decision, applies it to the subject, and feeds the
   **patched subject** to the next app — identical to today's Modify chain
   (`msg = await app.call(…, msg)`). What must never flow to the next app is the
   raw `Decision` wrapper object. "Break the chain" only ever means "don't
   forward the wrapper."
2. **Short-circuit execution.** `prevent` stops the listener loop immediately
   (matching today's "first truthy prevents"). `prompt` suspends the operation
   immediately (first-prompt-wins); on resume the gate re-runs from the top and a
   later app may prompt again. We accept that a `prompt` can fire even though a
   later, un-consulted app would have `prevent`ed — the alternative (run every
   app before resolving) forfeits short-circuiting on hot paths. `prevent`
   still beats `prompt` *within one app's decision* and *across a resume*.
3. **Strategy B is the destination; Strategy A is the bootstrap.** Existing
   handlers are ultimately re-typed to return their restricted `Decision` union
   (semantics unchanged), with consumption sites accepting **both** legacy shapes
   *and* `Decision` behind the guard. We bootstrap with the guard + a new upload
   handler (Strategy A), then widen existing events to `Decision` per event.
4. **Reserved discriminator `kind: 'Decision'`.** A single `isDecision(x)` guard
   checks `kind` and runs **before** any legacy `typeof === 'object'` /
   truthiness branch. Authors never write `kind`; factories stamp it.
5. **`Decision.*` companion-object factories.** `Decision` is simultaneously the
   marker-free union *type* and a *value* namespace of factory functions
   (`Decision.pass()`, `Decision.prevent({ i18n: { key } })`, `Decision.patch(p)`,
   `Decision.prompt({ … })`). Factories stamp the marker and return **branded
   per-variant types**. Per-event narrowing comes from **each handler
   interface's restricted return-type alias** — not from a new accessor and not
   from a generic `IModify`.
6. **`patch` merge is shallow** (`Object.assign`); nested objects and arrays are
   replaced wholesale.
7. **Patchable fields mirror the builder surface** per subject (an explicit
   allow-list constant tracking `IMessageBuilder`/`IRoomBuilder`/…). Re-validate
   **once, at end of pass**.
8. **`prevent` carries either `reason` (literal) or `i18n: { key, args? }`** —
   two mutually exclusive union members, so an app returns one or the other.
   `i18n` translation is **client-side** via the `error-app-prevented` error
   `details`. Surfacing is standardized across **all** call sites.
9. **Upload confirmation is `Decision.prompt`** from a new upload handler
   (see the companion proposal), superseding the standalone
   `IUploadConfirmationRequest`.
10. **Disallowed variant at runtime → log + treat as `pass`** (fail-open); the
    static types make this unreachable for well-formed apps.

---

## Current state: what pre-events return today

There are **16** `IPre*` handler interfaces, and — importantly — they do **not**
share a contract. There are **five** distinct consumption patterns already in
the codebase.

| Pattern | Return | "Block" mechanism | Events |
| --- | --- | --- | --- |
| **Boolean-prevent** | `Promise<boolean>` (first truthy short-circuits) | return `true` | `IPreMessageSentPrevent`, `IPreMessageDeletePrevent`, `IPreMessageUpdatedPrevent`, `IPreRoomCreatePrevent`, `IPreRoomDeletePrevent` |
| **Object-chain Modify/Extend** | `Promise<IMessage>` / `Promise<IRoom>` (result replaces subject, fed to next app) | n/a | `IPreMessageSent{Extend,Modify}`, `IPreMessageUpdated{Extend,Modify}`, `IPreRoomCreate{Extend,Modify}` |
| **Object-replace + fallback** | `Promise<IEmailDescriptor>` | throw | `IPreEmailSent` |
| **Void + throw-to-block** | `Promise<void>` | throw a typed exception | `IPreFileUpload` (`FileUploadNotAllowedException`), `IPreLivechatRoomCreatePrevent` (`AppsEngineException`), `IPreRoomUserJoined` / `IPreRoomUserLeave` (`UserNotAllowedException`) |
| **Fire-and-forget** | `Promise<void>` | n/a | all `IPost*` |

Notable existing inconsistencies (evidence this space needs unifying, and that
the type contracts are already loosely enforced):

- `IPreLivechatRoomCreatePrevent` carries the `Prevent` suffix but is
  void/throw, not boolean — and its `AppMethod` string even drops the `Pre`
  (`executeLivechatRoomCreatePrevent`).
- In the listener type map `IListenerExecutor`
  (`packages/apps/src/server/managers/AppListenerManager.ts:40`),
  `IPreMessageUpdatedExtend` is typed `result: boolean` while its sibling
  `IPreMessageSentExtend` is `IMessage`; `IPreMessageUpdatedPrevent` is
  `result: unknown`; `IPreEmailSent` is typed `IUIKitResponse` but the
  implementation returns `IEmailDescriptor`.
- Prevention exists in **three** forms today (boolean return, thrown
  exception, and — for email — either). A `Decision.prevent` would unify them.
- `prevent` reasons are surfaced **inconsistently**: `createRoom.ts:267`,
  `FileUpload.ts:202`, `addUserToRoom.ts:75` throw the app's `error.message`,
  but `updateMessage.ts:34` and `deleteMessage.ts:42` throw a **canned generic
  string and discard the app's reason entirely**.

### Where return values are actually interpreted

This is the crux of the non-breaking analysis. Return values are consumed at
three tiers:

1. **`AppListenerManager` (`packages/apps/src/server/managers/AppListenerManager.ts`)** —
   the per-event executors. Every one consumes the app's return with a **blind
   cast, no shape inspection**: `as boolean` (e.g. `:498`, `:547` casts) or
   `as IMessage` (`:547`, `:728`, `:821`). Prevent loops short-circuit on the
   first truthy value (`:500`); Modify/Extend **chain** the returned object into
   the next app (`msg = await app.call(...)`, `:524`, `:547`).

2. **`AppListenerBridge` (`apps/meteor/app/apps/server/bridges/listeners.ts`)** —
   only **two** sites duck-type the result, and coarsely:
   - `messageEvent` (`listeners.ts:369`):
     ```ts
     // TODO: weird that boolean is not returned by executeListener
     if (typeof result === 'boolean' || result === undefined) {
         return result ?? undefined;
     }
     return this.orch.getConverters().get('messages').convertAppMessage(result as IAppsMessage);
     ```
   - `roomEvent` (`listeners.ts:414`): the same shape, converting to a room.
   Everything that is an object is *assumed to be the entity*.

3. **The Rocket.Chat server call sites** that fire the event and consume it:
   - `sendMessage.ts:241` — `if (prevent) return;`, then `sendMessage.ts:252`:
     `if (typeof result === 'object') message = Object.assign(message, result)`
     followed by re-validation (`validateMessage`, `:256`).
   - `createRoom.ts:265` — maps `AppsEngineException` → `Meteor.Error`, then
     `if (prevent) throw`, then merges the extend/modify object.
   - `deleteMessage.ts:40` / `updateMessage.ts:32` — `if (prevent) throw`.
   - `FileUpload.ts:197` — `try { triggerEvent } catch (e) { if e is
     AppsEngineException → Meteor.Error('error-app-prevented') }`.
   - `email/api.ts:177` — `Email.sendAsync(eventResult || email)`.

**Two facts fall out of this and drive the whole design:**

- The **`patch` variant is not new machinery** — `sendMessage.ts:252` and
  `createRoom.ts` already do `Object.assign(subject, result)` (shallow) with the
  object an app returns from Modify/Extend, and re-validate once afterward.
  `Decision.patch` simply formalizes and makes explicit what the "object-chain"
  pattern already does implicitly.
- **The interpretation points are few and centralized** (the manager executors,
  two bridge duck-type sites, and ~6 call sites). A `Decision` can be recognized
  and dispatched at these known choke points.

---

## Feasibility analysis

### 1. Serialization boundary — ✅ not a problem

App handlers run in a sandboxed runtime; `ProxiedApp.call`
(`packages/apps/src/server/ProxiedApp.ts:64`) dispatches over **JSON-RPC**
(`appRuntime.sendRequest({ method, params })`). Any return must be
JSON-serializable. This has a useful corollary for the DX choice: because the
return is JSON-serialized in the sandbox and deserialized on the RC side, a
class *instance* would arrive **stripped of its prototype/methods** — the
manager always sees plain data (`{ kind: 'Decision', type: 'prevent', … }`)
regardless of how the author constructed it. So the construction API is purely
an authoring-ergonomics choice. `Decision` is a plain object, and `Block[]`
already crosses this boundary for UIKit interactions and for `IMessage.blocks`
in Modify/Extend. So `pass`/`patch`/`prevent`/`prompt` (including `blocks`)
serialize with no new work.

Corollary: today's "throw to prevent" relies on `AppsEngineException` crossing
back as a JSON-RPC error (`ProxiedApp.ts:70`). `Decision.prevent` gives a
**non-exceptional** prevention channel, which is cleaner and removes the
`error.name === AppsEngineException.name` string-matching at call sites.

### 2. The discriminator — reserved `kind: 'Decision'`

The naïve design (discriminate on `.type`) has a concrete collision: **`IMessage`
has a top-level `type?: MessageType` field** (`IMessage.ts:37`), and `IRoom`
similarly carries a `type`. So `'type' in result` cannot distinguish a
`Decision` from a legitimate message/room, and a value allow-list
(`result.type in {pass,patch,prevent,prompt}`) is fragile — a future
`MessageType` value or an app that sets a custom `type` could collide and cause
`Object.assign` to merge a `Decision`'s fields onto a real message on a hot path.

**Decision:** a **reserved marker** the entities never carry — `kind: 'Decision'`
— checked by a single `isDecision(x)` type guard used everywhere, running
**before** any legacy branch. Zero overlap with
`IMessage`/`IRoom`/`IEmailDescriptor`. Authors never hand-write the marker; the
`Decision.*` factories stamp it (§"Authoring API"). Internally the manager uses a
`MarkedDecision` type carrying `kind`; the public `Decision<T>` type authors
annotate against omits it.

### 3. Would a `Decision` be misinterpreted if returned today? — YES (hence the guard-before-legacy ordering)

If an app returned a `Decision` object from an existing handler *without* the
consumers being updated:
- from a **Modify/Extend** handler it would be chained forward as the new
  message and pushed through `convertAppMessage` and `Object.assign` — corrupting
  the message;
- from a **Prevent** handler any non-empty object is truthy, so `{type:'pass'}`
  would wrongly **block**;
- from a **void** handler it would be silently dropped.

This confirms the two ordering rules of the non-breaking guarantee below: the
`isDecision()` guard must run *before* the existing `typeof === 'object'` /
truthiness branches, and consumers must be taught about `Decision` before any
handler is allowed to return one.

### 4. Non-breaking guarantee

Existing apps return `boolean` / `IMessage` / `IRoom` / `IEmailDescriptor` /
`void` / throw. As long as:

1. the `isDecision()` guard is checked **before** the legacy `typeof === 'object'`
   / truthiness branches at every consumption site, and
2. legacy return shapes are left flowing down the unchanged path,

then apps that never return a `Decision` behave exactly as before.

**Legacy ↔ `Decision` mapping (mechanical, at each guarded site):**

- Legacy `boolean true` from a Prevent handler ≡ `Decision.prevent`.
- A legacy returned entity from a Modify/Extend handler ≡ a full `patch`: both
  funnel through the same shallow `Object.assign(subject, x)` + single
  end-of-pass validate, and the **accumulated subject** is what chains forward
  (a `patch` merges its `Partial<T>` onto the subject; a legacy return replaces
  it — mechanically identical under `Object.assign`).

This mapping is what lets an app migrate `return true` → `Decision.prevent(…)`
or `return message` → `Decision.patch(…)` with **identical** runtime behavior.

---

## Rollout strategy: bootstrap with A, converge on B

**Strategy A — `Decision` on new, additive handler interfaces (the bootstrap).**
Introduce, per subject that needs it first, a new handler interface whose
`execute` returns a restricted `Decision<T>`, with its own `AppInterface` +
`AppMethod` enum entries and its own executor in `AppListenerManager`. The legacy
triad interfaces remain and keep working unchanged.

```ts
// e.g. for uploads (what the companion proposal needs first)
export interface IPreFileUploadConfirmation {
    [AppMethod.EXECUTE_PRE_FILE_UPLOAD_CONFIRMATION](
        context: IFileUploadContext, read, http, persis, modify,
    ): Promise<UploadConfirmationDecision>;   // = Decision<IUploadDetails> restricted to pass | prompt
}
```

- **Non-breaking by construction** — new method key, new executor, return type is
  only `Decision`. Nothing to disambiguate; no hot-path `typeof` edits.
- **Incremental** — ship `Decision` for uploads first (unblocks the confirmation
  proposal), then add message/room/email variants.

**Strategy B — widen the existing handlers to return `Decision` (the
destination).** Re-type each existing `execute*` to return its **restricted**
`Decision` union (`IPreMessageSentPrevent` → `pass | prevent`;
`IPreMessageSentModify`/`Extend` → `pass | patch`; …), add `isDecision()` guards
ahead of every consumption branch, and accept **both** legacy shapes and
`Decision`.

- The Prevent pass still short-circuits on the first `prevent`; the Modify/Extend
  pass still chains the patched subject. **Runtime semantics are unchanged** —
  `Decision` is only a uniform return *vocabulary* layered on the existing
  (still-separate) passes.
- **Con** — must edit the manager's blind casts (`AppListenerManager.ts:498/547/
  621/728/771/821`), both bridge duck-type sites (`listeners.ts:369/414`), and
  the server call sites (`sendMessage.ts:252`, `createRoom.ts`, `updateMessage.ts`,
  `deleteMessage.ts`, `email/api.ts`, `FileUpload.ts`). These are the hottest
  paths; the guard-before-legacy ordering (§3) is what keeps them safe.

**Why not "A forever."** Keeping existing handlers frozen on legacy types and
only ever adding parallel `Decision` interfaces leaves two ways to do the same
thing indefinitely and makes the capability matrix aspirational rather than
honest. B makes each event express its real (restricted) capability in one
vocabulary. Because the restricted unions preserve the exact short-circuit/chain
semantics and the sites accept legacy shapes, B is achievable without breaking
apps — it is simply higher-touch, so it is sequenced *after* the bootstrap.

---

## Authoring API — `Decision.*` factories

`Decision` is a **companion object**: the same name is both the marker-free union
*type* and a *value* namespace of factories. This gives one discoverable entry
point (`Decision.`), keeps the marker an implementation detail, and lets
per-event restriction come from the **handler's return type** rather than a new
accessor.

```ts
// definition — author-facing type, NO marker
type Decision<T> =
  | { type: 'pass' }
  | { type: 'patch';   patch: Partial<T> }
  | { type: 'prevent'; reason: string }
  | { type: 'prevent'; i18n: { key: string; args?: { [key: string]: string | number } } }
  | PromptDecision;   // simple + rich forms, see the Context section

// value namespace (declaration-merged) stamps kind:'Decision' and returns
// BRANDED per-variant types so disallowed variants fail to typecheck.
export const Decision = {
  pass:    (): PassDecision                    => ({ kind: 'Decision', type: 'pass' }),
  prevent: (o): PreventDecision                => ({ kind: 'Decision', type: 'prevent', ...o }),
  patch:   <T>(p: Partial<T>): PatchDecision<T>=> ({ kind: 'Decision', type: 'patch', patch: p }),
  prompt:  (o): PromptDecision                 => ({ kind: 'Decision', type: 'prompt', ...o }),
};
```

**Per-event narrowing without a new accessor.** Each handler interface declares
its allowed union as its return type; the branded factory returns then enforce
the subset at the `return` statement:

```ts
type MessageModifyDecision  = PassDecision | PatchDecision<IMessage>;
type MessagePreventDecision = PassDecision | PreventDecision;

interface IPreMessageSentModify {
  executePreMessageSentModify(msg, builder, read, http, persis): Promise<MessageModifyDecision>;
}

// app author:
async executePreMessageSentModify(msg, builder): Promise<MessageModifyDecision> {
  return Decision.prompt({ message: 'ok?' });   // ❌ PromptDecision ∉ pass | patch
  return Decision.patch({ text: 'redacted' });  // ✅  (patch checked as Partial<IMessage>)
  return Decision.pass();                        // ✅
}
```

- **No generic `IModify`, no new `IModifyDecide` accessor.** `IModify`
  (`IModify.ts:11`) is a single shared interface that cannot infer the event;
  putting `decide` there would give the same unrestricted union everywhere. The
  event identity already lives in *which interface the author implements* and
  *what that interface returns*.
- The restricted return type also gives `Decision.patch(...)` correct
  `Partial<T>` checking via contextual typing.
- **Tradeoff accepted:** typing `Decision.` lists all four variants in
  autocomplete; disallowed ones simply fail to typecheck at the `return`. A truly
  narrowed accessor (hiding invalid variants from autocomplete) would require a
  generic `IModify<Event>` or a new per-event accessor and is deliberately *not*
  adopted; it could be layered on later without changing the return types.

---

## Per-variant feasibility

| Variant | Feasibility | Notes |
| --- | --- | --- |
| `pass` | Trivial | Equivalent to today's "return `false`" (prevent) / "return the unchanged subject" (modify) / "return void". |
| `patch` | Easy | Already effectively implemented as shallow `Object.assign(subject, result)` at `sendMessage.ts:252` / `createRoom.ts`. **Merge is shallow** (nested objects/arrays replaced wholesale). **Patchable fields mirror the builder's setter surface** per subject (an explicit allow-list constant): this gives parity with what Modify can already change (so B is non-breaking — `sender`/`room` stay patchable because `IMessageBuilder.setSender`/`setRoom` already allow them, `IMessageBuilder.ts:56,68`), while identity/server fields (`_id`, `ts`, `_updatedAt`) are excluded because the builder never exposes them. Re-validate **once at end of pass** (as `sendMessage.ts:256` already does). |
| `prevent` | Easy | Unifies the boolean-return and throw-exception channels. Carries either `reason` (literal) or `i18n: { key, args? }` — mutually exclusive union members. Maps onto `Meteor.Error('error-app-prevented', …)` with the key/args in `details` for **client-side** translation against the user's actual UI locale. Surfacing is standardized across all call sites — including `updateMessage`/`deleteMessage`, which currently discard the reason. |
| `prompt` | **Hard / event-dependent** | Genuinely new. Requires the triggering flow to **suspend and resume** — the TOTP-style challenge in the companion proposal. Two shapes: simple (`{ message }` or `{ i18n: { key, args? } }`) and rich (`{ title?, text?, blocks?, confirmLabel?, cancelLabel? }` where `title`/`text` are `@rocket.chat/ui-kit` `TextObject`s — `PlainText \| Markdown`). The rich form is the confirmation-UI payload the companion proposal needs. i18n is available on both forms: the simple form via the explicit `i18n: { key, args? }` channel (for non-UIKit paths), and the rich form because ui-kit `TextObject` text is resolved through the app-translation-aware renderer at render time. |

### Which events can support `prompt`

`prompt` is only realizable when the operation can be aborted and safely retried
after the user answers, without losing work or double-applying side effects.

- **File upload — yes.** The two-step `rooms.media` → `rooms.mediaConfirm` flow
  already stages the bytes and defers the message; the prompt fits on the confirm
  step (this is the companion proposal). Best first target. Note that upload's
  `prevent` and `prompt` live on **different handlers**: hard blocks stay on the
  block-only `IPreFileUpload` at the `rooms.media` pre-stage, while `prompt`/`pass`
  are on the new confirmation handler at `rooms.mediaConfirm`.
- **Message send / update, room create — possible but heavy.** These run inside
  a synchronous server pipeline (`sendMessage.ts`, `createRoom.ts`). Prompting
  means aborting the pipeline with a challenge error and having the client
  re-issue the send with a confirmation token — a larger change, and the client
  message-send path would need the same challenge/re-send plumbing 2FA has.
- **Delete — possible** (client can re-issue with a token).
- **Room user join/leave, livechat room create, email** — often triggered by
  non-interactive or server-side flows with no user to prompt (or no request to
  suspend). `prompt` is **disallowed** for these.

This is why `Decision` is **event-parameterized**: each event's handler return
type is a *subset* union, and the manager, as a runtime backstop, **logs and
treats as `pass`** any variant an event does not permit (§"Runtime enforcement").

---

## Multi-app composition & precedence

Today Prevent short-circuits on the first `true`, and Modify/Extend chain. With
`Decision`:

1. **Precedence:** `prevent` > `prompt` > `patch` > `pass`. Any `prevent` wins
   immediately (short-circuit, matching today). Absent a `prevent`, a `prompt`
   suspends the operation.
2. **`patch` composition:** apply sequentially in listener order, chaining like
   Modify does today — each app sees the **accumulated patched subject** (the
   wrapper is never forwarded). Re-validate once at the end.
3. **Multiple `prompt`s:** **first prompt wins**; on resume the gate re-runs and
   the next app may prompt again — the same "one challenge resolved per
   round-trip" model TOTP uses (`checkCodeForUser` challenges one method at a
   time).
4. **Short-circuit consequence:** because the loop stops at the first `prompt`, a
   later app that would have `prevent`ed is not consulted in that pass; on resume
   the loop re-runs from the top and that app's `prevent` blocks then. We accept
   the rare avoidable prompt this implies (see decision 2).

## Runtime enforcement

The matrix is enforced **statically** (each handler's declared return-type union)
and, as defense-in-depth, **at runtime**. If an app returns — over JSON-RPC — a
variant the event does not permit (only reachable via a bug or a tampered
payload, since the types forbid it), the manager **logs a warning and treats the
decision as `pass`** (fail-open). Rationale: a disallowed variant is never a
legitimate block (a well-formed `prevent` is allowed on every event in the
matrix), and proceeding-as-`pass` degrades more gracefully than turning a
malformed return into a user-facing outage on a hot path.

---

## Per-event capability matrix

| Event | pass | patch | prevent | prompt |
| --- | --- | --- | --- | --- |
| File upload | ✅ | ⚠️ later | ✅¹ | ✅¹ |
| Message sent / updated | ✅ | ✅ | ✅ | ⚠️ later |
| Message delete | ✅ | — | ✅ | ⚠️ later |
| Room create | ✅ | ✅ | ✅ | ⚠️ later |
| Room delete | ✅ | — | ✅ | ⚠️ later |
| Room user join / leave | ✅ | — | ✅ | ❌ |
| Livechat room create | ✅ | — | ✅ | ❌ |
| Email sent | ✅ | ✅ | ✅ | ❌ |
| (future) Login | ✅ | — | ✅ | ❌ |

¹ Upload's `prevent` and `prompt` live on **different handlers** — hard blocks on
the block-only `IPreFileUpload` (`rooms.media` pre-stage), `prompt`/`pass` on the
new confirmation handler (`rooms.mediaConfirm`). The row is an aggregate across
both hooks, not a single four-way union. Upload `patch` is deferred: there is no
upload-modify path today, and `patch` needs its own `IUploadDetails` allow-list
that nothing yet depends on.

Enforced both **statically** (each handler's declared return type is the allowed
union) and **at runtime** (the executor logs + treats unsupported variants as
`pass`).

---

## Rollout / migration

1. Land the `Decision` type + `Decision.*` factories + `isDecision()` guard +
   precedence helper in `@rocket.chat/apps-engine` (`definition/`) and
   `@rocket.chat/apps` (runtime) — both in-repo, so no external package release is
   required (the engine runtime now lives at `packages/apps/`, only the
   definitions are published, `files: ["definition/**"]`).
2. Implement Strategy A for **uploads** first: the new confirmation handler
   returning `Decision` (`pass | prompt`), wiring the `prompt` round-trip per the
   companion proposal. This is the minimum that unblocks it.
3. Widen the existing events to `Decision` (Strategy B) per event, reusing the
   guard/precedence from step 1: re-type each `execute*` to its restricted union,
   add the guard ahead of every legacy branch, and standardize `prevent` reason
   surfacing (fixing `updateMessage`/`deleteMessage`).
4. (Optional, later) Deprecate the throw-to-prevent exceptions in favor of
   `Decision.prevent`.

Backward compatibility holds at every step because new handlers use new
`AppMethod` keys, and widened handlers accept legacy shapes behind the
guard-before-legacy ordering.

---

## Risks & open questions

- **`patch` validation & allow-list drift**: the allow-list constant must be kept
  in sync with the builder surface as subjects gain fields; re-validation at
  end-of-pass is the backstop.
- **`prompt` scope creep**: v1 is the upload event only; message/room prompting
  needs the client send-path challenge plumbing and should be its own proposal.
- **Precedence and `prompt` UX** across multiple apps: v1 is sequential
  re-prompting (first-prompt-wins, re-run on resume); revisit if prompt fatigue
  proves a problem.
- **Client-side `i18n` resolution**: the `prevent` `i18n: { key, args? }` and the
  simple `prompt` `i18n` form rely on the client having the app's translations
  loaded (as it does for UIKit) and knowing the user's locale; non-UI/REST
  consumers only get the raw `key`/`args` in `details` (no literal fallback for
  the `i18n` member — apps that need one should return the `reason` member
  instead). Rich prompts inherit UIKit's existing translation path (ui-kit
  `TextObject` text resolved via `useAppTranslation` at render time).

---

## Reference index

- Handler definitions: `packages/apps-engine/src/definition/{messages,rooms,uploads,email,livechat}/IPre*.ts`
- Enums: `packages/apps-engine/src/definition/metadata/AppInterface.ts`, `.../AppMethod.ts`
- Listener type map + executors + blind casts: `packages/apps/src/server/managers/AppListenerManager.ts:40` (map), `:348` (dispatch), `:479`/`:508`/`:531` (prevent/extend/modify templates), `:1178` (upload), `:1186` (email)
- Runtime/JSON-RPC boundary: `packages/apps/src/server/ProxiedApp.ts:64`
- Bridge duck-typing: `apps/meteor/app/apps/server/bridges/listeners.ts:369` (message), `:414` (room), `:191`/`:252` (upload)
- Server call sites: `apps/meteor/server/lib/messages/sendMessage.ts:241`/`:252`, `.../deleteMessage.ts:40`, `.../updateMessage.ts:32`, `apps/meteor/server/lib/rooms/createRoom.ts:265`, `apps/meteor/server/lib/media/file-upload/lib/FileUpload.ts:197`, `apps/meteor/server/lib/notifications/email/api.ts:177`
- Builder setter surface (patch allow-list source of truth): `packages/apps-engine/src/definition/accessors/IMessageBuilder.ts:23`/`:56`/`:68`
- Collision field: `packages/apps-engine/src/definition/messages/IMessage.ts:37` (`type?: MessageType`)
