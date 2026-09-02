# ADR 0003 — Media-call lifecycle events for apps

## TL;DR

- Apps implement one `IMediaCallHandler` with one optional method per event.
- Phase 1 exposes four events: post-started, post-participant-joined, post-ended, and preventable/patchable pre-created.
- Every event includes `origin` (`internal`, `sip-outbound`, or `sip-inbound`), derived from call contacts and not persisted.
- Internal SIP-routed calls produce two unlinked events; reliable correlation is not available.
- Prevented calls are recorded as ended `media_calls` records with `preventedBy` and surfaced through normal history/card flows.

## Status

**Accepted — Phase 1 implemented.** Phases 2–4 (act, intervene, provide) are surveyed but not decided. Linking SIP loop-back legs is rejected.

## Decision

1. **One app-facing interface.** `IMediaCallHandler` exposes one optional method per event, preserving per-event opt-out and return-type narrowing.
2. **One dispatch envelope.** All four events use `AppInterface.IMediaCallHandler` and a `MediaCallEvent` envelope routed by `method`. Pre events retain serial prevent/patch handling; post events use fan-out.
3. **Four Phase 1 events.**
   - `executePostMediaCallStarted` — `callActivated`
   - `executePostMediaCallParticipantJoined` — `callAccepted`
   - `executePostMediaCallEnded` — `callEnded`
   - `executePreMediaCallCreated` — preventable and patchable
4. **Pre-create uses a hook bus.** Vetoes are awaited inside `MediaCallDirector.createCall`. Prevention throws `CallRejectedError` with reason `prevented`. Patches are clamped to transport-supported features, including SIP restrictions.
5. **Post-event contexts carry the call snapshot.** Named timestamps are required in the relevant snapshot types; `durationMs` is the only derived context field.
6. **Transitions hand the call to the event.** State-changing database updates return the resulting call record instead of just updating (prior behavior), avoiding an extra read and preserving per-call event order within an instance.
7. **Prevention is recorded, not announced.** A prevented call inserts one already-ended/expired `media_calls` record containing the app's identity and optional text/translation metadata, emits `historyUpdate`, and then throws. Normal history produces the prevented entry/card. The caller hears the end-of-call tone.
8. **Every event includes `origin`.** It is derived at dispatch time from the two contacts and is neither persisted nor patchable.
9. **SIP loop-back legs remain unlinked.** Both legs emit independently with their own `origin`; reliable PBX correlation is unavailable.

## What an app receives

For a normal workspace-to-workspace WebRTC call:

```jsonc
{
  "caller": { "type": "user", "id": "aaa", "username": "user1" },
  "callee": { "type": "user", "id": "bbb", "username": "user2" },
  "createdBy": { "type": "user", "id": "aaa", "username": "user1" },
  "features": ["audio", "video"],
  "origin": "internal"
}
```

With SIP integration, an internal call produces two unlinked events:

- **Outbound:** user → SIP, `features: ["audio"]`, `origin: "sip-outbound"`
- **Inbound:** SIP → user, `features: ["audio"]`, `origin: "sip-inbound"`

A genuinely external inbound call can look like the inbound leg, so apps cannot distinguish those cases from the event payload alone.

## Consequences

- Apps get one cohesive interface and inherit existing prevent/patch composition.
- Apps can classify calls by origin without knowing routing rules; no migration is required.
- Internal SIP-routed conversations remain two unlinked calls. Apps cannot deduplicate them using host-provided data.
- To block an internal/SIP call cleanly, an app must prevent the **outbound** leg; preventing the inbound leg is too late.
- Only app prevention currently creates a history record; other refusal paths do not. The shared mechanism can support more recorded refusals later.
- The prevented card currently produces an in-app unread/alert; push, email, and desktop notifications remain suppressed.
- SIP outbound and inbound legs have different timestamp/user semantics: outbound tracks the PBX dialog; inbound reflects the callee's acceptance.

## Deliberate gaps in Phase 1

- **No `IMediaCallRead`:** apps cannot read calls by ID or query whether a user is currently on a call.
- **Loop-back legs remain unlinked.**
- **Pre-event timeouts fail open:** a timeout results in no prevention and no record. This matches the engine's current pre-event behavior and is deferred because fail-closed behavior could block calls when an app is slow.
- **Ordering is per instance:** events are ordered within one instance but not guaranteed across instances; introducing an `await` in the dispatch path could also change ordering.
- **Only app prevention currently sounds the end-of-call tone.** Other caller-facing refusal reasons should eventually use the same mechanism; protocol-level refusals should remain silent.

## Context

### The three layers of apps-engine in this monorepo

The historical standalone apps-engine is split across three locations. Any media-call extension
touches all three.

| Layer | Location | Contents |
|---|---|---|
| **SDK / definitions** (published `@rocket.chat/apps-engine`) | `packages/apps-engine/src/definition/` | `AppInterface`, `AppMethod`, handler interfaces, accessor interfaces, context/permission/association types. `package.json` ships only `definition/**` (`packages/apps-engine/package.json:37-39`). |
| **Engine runtime** (published `@rocket.chat/apps`) | `packages/apps/src/` + `packages/apps/base-runtime/src/` | `src/server/managers/` (`AppListenerManager`, `AppVideoConfProviderManager`), abstract `src/server/bridges/`, `src/server/{AppManager,ProxiedApp}.ts`, `src/converters/`. The **concrete accessors are not here** — they live in `base-runtime/src/lib/accessors/` (`read/`, `modify/`, builders, extenders) and are assembled in `accessors/mod.ts`; there is no `AppAccessorManager` — see [ADR 0001](./0001-app-accessor-logic-in-base-runtime.md). |
| **Host (real Rocket.Chat)** | `apps/meteor/app/apps/server/` + `apps/meteor/ee/server/apps/` | Concrete bridge subclasses, converters, orchestrator (`ee/server/apps/orchestrator.ts`). |

The host imports the engine from `@rocket.chat/apps/dist/...`, so **the `packages/apps` build must
be regenerated** for host changes to see new engine code
(`apps/meteor/app/apps/server/bridges/bridges.js:1`).

### The media call domain object

Persisted record — `IMediaCall` (`packages/core-typings/src/mediaCalls/IMediaCall.ts:35-74`):

- `service: 'webrtc'`, `kind: 'direct'` — only 1:1 direct WebRTC/SIP calls exist today (`:36-37`).
- `state: 'none' | 'ringing' | 'accepted' | 'active' | 'hangup'` (`:33,39`). The stored enum is
  deliberately smaller than the client state machine, which also has `renegotiating`.
