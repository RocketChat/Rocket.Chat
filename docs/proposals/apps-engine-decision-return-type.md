# Proposal: A unified `Decision` return type for apps-engine pre-events

## Status

Draft — feasibility evaluation

## Context

This document is a **prerequisite feasibility study** for
[App-requested user confirmation for file uploads](./app-file-upload-confirmation.md).
That proposal needs a pre-event handler to be able to say *"prompt the user and
proceed only if they accept."* Today no pre-event can express that. Rather than
bolt a one-off "prompt" onto the upload hook, this study evaluates introducing a
single, uniform `Decision` return type for **all** apps-engine pre-events, of
which "prompt" is one variant.

The proposed shape:

```ts
type Decision<T> =
  | { type: 'pass' }                              // allow unchanged
  | { type: 'patch'; patch: Partial<T> }          // patch the subject (message/room/upload/…)
  | { type: 'prevent'; reason: string }
  | { type: 'prevent'; i18nReason: string }
  | { type: 'prompt'; message: string }
  | { type: 'prompt'; i18nMessage: string }
  | { type: 'prompt'; blocks: Block[] };          // possibly a full View/modal
```

Requirements taken as given: **must not break existing apps**, and **different
events may allow different subsets** of `Decision` (e.g. upload may allow
`prompt`, a login pre-event may not).

**Verdict up front:** feasible and worthwhile, at **moderate effort**. The
`pass` / `patch` / `prevent` variants are a clean unification of mechanisms that
already exist (and are currently inconsistent). The `prompt` variant is the only
genuinely new capability and is only realizable on events whose triggering flow
can be suspended and resumed — which is exactly the TOTP-style challenge the
companion proposal describes. The safest non-breaking path is to introduce
`Decision` on **new, additive handler interfaces** rather than overloading the
return type of existing ones.

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

There are **no** `IPre*` login/auth events at all — login/logout are Post-only
(`IPostUserLoggedIn` / `IPostUserLoggedOut`). So "pre-login may not allow
prompt" is moot until such an event is introduced; worth noting as the matrix
is designed.

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
     followed by re-validation.
   - `createRoom.ts:265` — maps `AppsEngineException` → `Meteor.Error`, then
     `if (prevent) throw`, then merges the extend/modify object.
   - `deleteMessage.ts:40` / `updateMessage.ts:32` — `if (prevent) throw`.
   - `FileUpload.ts:197` — `try { triggerEvent } catch (e) { if e is
     AppsEngineException → Meteor.Error('error-app-prevented') }`.
   - `email/api.ts:177` — `Email.sendAsync(eventResult || email)`.

**Two facts fall out of this and drive the whole design:**

- The **`patch` variant is not new machinery** — `sendMessage.ts:252` and
  `createRoom.ts` already do `Object.assign(subject, result)` with the object an
  app returns from Modify/Extend. `Decision.patch` simply formalizes and
  makes explicit what the "object-chain" pattern already does implicitly.
- **The interpretation points are few and centralized** (the manager executors,
  two bridge duck-type sites, and ~6 call sites). A `Decision` can be recognized
  and dispatched at these known choke points.

---

## Feasibility analysis

### 1. Serialization boundary — ✅ not a problem

App handlers run in a sandboxed runtime; `ProxiedApp.call`
(`packages/apps/src/server/ProxiedApp.ts:64`) dispatches over **JSON-RPC**
(`appRuntime.sendRequest({ method, params })`). Any return must be
JSON-serializable. `Decision` is a plain object, and `Block[]` already crosses
this boundary for UIKit interactions and for `IMessage.blocks` in
Modify/Extend. So `pass`/`patch`/`prevent`/`prompt` (including `blocks`)
serialize with no new work.

Corollary: today's "throw to prevent" relies on `AppsEngineException` crossing
back as a JSON-RPC error (`ProxiedApp.ts:70`). `Decision.prevent` gives a
**non-exceptional** prevention channel, which is cleaner and removes the
`error.name === AppsEngineException.name` string-matching at call sites.

### 2. The discriminator-collision problem — ⚠️ the main non-breaking hazard