- Actors: `caller: MediaCallSignedContact`, `callee: MediaCallContact`, `createdBy: MediaCallContact`
  (`:41,44-45`). `MediaCallActorType = 'user' | 'sip'` (`:5`); `contractId` is the per-session
  signing token (`:7-15`).
- Lifecycle timestamps `acceptedAt`, `activatedAt`, `expiresAt` (`:52-57`); end fields `ended`,
  `endedBy`, `endedAt`, `hangupReason` (`:47-50`); transfer fields `transferredBy/To/At`,
  `parentCallId` (`:60,63-65`); `divertedBy` for a call the PBX forwarded (`:68`, RFC 5806
  `Diversion`) — a diversion is not a transfer and carries no `parentCallId`.
- `uids: string[]` (`:70`), `features: string[]` (`:73`) — the negotiated capability set, finalized
  on accept.

Negotiation record — `IMediaCallNegotiation`: one document per SDP (re)negotiation round. **SDP
offer/answer payloads are persisted there.**

State transitions are enforced as **race-safe guarded updates** on the model — this is where the
persisted state machine actually lives: `startRingingById` (`MediaCalls.ts:80-88`), `acceptCallById`
(`:90-117`), `activateCallById` (`:119-134`), `hangupCallById` (`:136-155`), `transferCallById`
(`:169-188`). The three that a post event reports are `findOneAndUpdate`s and return the call they
produced; the others return an `UpdateResult`, because nothing needs the document.

### The lifecycle engine and its event emitter

`callServer = new MediaCallServer()` (`ee/packages/media-calls/src/server/configuration.ts:6`) is the
singleton gateway. `MediaCallDirector` (`ee/packages/media-calls/src/server/CallDirector.ts`) is the
**state-machine authority — every DB transition converges there**, which makes it the natural
interception choke point.

Before this work the only outward event channel was a typed `Emitter`, `MediaCallServerEvents`
(`ee/packages/media-calls/src/definition/IMediaCallServer.ts:16-24`): `callUpdated`,
`callActivated`, `callEnded`, `signalRequest`, `historyUpdate`, `pushNotificationRequest`.
`callAccepted` is the one member this work added, and every payload carries ids only — see
decision 6.

### The integration seam

`MediaCallService` (`apps/meteor/server/services/media-call/service.ts`) is the thin Meteor adapter
over the EE `callServer` engine. Its constructor (`service.ts:40-63`) wires the emitter into the rest
of Rocket.Chat — `signalRequest`, `callUpdated`, `callActivated` (sets Presence BUSY), `callEnded`
(clears Presence), `historyUpdate` (`saveCallToHistory`), `pushNotificationRequest` — and is exactly
where the apps-engine dispatch subscribes, mirroring how it already forwards these events onto the
microservice bus. The service also owns the permission and feature callbacks injected into the engine
(`getMediaServerSettings` `:430-456`, `userHasMediaCallPermission` `:470-478`,
`userHasFeaturePermission` `:458-468`) — an existing, function-shaped extension seam.

### How apps-engine extension mechanisms work

**Pattern A — events / listeners (host → app: notify, veto, enrich).** An `AppInterface` member names
a hookable event; an `AppMethod` names the method(s) the engine calls. Host code fires
`Apps.self?.triggerEvent(AppEvents.X, …)` → `AppServerOrchestrator.triggerEvent` →
`getListenerBridge().handleEvent()` → `AppListenerManager.executeListener()` →
`app.call(AppMethod.…)`. Handler kinds are distinguished by the accessors they receive: Pre-Prevent
returns `boolean` and any `true` short-circuits; Pre-Extend gets an additive extender; Pre-Modify
gets a full builder; Post gets the full accessor set, returns `void`, fire-and-forget.

**Pattern B — provider registration (an app *backs* a capability; the host calls into it on demand).**
Used by video conf: an app registers a provider during `extendConfiguration`, the engine tracks it in
`AppVideoConfProviderManager`, and the host RPCs into it when needed.

**Data accessors (app → host read/modify).** `IRead` is a facade of sub-readers; `IModify` splits into
creator/updater/extender/deleter. Each accessor is a thin per-app wrapper delegating to a `do*`
bridge method that performs the **permission check** then calls a `protected abstract` method the
host implements. The canonical minimal precedent is `IVideoConferenceRead` → `VideoConferenceRead` →
`VideoConferenceBridge` → host `AppVideoConferenceBridge` → converter → core-service.

## The prevented call — the record that replaced the toast

Decision 7 first sent the app's words to the caller as a toast: a `CallRejectionMessage` rode the
`rejected-call-request` signal, `useCallRejectionToast` rendered it, and six `Call_rejected_*` keys
carried the workspace's own wording for the refusals the server already made on its own. None of it
survived review. A toast is the wrong carrier for an app's words: it is gone in seconds, it reaches
only the caller, and it leaves a refused call with no record anyone can go back to. Nothing on
`develop` toasted a rejection either, so removing it regressed nothing a user had seen, and
`packages/media-signaling` went back to its `develop` shape apart from the one rejection reason the
tone needs.

### Why a record, and why on `media_calls`

A prevented call has no call, and everything that writes call history reads an `IMediaCall`.
`MediaCallService.saveCallToHistory` is driven by `historyUpdate`, loads the call by id, refuses
anything that has not ended, and routes on `uids.length`. A prevented call could skip all of that on
a path of its own, but the `callId` its history entry needs would then point at nothing, and
`call_history`'s unique `{ uid, callId }` index forces one to be invented anyway.
`MediaCallDirector.createCall` holds a
finished `caller`, `callee` and `createdBy` one statement before the insert it is about to skip, so
the cheaper answer is to do that insert.

`recordPreventedCall` writes the row **already ended and already expired, in one write.** That is
not tidiness. Every scan of `media_calls` filters on `ended: false` — `findAllExpiredCalls`,
`findAllNotOverByUid`, `hasUnfinishedCalls`, `hasUnfinishedCallsByUid` — so an ended row is inert: it
never expires, never reaches a client through `getUserStateSignals`, and never makes either party
look busy. A row inserted unended, or ended in a second write that fails, would leave both parties
permanently unable to place or receive a call, silently, with no expiry to rescue them. The insert is
also detached from the refusal — it runs under a `.catch` that logs — because the caller must be told
the same thing whether or not the record lands.

### The record, and the two languages it has to serve

`CallPreventionRecord` is one type with two members, told apart by `'key' in record`:

| What an app said | What is stored |
|---|---|
| `EventResult.prevent({ reason })` — the words | `text`, capped at 200 characters |
| `EventResult.prevent({ i18n })` — a key | `key`, `ns`, `args`, **and** `text`: the app's own wording for that key in the workspace's default language, snapshotted while the app was still installed |

The snapshot is what lets one stored value serve two readers. A client renders
`t(key, { ns, defaultValue: text, ...args })`: while the app is installed the key resolves in the
app's namespace and follows the *reader's* language; once the app is uninstalled its namespace is no
longer registered, i18next falls through to the snapshot, and a raw key never reaches a reader. The
engine supplies the snapshot material for free — `EventResultMeta.app.translations` is the app's own
translation of the key it named, one entry per language it ships, stamped by `makeHostEventResult`
(see [ADR 0002](./0002-unified-event-result-for-pre-events.md)). Plural suffixes are not consulted,
so an explanation whose wording changes with a number reads in the form the app shipped under the
bare key.

`ns` is always `app-<appId>` today and so derivable from the field beside it. It is stored anyway,
because the record has to still read years after the app is gone: a stored namespace survives a
change to that convention, a derived one does not. It is written from
`EventResultMeta.app.i18nNamespace`, so no host has to know the convention.

An app cannot prevent a call and say nothing: `PreventEventResult` already demands `reason` or
`i18n`, and leaving that contract alone is how the constraint is enforced. Only a malformed payload
reaches the host naming neither. It still prevents the call — an app that says *prevent* is honoured
— and the record reads *Prevented by app: {{appName}}*, as a defence against a broken app rather than
a supported way to stay silent.

### The card mixes two namespaces

The title is the workspace's sentence and the second line is the app's, in one card. The `info_card`
renderer resolves every text object against a single `appId`, so `WithTranslations` gained an
optional `ns` and both text renderers honour it, falling back to the object's own `text`. One builder
in `ui-voip` — `getHistoryMessagePayload` — produces the blocks for the message and for the details
panel, so the two surfaces cannot drift.

### What the caller hears

The tone is the caller's only immediate cue. A prevented call is refused before it is confirmed, so
it never raises `endedCall` and the tone cannot ride that event: `Call` reads the `'prevented'`
rejection reason off the signal, `Session` emits `preventedCall`, and `useCallSounds` plays the same
tone an unanswered call plays. For a prevented call the card and the history entry say more; for the
refusals that still leave no record, there is nothing yet to look at afterwards.

## `origin` — where a call comes from

Nothing in `IPreMediaCallCreatedContext` or the app-facing `IMediaCall` used to say whether a call is
a pure WebRTC call between two workspace users, a call going out through the PBX, or a call arriving
from it. `service` is always `'webrtc'` (`CallDirector.ts:197-202`), so it does not answer the
question.

### The information already exists at dispatch time

Both contacts are final before either event is built, and their types *are* the origin:

| `caller.type` | `callee.type` | origin |
| --- | --- | --- |
| `user` | `user` | never leaves the workspace |
| `user` | `sip` | placed out through the PBX |
| `sip` | `user` | arrived from the PBX |

`sip`/`sip` cannot occur: `parseCallContacts` rejects a non-user caller for an external callee
(`MediaCallServer.ts:238-241`), and `getCalleeFromInvite` requires a user callee
(`IncomingSipCall.ts:435`).

### Shape

```ts
/** How this call reaches the outside world, and which side opened it. */
export type MediaCallOrigin = 'internal' | 'sip-outbound' | 'sip-inbound';
```

`'internal'`, not `'webrtc'`: WebRTC carries the media of a SIP leg as well, so the transport does
not tell an app where a call came from — which is the whole point of the field. `service` keeps
reporting `'webrtc'`, and it keeps meaning the transport.

`origin` is added to `IPreMediaCallCreatedContext` and to the app-facing `IMediaCall`, so pre and
post events agree. It is **not patchable**: `MediaCallCreatePatch` stays `Pick<..., 'features'>`, and
`getMediaCallCreatePatch` (`packages/apps/src/server/mediaCalls/`) drops anything that is not
`features` — along with a patch that is not an object at all, since `isEventResult` checks the marker
and not the payload under it.

### Where it is computed

One helper in `apps/meteor/server/services/media-call/appEvents.ts`, used by both sides — pre, where
`runPreMediaCallCreatedAppHook` already receives both contacts in `PreCallCreatedHookParams`, and
post, where `toAppMediaCall` already has `call.caller` / `call.callee`:

```ts
function getCallOrigin(caller: MediaCallContact, callee: MediaCallContact): MediaCallOrigin {
	if (caller.type === 'sip') return 'sip-inbound';
	if (callee.type === 'sip') return 'sip-outbound';
	return 'internal';
}
```

Two consequences worth stating: **nothing changes in `ee/packages/media-calls`** for `origin` — no
new hook param, no new persisted field — and calls already in the database report the correct origin,
because it is derived from data they already carry.

### `divertedBy` is a neighbouring signal, not a substitute

`divertedBy` landed with #40560 (the RFC 5806 `Diversion` header) and reaches apps on both shapes:
`IncomingSipCall.getDiversionContactFromInvite` parses the header and resolves the extension to a
contact (`IncomingSipCall.ts:469-497`); `CallDirector.createCall` hands it to the pre-create hook and
persists it (`:218,254`); `toAppMediaCall` maps it into `context.call` (`appEvents.ts:90`).

It answers a different question. `origin` says how a call reaches the outside world; `divertedBy`
says why it arrived at *this* callee instead of the one that was dialled. The two compose: a diverted
call is always `sip-inbound`, and `divertedBy` cannot appear on an `internal` or `sip-outbound` call,
because only an inbound INVITE carries the header. So `origin` needs no diverted variant.

One asymmetry: `getNewCallTransferredBy` returns `divertedBy` ahead of the transfer check
(`server/signals/getNewCallTransferredBy.ts:5-9`), so clients label a diverted call as *transferred
by* the diverting party. Apps get the same fact under its own name and with no `parentCallId`,
because no earlier call was replaced. An app reconciling its own view with what the user sees must
read `divertedBy` as the client's `transferredBy`.

### The gap `origin` leaves

An internal call routed over SIP reports `sip-outbound` — true about the transport, silent about the
call being between two workspace users. The outbound leg cannot answer this at pre time: whether the
PBX routes the INVITE back into this workspace is known only once it does. An `internal: boolean` on
the pre-create context would therefore have to lie on exactly the case that motivates it. That is the
open problem below.