The obvious design (widen an existing handler's return to `LegacyReturn |
Decision` and discriminate on `.type`) has a concrete collision: **`IMessage`
has a top-level `type?: MessageType` field** (`IMessage.ts:37`), and `IRoom`
similarly carries a `type`. So `'type' in result` cannot by itself distinguish a
`Decision` from a legitimate message/room.

In practice the *values* differ (`MessageType` enum values are things like room
system-message codes, never `'pass'|'patch'|'prevent'|'prompt'`), so a guard
like `result.type in {pass,patch,prevent,prompt}` would *mostly* work — but it
is fragile (a future `MessageType` value, or an app that legitimately sets a
custom `type`, could collide) and it is exactly the kind of ambiguity that
causes silent data corruption on a hot path (`Object.assign` merging a
`Decision`'s fields onto a real message).

**Mitigations, in order of safety:**

- **(safest) A dedicated, non-colliding discriminator** — e.g. a reserved marker
  the entities never carry, `{ __appsDecision: true, type: 'prevent', … }`, with
  a single `isDecision(x)` type guard used everywhere. Zero overlap with
  `IMessage`/`IRoom`/`IEmailDescriptor`.
- **(safest+) A brand-new handler interface** so the return type is *only*
  `Decision` and there is nothing legacy to disambiguate against (see Strategy A).

### 3. Would a `Decision` be misinterpreted if returned today? — YES

If an app returned a `Decision` object from an existing handler *without* the
consumers being updated:
- from a **Modify/Extend** handler it would be chained forward as the new
  message and pushed through `convertAppMessage` and `Object.assign` — corrupting
  the message;
- from a **Prevent** handler any non-empty object is truthy, so `{type:'pass'}`
  would wrongly **block**;
- from a **void** handler it would be silently dropped.

This is not a blocker (existing apps don't return `Decision`), but it confirms
that **consumers must be taught about `Decision` before any handler is allowed
to return one**, and that the discriminator check must run *before* the existing
`typeof === 'object'` branches.

### 4. Non-breaking guarantee

Existing apps return `boolean` / `IMessage` / `IRoom` / `IEmailDescriptor` /
`void` / throw. As long as:

1. the `isDecision()` guard is checked **before** the legacy `typeof === 'object'`
   / truthiness branches at every consumption site, and
2. legacy return shapes are left flowing down the unchanged path,

then apps that never return a `Decision` behave exactly as before. This is
achievable but requires touching **every** consumption tier (manager executors,
the two bridge duck-type sites, and each server call site). That surface area is
the bulk of the effort and the main regression risk (these are hot paths:
message send, room create).

---

## Two implementation strategies

### Strategy A — `Decision` on new, additive handler interfaces (recommended)

Introduce, per subject that needs it, a new handler interface whose `execute`
returns `Decision<T>`, with its own `AppInterface` + `AppMethod` enum entries and
its own executor in `AppListenerManager`. The legacy triad interfaces remain and
keep working unchanged.

```ts
// e.g. for uploads (what the companion proposal needs first)
export interface IPreFileUploadHandler {
    [AppMethod.EXECUTE_PRE_FILE_UPLOAD_HANDLER](
        context: IFileUploadContext, read, http, persis, modify,
    ): Promise<UploadDecision>;   // = Decision<IUploadDetails> minus disallowed variants
}
```

- **Non-breaking by construction** — new method key, new executor, return type is
  only `Decision`. Nothing to disambiguate; no hot-path `typeof` edits.
- **Incremental** — ship `Decision` for uploads first (unblocks the confirmation
  proposal), then add message/room/email variants as demand arrives. Each is a
  self-contained executor.
- **Enables per-event variant subsets naturally** — each new interface declares
  its own `Decision` union (e.g. `UploadDecision` includes `prompt`,
  a hypothetical `LoginDecision` omits it).
- **Cost / downside** — some duplication with the existing triad; two ways to do
  the same thing during the transition. Over time the triad can be deprecated in
  favor of the unified handler, but that is a separate migration.

### Strategy B — widen the return type of existing handlers to `LegacyReturn | Decision`

Keep the current interfaces; allow their `execute*` to *also* return a
`Decision`; add `isDecision()` guards ahead of every consumption branch.

- **Pro** — no new interfaces; one handler per event; naturally converges the
  contract.
- **Con** — must edit the manager's blind casts (`AppListenerManager.ts:498/547/
  621/728/771/821`), both bridge duck-type sites (`listeners.ts:369/414`), and
  the server call sites (`sendMessage.ts:252`, `createRoom.ts`, `updateMessage.ts`,
  `deleteMessage.ts`, `email/api.ts`, `FileUpload.ts`). Highest regression risk,
  on the hottest paths. Requires the dedicated non-colliding discriminator
  (§2) to be safe.
- **Con** — the Modify/Extend **chain** semantics complicate this: a `Decision`
  returned mid-chain must *break* the chain in the manager, otherwise it is fed
  as the input "message" to the next app.

**Recommendation:** Strategy A. It delivers `Decision` (including `prompt`) for
the upload use case with a guaranteed-non-breaking blast radius, and lets the
unified contract spread event-by-event instead of in one high-risk sweep. Adopt
Strategy B's "widen in place" only later, per-event, if/when we decide to retire
the triad — reusing the same `isDecision()` guard and precedence logic built for
A.

---

## Per-variant feasibility

| Variant | Feasibility | Notes |
| --- | --- | --- |
| `pass` | Trivial | Equivalent to today's "return `false`" (prevent) / "return the unchanged subject" (modify) / "return void". |
| `patch` | Easy | Already effectively implemented as `Object.assign(subject, result)` at `sendMessage.ts:252` / `createRoom.ts`. Must define **merge semantics** (shallow vs deep; array replace vs concat) and a **patchable-field allow-list per subject** — `patch` bypasses the `IMessageBuilder`/`IRoomBuilder` validation the Modify path uses, so re-validation (as `sendMessage.ts:256` already does) is mandatory. |
| `prevent` | Easy | Unifies the boolean-return and throw-exception channels. `reason` / `i18nReason` map directly onto the `Meteor.Error('error-app-prevented', reason)` already thrown at the call sites; i18n resolves server-side against the acting user's language. |
| `prompt` | **Hard / event-dependent** | Genuinely new. Requires the triggering flow to **suspend and resume** — i.e. the TOTP-style challenge in the companion proposal. Only viable where the RC-side flow can round-trip to the client and re-drive. |

### Which events can support `prompt`

`prompt` is only realizable when the operation can be aborted and safely retried
after the user answers, without losing work or double-applying side effects.

- **File upload — yes.** The two-step `rooms.media` → `rooms.mediaConfirm` flow
  already stages the bytes and defers the message; the prompt fits on the confirm
  step (this is the companion proposal). Best first target.
- **Message send / update, room create — possible but heavy.** These run inside
  a synchronous server pipeline (`sendMessage.ts`, `createRoom.ts`). Prompting
  means aborting the pipeline with a challenge error and having the client
  re-issue the send with a confirmation token — a larger change, and the client
  message-send path would need the same challenge/re-send plumbing 2FA has.
- **Delete — possible** (client can re-issue with a token).
- **Room user join/leave, livechat room create, email** — often triggered by
  non-interactive or server-side flows with no user to prompt (or no request to
  suspend). `prompt` should be **disallowed** for these.
- **Login (hypothetical future pre-event)** — `prompt` disallowed, per the
  requirement.

This is why `Decision` must be **event-parameterized**: each event's handler
return type is a *subset* union, and the manager rejects (logs + treats as
`pass`, or errors) any variant an event does not permit.

---

## Multi-app composition & precedence

Today Prevent short-circuits on the first `true`, and Modify/Extend chain. With
`Decision` and N apps on one event we need a defined resolution. Proposed:

1. **Precedence:** `prevent` > `prompt` > `patch` > `pass`. Any `prevent` wins
   immediately (short-circuit, matching today). Absent a `prevent`, a `prompt`
   suspends the operation.
2. **`patch` composition:** apply sequentially in listener order, chaining like
   Modify does today (each app sees the accumulated patch). Re-validate once at
   the end.
3. **Multiple `prompt`s:** for v1, **first prompt wins**; on resume the gate
   re-runs and the next app may prompt again — the same "one challenge resolved
   per round-trip" model TOTP uses (`checkCodeForUser` challenges one method at a
   time). Simpler than trying to merge prompts.
4. **`prevent` discovered after a `patch`:** because `prevent` has highest
   precedence and patches are only *committed* after the full listener pass, a
   later `prevent` still blocks cleanly.

---

## Per-event capability matrix (initial proposal)

| Event | pass | patch | prevent | prompt |
| --- | --- | --- | --- | --- |
| File upload | ✅ | ✅ | ✅ | ✅ |
| Message sent / updated | ✅ | ✅ | ✅ | ⚠️ later |
| Message delete | ✅ | — | ✅ | ⚠️ later |
| Room create | ✅ | ✅ | ✅ | ⚠️ later |
| Room delete | ✅ | — | ✅ | ⚠️ later |
| Room user join / leave | ✅ | — | ✅ | ❌ |
| Livechat room create | ✅ | — | ✅ | ❌ |
| Email sent | ✅ | ✅ | ✅ | ❌ |
| (future) Login | ✅ | — | ✅ | ❌ |

Enforced both **statically** (each handler's declared return type is the allowed
union) and **at runtime** (the executor ignores/logs unsupported variants).

---

## Rollout / migration

1. Land the `Decision` type + `isDecision()` guard + precedence helper in
   `@rocket.chat/apps-engine` (`definition/`) and `@rocket.chat/apps`
   (runtime) — both in-repo, so no external package release is required (the
   engine runtime now lives at `packages/apps/`, only the definitions are
   published, `files: ["definition/**"]`).
2. Implement Strategy A for **uploads** first, wiring the `prompt` round-trip per
   the companion proposal. This is the minimum that unblocks it.
3. Add the unified handler for message/room/email as additive interfaces; keep
   the triad working.
4. (Optional, later) Deprecate the triad and the throw-to-prevent exceptions in
   favor of `Decision`, migrating call sites to Strategy B's in-place widening,
   reusing the guard/precedence built in step 1.

Backward compatibility holds at every step because new handlers use new
`AppMethod` keys and existing handlers/return shapes are never reinterpreted.

---

## Risks & open questions

- **Discriminator safety** (§2): must pick a marker that cannot collide with
  `IMessage`/`IRoom`/`IEmailDescriptor`. Recommend a reserved field, not bare
  `type`.
- **`patch` validation**: bypassing the builders means we must re-run
  entity validation after applying a patch, and define a patchable-field
  allow-list so an app can't patch protected fields (e.g. `sender`, `_id`).
- **`prompt` scope creep**: keep v1 to the upload event; message/room prompting
  needs the client send-path challenge plumbing and should be its own proposal.
- **Chain-breaking in the manager** (if Strategy B is ever adopted): Modify/Extend
  currently feed the return into the next app; a `Decision` must stop that.
- **Precedence and `prompt` UX** across multiple apps: is sequential re-prompting
  acceptable, or do we need to cap it?
- **`prevent` reason surfacing**: today `error-app-prevented` messages reach the
  user inconsistently across events; unifying on `Decision.prevent` is a chance
  to standardize how the reason is shown.

---

## Reference index

- Handler definitions: `packages/apps-engine/src/definition/{messages,rooms,uploads,email,livechat}/IPre*.ts`
- Enums: `packages/apps-engine/src/definition/metadata/AppInterface.ts`, `.../AppMethod.ts`
- Listener type map + executors + blind casts: `packages/apps/src/server/managers/AppListenerManager.ts:40` (map), `:348` (dispatch), `:479`/`:508`/`:531` (prevent/extend/modify templates), `:1178` (upload), `:1186` (email)
- Runtime/JSON-RPC boundary: `packages/apps/src/server/ProxiedApp.ts:64`
- Bridge duck-typing: `apps/meteor/app/apps/server/bridges/listeners.ts:369` (message), `:414` (room), `:191`/`:252` (upload)
- Server call sites: `apps/meteor/server/lib/messages/sendMessage.ts:241`, `.../deleteMessage.ts:40`, `.../updateMessage.ts:32`, `apps/meteor/server/lib/rooms/createRoom.ts:265`, `apps/meteor/server/lib/media/file-upload/lib/FileUpload.ts:197`, `apps/meteor/server/lib/notifications/email/api.ts:177`
- Collision field: `packages/apps-engine/src/definition/messages/IMessage.ts:37` (`type?: MessageType`)
</content>