## The open problem — one call, two events

With SIP integration enabled *for internal calls*, a single user-to-user call is created twice: once
for the leg Rocket.Chat sends to the PBX, and once for the INVITE the PBX routes straight back in.
An app can tell that *a* SIP leg is involved; it cannot tell that the two legs are one conversation,
and has no reason to expect two. The two payloads are side by side under
[What an app receives today](#what-an-app-receives-today).

### How one call becomes two

`executePreMediaCallCreated` has exactly one trigger point — `MediaCallDirector.createCall`
(`CallDirector.ts:218`, via `runPreCallCreatedHook` → `runPreMediaCallCreatedAppHook`). So a double
execution means `createCall` ran twice. With `VoIP_TeamCollab_SIP_Integration_Enabled` **and**
`VoIP_TeamCollab_SIP_Integration_For_Internal_Calls` on (`service.ts:431-439` →
`routeExternally: 'always'`), it does:

1. `user1` presses call → `request-call` → `notifications.module.ts:299` →
   `GlobalSignalProcessor.processRequestCallSignal` (`internal/SignalProcessor.ts:194`) →
   `MediaCallServer.requestCall` (`server/MediaCallServer.ts:92`).
2. `parseCallContacts` routes the callee through `getCalleeContactOptions`
   (`MediaCallServer.ts:287-314`). With internal calls routed externally the option is
   `{ requiredType: 'sip' }`, so `user2` resolves to the **sip contact for their extension**
   (`server/CastDirector.ts:160-167`).
3. `MediaCallServer.createCall:128` sees `callee.type === 'sip'` → `OutgoingSipCall.createCall`
   (`sip/providers/OutgoingSipCall.ts:46-77`) → `mediaCallDirector.createCall` → **event run #1**.
4. `OutgoingSipCall.createDialog:136` INVITEs `sip:<user2 ext>@<SIP_Server_Host>`
   (`sip/Session.ts:102`).
5. The PBX dialplan resolves that extension back to Rocket.Chat, so drachtio hands the same
   workspace an inbound INVITE: `srf.invite` (`sip/Session.ts:140`) → `processInvite:166` →
   `IncomingSipCall.processInvite` (`sip/providers/IncomingSipCall.ts:48`), where
   `getCalleeFromInvite:435` maps the called number to `user2` and `getCallerContactFromInvite:499`
   rebuilds `user1`'s identity → `mediaCallDirector.createCall:103` → **event run #2**.

Two `IMediaCall` documents result, each holding one real participant: the outbound leg has
`uids: [user1]` (a sip callee contributes no uid, `CallDirector.ts:245-249`), the inbound leg
`uids: [user2]`.

The same doubling occurs with only `..._SIP_Integration_Enabled` on, whenever the PBX happens to
route an outbound leg back into the workspace (for example a DID mapped to a workspace extension);
user-to-user calls then stay internal (`routeExternally: 'never'`) and fire once.

### Why the duplicate is unrecognisable to apps

`IPreMediaCallCreatedContext` deliberately carries no call id (nothing is persisted yet), so the
only material an app has is the contacts and the features:

| context field | outbound leg | inbound leg | same? |
| --- | --- | --- | --- |
| `caller.username` | `user1` | `user1` (from `X-RocketChat-Caller-Username`, or resolved from the extension) | yes |
| `callee.username` | `user2` (sip contact built from the user record) | `user2` | yes |
| `createdBy.username` | `user1` (the requester) | `user1` (`createdBy = requestedBy \|\| caller`, `CallDirector.ts:215`) | yes |
| `features` | client list filtered to `SIP_CALL_FEATURES` (`OutgoingSipCall.ts:70`) | `SIP_CALL_FEATURES` verbatim (`IncomingSipCall.ts:109`) | yes, unless the client asked for fewer |
| contact key set | `type,id,username,displayName,sipExtension` | same | yes |
| `caller.type` / `callee.type` | `user` / `sip` | `sip` / `user` | **no** — mirrored |
| `createdBy.type` / `.id` | `user` / uid of `user1` | `sip` / `user1`'s extension | **no** — `createdBy` *is* the caller contact on the inbound leg, since `IncomingSipCall` passes no `requestedBy` (`IncomingSipCall.ts:104-111`) |
| `caller.id` / `callee.id` | uid / extension | extension / uid | **no** — mirrored |

The two contexts are distinguishable, just not *linkable*: every difference is the `user`/`sip`
mirroring, which an unrelated pair of real calls between the same two people would also show. An app
logging usernames and features — including the e2e fixture app `media-call-events-test` — sees two
entries that differ only by log timestamp.

`divertedBy` does not narrow this. A loop-back leg carries no `Diversion` header — the PBX routes our
own leg back, it does not forward a line — so `divertedBy` is absent on exactly the calls a
correlation would have to recognise.

## Alternatives considered

### The app-facing shape — four prototypes

Four prototypes were built end-to-end. All four emit the same typed events and all four return
`EventResult` from pre-events; they differ **only in how an app subscribes** and **how the engine
dispatches**.

| Dimension | P1 — per-event interfaces (Pattern A) | P2 — `registerMediaCallManager` | P3 — one interface, two methods | **P4 — one interface, one method per event (chosen)** |
|---|---|---|---|---|
| **Author mental model** | "Implement the handler interface for each event." Same as every other RC app event. | "Fill in the hooks I want on one object and register it." Same as `provideVideoConfProvider`. | "Implement one interface, two methods; `switch` on `context.eventType`." | "Implement one interface; fill in the per-event methods I want." The `IUIKitActionHandler` model. |
| **Subscription** | Implicit, per event. | Explicit, one registration call. | Implicit, but per *group* — one method subscribes all pre or all post events. | Implicit, per event — every member is its own optional method. |
| **Discoverability** | Interface list is the menu. | Best single "here is everything you can hook" surface. | Weakest — the event menu hides one level down in the `eventType` union. | Strong — autocomplete lists every optional method on one interface. |
| **Return-type narrowing** | Per-interface restricted union. | Same, on the object method. | **Lost** — enforced against the whole pre-event union, not per `eventType`. | Per-method restricted union, like P1. |
| **Per-event opt-out** | Don't implement the interface. | Omit the method. | Coarse — a `switch` `default` or a missing case. | Cleanest — omit the method. |
| **Composition across apps** | Inherited from the listener loop. | **Reimplemented** in a manager-manager fan-out. | Inherited. | Inherited. |
| **Engine wiring cost** | Full recipe per event. | One-time scaffold, then just add methods. | One-time, per method group. | One-time scaffold (member, bridge case, envelope, router), then a method plus an envelope union member; a post event needs no manager change. |
| **Fit with existing architecture** | High — it *is* the events architecture. | Medium — provider registration repurposed for events. | Medium-high — a shape no other RC event surface uses. | High — the listener engine plus a shape RC already has. |

**Why P4.** Media-call events are **broadcast**: every interested app should observe, and several
may veto. VideoConfProvider selects *one* provider by name and RPCs into it, so P2 had to
re-implement the prevent-wins and patch-chaining Pattern A gives for free — the core objection to it.
P3 keeps the listener engine but trades away per-event return-type narrowing, which `EventResult`'s
restricted unions depend on ([ADR 0002](./0002-unified-event-result-for-pre-events.md), decision 5);
if two media-call pre-events ever permit different variants, P3 cannot express it. P4 keeps every
type-level guarantee P1 has, collapses N interfaces into one app-facing surface, and adds no
conceptual novelty because `IUIKitActionHandler` already has that shape. As built it also grows more
cheaply than P1, because the envelope dispatch is scaffolded once for the family (decision 2); what it
gives up in exchange is a per-event `IListenerExecutor` `result` type, since the family shares one
entry.

A hybrid remains available if both surfaces ever test well: keep P2's author-facing object but have
its registration fan into the listener manager internally, so composition is not duplicated.

### Rejected — link the loop-back leg to the call it duplicates

Recorded so the next person does not re-derive it. The proposal was: on the inbound INVITE, correlate
against the still-live outbound leg, persist the verdict on the inbound call as `loopbackOf`, and
surface it on that leg's events. Both legs keep firing; an app that wants one conversation drops the
leg with `loopbackOf` set, and one that wants both joins them on it.

**The rule.** *This INVITE is a loop-back if `req.callingNumber` belongs to workspace user A and a
not-ended call exists whose caller is `{type: 'user', id: A}` and whose callee is the sip contact for
`req.calledNumber`.* It would need one finder,
`findOneNotEndedByCallerAndSipCallee(callerUid, sipExtension, options?)`, on `IMediaCallsModel`.
Leading the query with `{ ended: false, uids: callerUid, expiresAt: { $gt: now } }` reuses the
existing `{ ended: 1, uids: 1, expiresAt: 1 }` index (`MediaCalls.ts:33`), with the caller/callee
fields as the residual filter — no new index.

**The ordering is safe.** The outbound document is inserted (`CallDirector.ts:261`) and flipped to
`ringing` (`OutgoingSipCall.ts:125`) *before* `createSipDialog` emits the INVITE (`:136`), so the
record is always present and not-ended when the loop-back arrives. Transfers routed externally
produce the same outbound-then-loop-back pair (`UserActorAgent.onCallTransferred:134` →
`requestCall`), so the match must **not** be conditioned on `parentCallId` being absent.

**Why it is rejected.** The rule's only reliable half is the caller/extension match, and it has a
false-positive window: an external caller who presents a workspace extension as caller-ID during the
dial window gets their genuinely external call reported as a loop-back of an unrelated outbound one.
Adding `X-RocketChat-Origin-Call-Id` to the outbound INVITE (`OutgoingSipCall.createDialog` already
sets `Referred-By` for transfers, `:142-146`) does not fix this. The header survives only if the
dialplan copies custom headers across the bridge (FreeSWITCH needs `sip_copy_custom_headers`), and it
is spoofable, so it may only *select* among already correlated candidates — otherwise an external
caller presents an arbitrary call id and turns a spoofable header into a claim about who is calling.
Used correctly it reduces to the caller/extension rule plus a tie-break, so it cannot rescue it.
Reporting the wrong pair of calls as one conversation is worse than reporting neither.

**What was also considered and is moot now.** Whether `loopbackOf` should also be written on the
outbound leg so the pair is navigable from either end (a second write to an already-ringing call,
arriving after that leg's pre event), and whether `duplicateOf` or `sameConversationAs` would be a
better app-facing name than a term describing a PBX routing artefact.

## Adding an event — the wiring recipe

Because of decision 2, a **fifth media-call event** is cheaper than a new event elsewhere in the
engine: `AppInterface`, the bridge and the `IListenerExecutor` map are already wired for the whole
family and are not touched again.

1. `packages/apps-engine/src/definition/metadata/AppMethod.ts` — add the `EXECUTE…` method name.
   Media-call events have **no `CHECK…` companion**: the executors call the `EXECUTE…` method
   directly and read a `JSONRPC_METHOD_NOT_FOUND` rejection as "this app did not implement it",
   which is what makes every member of `IMediaCallHandler` optional.
2. `packages/apps-engine/src/definition/mediaCalls/` — add the context type and the method on
   `IMediaCallHandler`; export them from that folder's `index.ts`.
3. `packages/apps/src/server/mediaCalls/IMediaCallEvent.ts` — add the member to the `MediaCallEvent`
   envelope union. The envelope is host-side, not app-facing: an app is handed its `context` alone.
4. `packages/apps/src/server/managers/AppListenerManager.ts` — **for a post event, nothing**:
   `executePostMediaCallEvent` dispatches any envelope member it is handed. For a pre event, add a
   branch to `executeMediaCallEvent` and its own serial executor loop, and widen the
   `IListenerExecutor` entry's `result` union.
5. Host trigger site — `apps/meteor/server/services/media-call/appEvents.ts`, plus the emitter or
   hook subscription in `service.ts`.
6. Rebuild `@rocket.chat/apps`.

`apps/meteor/app/apps/server/bridges/listeners.ts` needs no edit — its single
`AppInterface.IMediaCallHandler` case already carries the envelope, and payloads arrive app-shaped
from `appEvents.ts` rather than through a converter. `AppImplements` detection is automatic via
`Object.keys(AppInterface)`.

Adding an event under a **new** `AppInterface` member — the recipe every other event family uses —
additionally costs the enum member, an `IListenerExecutor` entry, a `case` in `executeListener`, the
`HandleEvent` union and `case` in `listeners.ts`, and a `packages/apps/src/converters/` entry plus
its host converter if the payload needs shape mapping.

Nothing in the recipe hands the handler an accessor. `app.call(method, context)` passes the context
alone; the `IRead` / `IHttp` / `IPersistence` / `IModify` parameters on `IMediaCallHandler`'s methods
are supplied by the app runtime. A media-call event that needed a builder or an extender — as the
message Modify and Extend events get one — would be new work, not a step here.

## Follow-ups — the remaining phases

> **Nothing below this heading is decided.** This section is a survey, not a plan: the phases, the
> interface names, the proposed accessor surfaces and the "worked recipes" are sketches recorded so
> the next person starts from the reconnaissance rather than repeating it. Treat every shape here as
> a suggestion open to redesign, and every insertion point as a *candidate* that still has to be
> re-checked against the code when the work is actually picked up. No phase is scheduled and none is
> a commitment of this ADR.
>
> Two things here are firmer than the rest, and are flagged where they appear: the constraint that
> nothing may write `IMediaCall` fields around the guarded model layer, and
> [Adjacent surfaces](#adjacent-surfaces--already-generic-usable-today), which documents capabilities
> that already exist today rather than proposing new ones.

### Phase 2 — Act

`IMediaCallModify` action methods plus the remaining post events (created, ringing, accepted,
transferred, DTMF). This needs the EE hook bus scaffolding generalized beyond the single pre-create
hook.

Remaining post-event insertion points:

| Event | Insertion point | Payload available |
|---|---|---|
| `IPostMediaCallCreated` | `runOnCallCreatedForAgent` / `agent.onCallCreated` (`CallDirector.ts:376-395`); SIP `IncomingSipCall.ts:138`, `OutgoingSipCall.ts:84` | Full `IMediaCall`, role, contacts |
| `IPostMediaCallRinging` | after `MediaCalls.startRingingById` (`CallSignalProcessor.ts:283-286`) | callId, callee reachability |
| `IPostMediaCallTransferred` | `CallDirector.transferCall` success (`:288-295`) | transferredBy/To, parentCallId |
| `IPostMediaCallNegotiated` | `saveWebrtcSession` success (`CallDirector.ts:179-185`) | SDP state, media state, hold — **exposes SDP, see the SDP note below** |
| `IPostMediaCallDTMF` | `BroadcastAgent.onDTMF` (`ee/packages/media-calls/src/server/BroadcastAgent.ts:42-44`) | tone, duration |

**`IMediaCallModify`, in rough order of safety:**

- **Action methods (recommended):** `hangup(callId, reason)`, `transfer(callId, to)`,
  `sendDTMF(callId, tone)` — wrappers over `MediaCallDirector.hangup` / `transferCall`. They mirror
  real user actions and reuse every existing guard instead of mutating the record. Expose via bridge
  `doHangup` / `doTransfer`, gated by `mediaCall.write`.
- **`IModifyCreator.startMediaCall()`:** let an app *place* a call, committing via the existing
  `ModifyCreator.finish()` switch on `RocketChatAssociationModel` (`ModifyCreator.ts:122`). Requires
  a `MEDIA_CALL` association member and routes to `callServer.requestCall`.
- **`IModifyExtender.extendMediaCall(id)`:** additive metadata only, analogous to
  `extendVideoConference`.

**Never expose raw `IMediaCall` field writes** — the persisted state machine is guarded at the model
layer for race safety (`MediaCalls.ts:80-185`), and bypassing it would corrupt live calls.

### Phase 2b — `IMediaCallRead`

Precedent is `IVideoConferenceRead` (a single `getById`); a richer surface is warranted given the
query helpers already on the model (`MediaCalls.ts:41-70,187-227`). Proposed surface:
`getById(callId)`, `getActiveCallsByUser(uid)` (backing `MediaCalls.findAllNotOverByUid`
`:199-210`), `getCallHistory(uid, opts)`, `getNegotiations(callId)`.

The worked recipe, from the VideoConference precedent:

- **Definitions:** create `packages/apps-engine/src/definition/accessors/IMediaCallRead.ts` (mirror
  `IVideoConferenceRead.ts:7-15`); export it from `accessors/index.ts`; add
  `getMediaCallReader(): IMediaCallRead` to `IRead.ts` (mirror `:49`).
- **Engine:** create `packages/apps/base-runtime/src/lib/accessors/read/MediaCallRead.ts` (mirror
  `read/VideoConferenceRead.ts:7-13`); create abstract
  `packages/apps/src/server/bridges/MediaCallBridge.ts` with a permission-gated `doGetById` (mirror
  `VideoConferenceBridge.ts:10-95`); export from `bridges/index.ts`; add
  `abstract getMediaCallBridge()` to `AppBridges.ts:100` and to the `Bridge` union (`:30-55`); pass a
  `MediaCallRead` into the `Reader` constructed in `accessors/mod.ts:289-305`; add the getter to
  `read/Reader.ts` (`:79-81`).
- **Host:** create `apps/meteor/app/apps/server/bridges/mediaCalls.ts` (mirror
  `videoConferences.ts:10-76`) and `apps/meteor/app/apps/server/converters/mediaCalls.ts` (mirror
  `converters/videoConferences.ts:8-32`); register the bridge in `bridges/bridges.js` and the
  converter in `orchestrator.ts:106`.
- **Cross-cutting:** add `mediaCall: { read, write }` to `AppPermissions.ts:106-110`, plus
  `defaultPermissions` (`:162-164`) if legacy apps should inherit it.

Call chain: `IRead.getMediaCallReader()` → `MediaCallRead.getById` → `MediaCallBridge.doGetById`
(permission check) → `AppMediaCallBridge.getById` → converter → `MediaCalls` model.

### Phase 3 — Intervene

The remaining pre-hooks, wired into `MediaCallDirector` / `MediaCallServer` and reusing the
`CallRejectedError` rejection contract.

| Event | Insertion point | What an app could do | Notes |
|---|---|---|---|
| `IPreMediaCallRequested` | `MediaCallServer.requestCall` / `parseCallContacts` (`MediaCallServer.ts:92-123`, impl `:186-262`) | Block a call, reroute (change callee), annotate before the call exists | Permission checks already run here (`:201,225,229,233,243`). This is also the high-leverage place to let apps participate in the injected `permissionCheck` / `isFeatureAvailableForUser` policy callbacks (`IMediaCallServer.ts:79-80`), rather than adding a full accessor. |
| `IPreMediaCallAccepted` | `MediaCallDirector.acceptCall` before `MediaCalls.acceptCallById` (`CallDirector.ts:76`), or `clientHasAccepted` (`CallSignalProcessor.ts:316-322`) | Enforce policy on who may accept | |
| `IPreMediaCallTransferred` | `MediaCallDirector.transferCall` before `MediaCalls.transferCallById` (`CallDirector.ts:288`) | Veto or redirect the transfer target | |
| `IPreMediaCallHangup` | `MediaCallDirector.hangup` before `MediaCalls.hangupCallById` (`CallDirector.ts:409`) | Rare | A veto must tolerate server, error and expiry-driven reasons (`:308-332`, `hangupByServer` `:45-47`). |
| `IPreMediaCallDTMF` | `processDTMF` (`CallSignalProcessor.ts:274-278`) | Intercept DTMF for IVR-style apps | |

### Phase 4 — Provide (optional, large)

Pattern B: let an app *back* media calls — an alternate SIP/telephony provider, or supplied
routing/URLs. Today the SIP-vs-internal fork is hard-coded in `MediaCallServer.createCall`
(`:125-134`) on `callee.type`. An `IMediaCallProvider` (mirroring `IVideoConfProvider.ts:11-70`)
with `onCallRequested` / `onCallEnded` / `generateRoute` would require a provider definition, an
`IMediaCallProvidersExtend` accessor, an `AppMediaCallProviderManager`, a bridge, a host registry,
and host call sites in `parseCallContacts` (`:186-262`). This is a significant refactor of the
routing layer and should be a separate initiative.

### Persistence and associations

Apps already get private storage via `IPersistence` / `IPersistenceRead`. To let them key records to
a call, add `MEDIA_CALL` to `RocketChatAssociationModel`
(`packages/apps-engine/src/definition/metadata/RocketChatAssociations.ts:1-10`). An app handling the
ended event could then persist per-call analytics with
`createWithAssociation(data, new RocketChatAssociationRecord(RocketChatAssociationModel.MEDIA_CALL, callId))`.
Low cost, high value for CDR, analytics and compliance apps; no engine routing changes.

### Adjacent surfaces — already generic, usable today

These need **no** media-call-specific work, and are listed so extension design does not duplicate
them: `INotifier` for ephemeral UI, `ISlashCommandsExtend` (a `/call <user>` command),
UIKit/contextual bar/action buttons (a call-ended handler could open a survey),
`ISchedulerExtend`/`ISchedulerModify` for reminders and callbacks, and the message hooks — call
outcomes are written as system messages via `saveCallToHistory` / `sendHistoryMessage`
(`service.ts:167-315`), which flow through `sendMessage` and therefore through the existing
`IPreMessageSent*` / `IPostMessageSent` hooks **today**.

## Cross-cutting concerns for implementers

- **SDP and sensitive data.** Signal payloads and negotiations carry SDP; the engine already strips
  it for logs (`ee/packages/media-calls/src/server/stripSensitiveData.ts:3-24`, applied
  `MediaCallServer.ts:66`). Any hook or accessor exposing signals or negotiations to apps must apply
  the same stripping and sit behind a distinct permission.
- **SIP and internal calls are uniform at the director.** Both providers funnel every state change
  through the *same* `MediaCallDirector` methods, so hooks placed there fire uniformly regardless of
  provider (the fork is only at `MediaCallServer.createCall:125-134`). Place post-hooks in the
  director, not in the agents, to avoid provider-specific gaps.
- **Non-user-driven transitions.** Expiry (`CallDirector.ts:308-332`), errors and `hangupByServer`
  (`:45-47`) end calls with no user actor. Hook payloads must tolerate `ServerActor`
  (`IMediaCall.ts:17-20`) and a non-user `endedBy`.
- **No multi-party participant model.** Calls are strictly `kind:'direct'` two-actor
  (`IMediaCall.ts:37,44-45`). "Join/leave" maps to reachable/ringing → accept → active → hangup;
  the client-side participant abstractions in `media-signaling` are not persisted. Multi-party would
  be a much larger schema change.
- **Multi-instance and performance.** Events fan out across instances via the microservice bus and
  the `BroadcastActorAgent` mechanism. Post-hooks stay fire-and-forget, as the existing listener
  contract is, to avoid adding latency to real-time call signaling.
- **EE gating.** Media calls are enterprise plus module `teams-voip`
  (`apps/meteor/ee/server/settings/voip.ts:7-8`). Host trigger sites must be safe when the feature
  or module is disabled.
- **Build coupling.** The host imports the engine from `@rocket.chat/apps/dist` — rebuild
  `packages/apps` after engine edits.

## Implementation record

- App-facing definitions: `packages/apps-engine/src/definition/mediaCalls/` — `IMediaCall`
  (including `MediaCallOrigin`), `IMediaCallHandler`, the four context types,
  `MediaCallCreateEventResult`, `MediaCallHangupReason` and the `isMissedCall` / `isRejectedCall` /
  `isAnsweredCall` helpers.
- Host-side envelopes: `packages/apps/src/server/mediaCalls/IMediaCallEvent.ts` — `MediaCallEvent`
  and `PreMediaCallCreatedOutcome`, re-exported from `@rocket.chat/apps`. Apps never see either, so
  neither belongs in the package an app imports. See ADR 0002's implementation record.
  `PreMediaCallCreatedOutcome` is `HostEventResult<MediaCallCreateEventResult>`, so the host reads
  back the same `pass` / `patch` / `prevent` vocabulary the app spoke, with `meta` naming the app on
  a `prevent`. A `patch` outcome carries the **accumulated** context, not the last app's fragment;
  `pass` carries nothing, because the host still holds the context it dispatched. The one union is
  what stops the host and the engine from drifting apart when a variant is added.
- Enums: `packages/apps-engine/src/definition/metadata/{AppInterface,AppMethod}.ts`.
- Dispatch: `packages/apps/src/server/managers/AppListenerManager.ts`, covered by
  `packages/apps/tests/server/managers/AppListenerManager.mediaCalls.test.ts`. The post events are
  the one executor in that manager that does *not* await each app in turn: nothing reads their
  result, so `executePostMediaCallEvent` starts every handler and then awaits the set. Awaiting
  inside the loop would let one app that stalls until its runtime timeout delay the notification of
  every app behind it. The pre event stays serial, because `prevent` has to short-circuit and
  `patch` has to chain.
- Host bridge: `apps/meteor/app/apps/server/bridges/listeners.ts`.
- Host trigger, mappers and `getCallOrigin`: `apps/meteor/server/services/media-call/appEvents.ts`,
  wired in `service.ts`; covered by
  `apps/meteor/tests/unit/server/services/media-call/appEvents.spec.ts` — `origin` for each of the
  three contact-type combinations, on the pre context and on `toAppMediaCall`.
- EE hook bus: `IMediaCallServer.setHooks` / `runPreCallCreatedHook`, consulted in
  `MediaCallDirector.createCall` (`ee/packages/media-calls/src/`).
- The prevention record: `CallPreventionRecord` and `IMediaCall.preventedBy`
  (`packages/core-typings/src/mediaCalls/IMediaCall.ts`); `toPreventionRecord` and
  `resolveFallbackText` (`apps/meteor/server/services/media-call/appEvents.ts`);
  `PreCallCreatedHookResult` (`ee/packages/media-calls/src/definition/IMediaCallServer.ts`) and
  `MediaCallDirector.recordPreventedCall` (`.../server/CallDirector.ts`).
- What reads it: `getCallHistoryItemState`, `saveInternalCallToHistory` and `sendHistoryMessage`
  (`apps/meteor/server/services/media-call/service.ts`); the card builder
  `getHistoryMessagePayload`, `CallHistoryTableStatus` and `CallHistoryContextualbar`
  (`packages/ui-voip/src/`); `CallHistoryPageFilters` (`apps/meteor/client/views/mediaCallHistory/`),
  where *Prevented* is a filter of its own; the optional `ns` on `WithTranslations`
  (`packages/ui-kit`) and the two renderers in `packages/fuselage-ui-kit` that honour it. Keys:
  `Voice_call_not_placed`, `Prevented`, `Prevented_by_app` in `packages/i18n`.
- The tone: the `'prevented'` member of `callRejectedReasonList`
  (`packages/media-signaling/src/definition/call/IClientMediaCall.ts`), `Call.prevented`, the
  `preventedCall` session event, and `useCallSounds` via `MediaCallViewProvider`.
- E2E: `apps/meteor/tests/e2e/apps/media-call-events.spec.ts`, against the `media-call-events-test`
  fixture app (`apps/meteor/tests/data/apps/app-packages/`). It covers WebRTC calls reaching the app
  with `origin === 'internal'`, and the prevention end to end — the fixture's `prevent` and
  `prevent-i18n` modes, the stored record, the tone, the caller-only history entry and the card in
  the direct message. The SIP paths need a PBX in CI, which the suite does not have — a
  deliberate gap, recorded rather than hidden.
- `packages/apps-engine/definition/` is build output and gitignored; only `src/definition/` is
  edited.

## Reference index

### Media call feature

- Persisted model: `packages/core-typings/src/mediaCalls/IMediaCall.ts`, `IMediaCallNegotiation.ts`
- Model methods (the guarded state machine): `packages/models/src/models/MediaCalls.ts`,
  `MediaCallNegotiations.ts`; typings `packages/model-typings/src/models/IMediaCallsModel.ts`
- EE engine: `ee/packages/media-calls/src/server/{MediaCallServer,CallDirector,CastDirector,BroadcastAgent,configuration,injection,stripSensitiveData}.ts`;
  `internal/{InternalCallProvider,SignalProcessor}.ts`;
  `internal/agents/{UserActorAgent,CallSignalProcessor}.ts`; `sip/providers/*`; `server/signals/*`
- EE engine definitions: `ee/packages/media-calls/src/definition/{IMediaCallServer,IMediaCallAgent,IMediaCallCastDirector,common}.ts`
- Signaling protocol and client model: `packages/media-signaling/src/definition/{call/*,signals/*,client.ts}`;
  client runtime `packages/media-signaling/src/lib/{Session,Call,TransportWrapper}.ts`
- **Integration seam:** `apps/meteor/server/services/media-call/service.ts` (emitter wiring `:42-54`)
- Core-service contract: `packages/core-services/src/types/IMediaCallService.ts`; proxy
  `packages/core-services/src/index.ts:194`; event `packages/core-services/src/events/Events.ts:307`
- Transport: `apps/meteor/server/modules/notifications/notifications.module.ts:294-301`;
  `apps/meteor/server/modules/listeners/listeners.module.ts:148-150`; client
  `packages/ui-voip/src/providers/useMediaSessionInstance.ts:287-308`
- REST: `apps/meteor/server/api/v1/media-calls.ts`
- Settings and gating: `apps/meteor/ee/server/settings/voip.ts`; permissions in `service.ts:470-478`
- UI: `packages/ui-voip/src/**`

### apps-engine

- Event enums: `packages/apps-engine/src/definition/metadata/{AppInterface,AppMethod}.ts`
- Handler interface templates: `packages/apps-engine/src/definition/messages/{IPostMessageSent,IPreMessageSentPrevent,IPreMessageSentExtend,IPreMessageSentModify}.ts`
- Listener manager: `packages/apps/src/server/managers/AppListenerManager.ts`
- Accessor interfaces: `packages/apps-engine/src/definition/accessors/{IRead,IModify,IVideoConferenceRead,IModifyCreator,IModifyUpdater,IModifyExtender,IModifyDeleter,IPersistence,IPersistenceRead,INotifier}.ts`
- Accessor impls: `packages/apps/base-runtime/src/lib/accessors/read/{Reader,VideoConferenceRead,RoomRead}.ts`,
  `.../accessors/modify/{ModifyCreator,ModifyUpdater}.ts`, `.../accessors/{Persistence,notifier}.ts`;
  assembly `packages/apps/base-runtime/src/lib/accessors/mod.ts`
- Bridges (abstract): `packages/apps/src/server/bridges/{AppBridges,BaseBridge,VideoConferenceBridge,RoomBridge,MessageBridge,ListenerBridge}.ts`
- Provider pattern (precedent): `packages/apps-engine/src/definition/videoConfProviders/IVideoConfProvider.ts`;
  `packages/apps/src/server/managers/AppVideoConfProviderManager.ts`;
  `packages/apps-engine/src/definition/accessors/IVideoConfProvidersExtend.ts`, implemented inline in
  `packages/apps/base-runtime/src/lib/accessors/mod.ts`
- Associations and permissions: `packages/apps-engine/src/definition/metadata/{RocketChatAssociations,AppPermissions}.ts`
- Host bridges, converters, orchestrator: `apps/meteor/app/apps/server/bridges/{bridges.js,listeners.ts,videoConferences.ts,messages.ts,rooms.ts}`;
  `apps/meteor/app/apps/server/converters/*`; `apps/meteor/ee/server/apps/orchestrator.ts`
- Trigger idiom reference: `apps/meteor/server/lib/messages/sendMessage.ts:241,247-257,287-291`
