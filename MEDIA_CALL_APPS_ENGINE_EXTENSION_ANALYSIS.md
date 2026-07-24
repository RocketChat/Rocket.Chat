# Media Calls — Apps-Engine Extension Opportunities

**Scope:** The Rocket.Chat **media call** feature — the 1:1 WebRTC/SIP direct-call system implemented in
`ee/packages/media-calls` + `packages/media-signaling`, surfaced through the `media-call` core-service.
This is a *distinct feature from Video Conferences*; video conf is referenced here only as an
architectural precedent for how apps-engine exposes a call-like domain.

**Goal:** Catalog where and how this feature could be made extensible via apps (apps-engine/`@rocket.chat/apps`):
lifecycle events/hooks, read/modify data accessors, provider registration, persistence, and adjacent
surfaces — with file references dense enough to drive follow-up implementation work.

**Audience:** Engineers and AI agents refining/implementing these extension points. Every claim is anchored to a
`path:line`. Nothing below exists today as an apps-engine integration — media calls currently have **zero**
apps-engine surface. This document identifies the seams where one would be added.

---

## 1. Current architecture (the seams that matter)

### 1.1 The three layers of apps-engine in this monorepo

The historical standalone apps-engine has been split into three locations. Adding any media-call extension
touches all three:

| Layer | Location | Contents |
|---|---|---|
| **SDK / definitions** (published `@rocket.chat/apps-engine`) | `packages/apps-engine/src/definition/` | `AppInterface`, `AppMethod`, handler interfaces, accessor interfaces, context/permission/association types. **`package.json` ships only `definition/**`** (`packages/apps-engine/package.json:39-41`). |
| **Engine runtime** (published `@rocket.chat/apps`) | `packages/apps/src/server/` | `managers/` (`AppListenerManager`, `AppVideoConfProviderManager`), abstract `bridges/`, concrete `accessors/`, `converters/`, `AppManager`, `ProxiedApp`. |
| **Host (real Rocket.Chat)** | `apps/meteor/app/apps/server/` + `apps/meteor/ee/server/apps/` | Concrete bridge subclasses (`bridges/`), converters (`converters/`), orchestrator (`ee/server/apps/orchestrator.js`). |

The host imports the engine from `@rocket.chat/apps/dist/...`, so **the `packages/apps` build must be regenerated**
for host changes to see new engine code (`apps/meteor/app/apps/server/bridges/bridges.js:1`).

### 1.2 The media call domain object

Persisted record — `IMediaCall` (`packages/core-typings/src/mediaCalls/IMediaCall.ts:35-71`):

- `service: 'webrtc'`, `kind: 'direct'` — only 1:1 direct WebRTC/SIP calls exist today (`:36-37`).
- `state: 'none' | 'ringing' | 'accepted' | 'active' | 'hangup'` (`:33,39`). The stored enum is deliberately
  smaller than the client state machine, which also has `renegotiating`
  (`packages/media-signaling/src/definition/call/IClientMediaCall.ts:17-26`).
- Actors: `caller: MediaCallSignedContact`, `callee: MediaCallContact`, `createdBy: MediaCallContact` (`:41,44-45`).
  `MediaCallActorType = 'user' | 'sip'` (`:5`); `contractId` is the per-session signing token (`:7-15`).
- Lifecycle timestamps: `acceptedAt`, `activatedAt`, `expiresAt` (`:52-57`); end fields `ended`, `endedBy`,
  `endedAt`, `hangupReason` (`:47-50`); transfer fields `transferredBy/To/At`, `parentCallId` (`:60,63-65`).
- `uids: string[]` (`:67`), `features: string[]` (`:70`) — negotiated capability set, finalized on accept.

Negotiation record — `IMediaCallNegotiation` (`packages/core-typings/src/mediaCalls/IMediaCallNegotiation.ts:9-24`):
one document per SDP (re)negotiation round; **SDP offer/answer payloads are persisted here.**

Persistence: Mongo collections `media_calls` (`packages/models/src/models/MediaCalls.ts:25-27`,
typing `packages/model-typings/src/models/IMediaCallsModel.ts:13-34`) and `media_call_negotiations`
(`packages/models/src/models/MediaCallNegotiations.ts:12-14`). State transitions are enforced as
**race-safe guarded `updateOne`s** on the model — this is where the persisted state machine actually lives:
`startRingingById` (`MediaCalls.ts:80-88`), `acceptCallById` (`:90-116`), `activateCallById` (`:118-132`),
`hangupCallById` (`:134-152`), `transferCallById` (`:166-185`).

### 1.3 The lifecycle engine and its event emitter

`callServer = new MediaCallServer()` (`ee/packages/media-calls/src/server/configuration.ts:6`) is the singleton
gateway. `MediaCallDirector` (`ee/packages/media-calls/src/server/CallDirector.ts`) is the **state-machine
authority — every DB transition converges there**, making it the natural interception choke point.

The only outward event channel today is a typed `Emitter` — `MediaCallServerEvents`
(`ee/packages/media-calls/src/definition/IMediaCallServer.ts:10-17`):

```
callUpdated            { callId; dtmf? }
callActivated          { callId; uids }
callEnded              { callId; uids }
signalRequest          { toUid; signal }
historyUpdate          { callId }
pushNotificationRequest{ callId; event }
```

Emission sites: `callActivated` at `CallDirector.ts:58`; `callEnded` + `historyUpdate` at `CallDirector.ts:403,406`;
`signalRequest` via `MediaCallServer.sendSignal` (`MediaCallServer.ts:59-63`); `callUpdated` via
`reportCallUpdate` (`MediaCallServer.ts:65-69`).

### 1.4 THE integration seam

**`MediaCallService`** (`apps/meteor/server/services/media-call/service.ts`) is the thin Meteor adapter over the
EE `callServer` engine, and its constructor (`service.ts:34-51`) is where the emitter is wired into the rest of
Rocket.Chat:

```
callServer.emitter.on('signalRequest', …)          → service.ts:36
callServer.emitter.on('callUpdated', …)            → service.ts:37
callServer.emitter.on('callActivated', …)          → service.ts:38  (sets Presence BUSY)
callServer.emitter.on('callEnded', …)              → service.ts:39  (clears Presence)
callServer.emitter.on('historyUpdate', …)          → service.ts:40  (saveCallToHistory)
callServer.emitter.on('pushNotificationRequest',…) → service.ts:41
```

**This block is exactly where an apps-engine listener bridge would subscribe/dispatch**, mirroring how it already
forwards these events onto the microservice bus. The service also owns permission/feature callbacks injected into
the engine (`getMediaServerSettings` `service.ts:411-437`; `userHasMediaCallPermission` `:451-459`;
`userHasFeaturePermission` `:439-449`) — an existing, function-shaped extension seam.

Service contract: `IMediaCallService` (`packages/core-services/src/types/IMediaCallService.ts:4-10`), proxified as
`'media-call'` (`packages/core-services/src/index.ts:194`). Transport rides the existing `notify-user` streamer
(inbound `${uid}/media-calls` → `notifications.module.ts:290-299`; outbound `${uid}/media-signal`), plus three REST
endpoints (`media-calls.answer/state/stateSignals` — `apps/meteor/server/api/v1/media-calls.ts`). Feature gating:
EE + module `teams-voip` + `VoIP_TeamCollab_*` settings (`apps/meteor/ee/server/settings/voip.ts`) + permissions
`allow-internal-voice-calls` / `allow-external-voice-calls`.

### 1.5 How apps-engine extension mechanisms work (two patterns + accessors)

**Pattern A — Events/Listeners (host → app "notify / veto / enrich").** An `AppInterface` member names a hookable
event (`packages/apps-engine/src/definition/metadata/AppInterface.ts`); an `AppMethod` names the method(s) the
engine calls (`.../AppMethod.ts`). Host code fires `Apps.self?.triggerEvent(AppEvents.X, …payload)`
(e.g. `apps/meteor/server/lib/messages/sendMessage.ts:241,287-291`) → `AppServerOrchestrator.triggerEvent`
(`apps/meteor/ee/server/apps/orchestrator.js:383-398`) → `getListenerBridge().handleEvent()`
(`apps/meteor/app/apps/server/bridges/listeners.ts:189-246`, converts payload) →
`AppListenerManager.executeListener()` (`packages/apps/src/server/managers/AppListenerManager.ts:348-476`) →
`app.call(AppMethod.…)`. Handler kinds are distinguished by the accessors they receive:

- **Pre-Prevent** → returns `boolean`; any `true` short-circuits and aborts the host op
  (`AppListenerManager.ts:479-506`; interface `messages/IPreMessageSentPrevent.ts:5-28`).
- **Pre-Extend** → gets an `IMessageExtender` (additive only), threads the object through all apps
  (`AppListenerManager.ts:508-529`; `IPreMessageSentExtend.ts`).
- **Pre-Modify** → gets a builder (full mutation), threads through all apps
  (`AppListenerManager.ts:531-552`; `IPreMessageSentModify.ts`).
- **Post** → gets full accessor set incl. `IModify`, returns `void`, fire-and-forget
  (`AppListenerManager.ts:554-596`; `IPostMessageSent.ts:5-27`).

**Pattern B — Provider registration (app *backs* a capability; host calls into the app on demand).** Used by video
conf: an app registers a provider during `extendConfiguration` (accessor `IVideoConfProvidersExtend`,
impl `packages/apps/src/server/accessors/VideoConfProviderExtend.ts`), the engine tracks it
(`AppVideoConfProviderManager.ts`), and the host RPCs into it when needed
(`apps/meteor/server/services/video-conference/service.ts:905,935` → `AppMethod._VIDEOCONF_*`). Definition:
`packages/apps-engine/src/definition/videoConfProviders/IVideoConfProvider.ts:11-70`.

**Data accessors (app → host read/modify).** `IRead` is a facade of sub-readers
(`packages/apps-engine/src/definition/accessors/IRead.ts:22-57`); `IModify` splits into
creator/updater/extender/deleter (`IModify.ts:11-45`). Each accessor is a thin per-app wrapper delegating to a
`do*` bridge method that performs the **permission check** then calls a `protected abstract` method the host
implements. Canonical minimal precedent: `IVideoConferenceRead` (`.../accessors/IVideoConferenceRead.ts:7-15`) →
`VideoConferenceRead` (`packages/apps/src/server/accessors/VideoConferenceRead.ts:6-15`) →
`VideoConferenceBridge` (`packages/apps/src/server/bridges/VideoConferenceBridge.ts:10-95`) →
host `AppVideoConferenceBridge` (`apps/meteor/app/apps/server/bridges/videoConferences.ts:10-76`) → converter →
core-service. Apps can also store private state via `IPersistence`/`IPersistenceRead`, tagging records to host
objects with `RocketChatAssociationModel` (`.../metadata/RocketChatAssociations.ts:1-24`) — which currently has no
media-call member.

---

## 2. Extension opportunities

Each opportunity below names: the app-facing capability, the *pattern* (A events / B provider / accessor / other),
the precise host insertion point, and the payload/data available there.

### 2.A Lifecycle events / hooks

The `MediaCallDirector` transitions and the `callServer.emitter` events form a ready-made event catalog. Two
plumbing strategies:

- **Strategy 1 (lowest effort, post-only):** subscribe an apps-engine listener bridge to `callServer.emitter` at
  `apps/meteor/server/services/media-call/service.ts:36-41` and re-emit as `IPostMediaCall*` events. Gives observe
  hooks for activated/ended/updated/history/push with no engine changes.
- **Strategy 2 (full pre + post):** add a dedicated hook bus in the EE engine emitting pre/post events from
  `MediaCallDirector` (post) and `MediaCallServer.parseCallContacts`/`requestCall` (vetoable pre), then trigger
  apps-engine from the Meteor service. Needed for *preventable/modifiable* hooks.

#### Pre-hooks (preventable / modifiable — before the DB mutation)

| Proposed event | Host insertion point | What an app could do | Notes |
|---|---|---|---|
| `IPreMediaCallRequested` (Prevent/Modify) | `MediaCallServer.requestCall` / `parseCallContacts` (`ee/packages/media-calls/src/server/MediaCallServer.ts:86-114`, impl `:161-232`) | Block a call, reroute (change callee), annotate before the call exists | Rejection contract already exists: `CallRejectedError` (`definition/common.ts:23-30`) → `rejected-call-request` signal. Permission checks already run here (`:176,200,204,208,218`). |
| `IPreMediaCallCreated` (Prevent/Modify) | `MediaCallDirector.createCall` just before `MediaCalls.insertOne` (`CallDirector.ts:185-241`, insert at `:241`) | Last-look veto; mutate `features`/`createdBy` | Feature filtering already happens at `:211`. |
| `IPreMediaCallAccepted` (Prevent) | `MediaCallDirector.acceptCall` before `MediaCalls.acceptCallById` (`CallDirector.ts:75`); or `clientHasAccepted` (`internal/agents/CallSignalProcessor.ts:316-322`) | Enforce policy on who may accept | |
| `IPreMediaCallTransferred` (Prevent/Modify) | `MediaCallDirector.transferCall` before `MediaCalls.transferCallById` (`CallDirector.ts:268`) | Veto/redirect the transfer target | |
| `IPreMediaCallHangup` (Prevent) | `MediaCallDirector.hangup`/`hangupCallById` before `MediaCalls.hangupCallById` (`CallDirector.ts:389`) | Rare; a veto must tolerate server/error/expiry-driven reasons | Many hangups are non-user (expiry `:288-312`, errors, `hangupByServer` `:44-46`). |
| `IPreMediaCallDTMF` | `processDTMF` (`internal/agents/CallSignalProcessor.ts:274-278`) | Intercept/act on DTMF (IVR-style apps) | |

Existing function-shaped pre-hooks worth exposing directly (no new event needed): the injected
`IMediaCallServerSettings.permissionCheck` and `isFeatureAvailableForUser`
(`IMediaCallServer.ts:40-41`, wired at `service.ts:434-435`) — apps could contribute to these decisions.

#### Post-hooks (observe — after the transition succeeds)

| Proposed event | Host insertion point | Payload available |
|---|---|---|
| `IPostMediaCallCreated` | `runOnCallCreatedForAgent` / `agent.onCallCreated` (`CallDirector.ts:356-375`; `internal/agents/UserActorAgent.ts:68-73`); SIP `sip/providers/IncomingSipCall.ts:119`, `OutgoingSipCall.ts:84` | Full `IMediaCall`, role, contacts |
| `IPostMediaCallRinging` | after `MediaCalls.startRingingById` (`CallSignalProcessor.ts:283-286`) | callId, callee reachability |
| `IPostMediaCallAccepted` | after `acceptCall` success (`CallDirector.ts:81-91`) | callId, callee contractId, final features |
| `IPostMediaCallActivated` | `CallDirector.activate` success (`CallDirector.ts:56-59`) — **already emits `callActivated`** | callId, uids, `activatedAt` |
| `IPostMediaCallTransferred` | `CallDirector.transferCall` success (`CallDirector.ts:273-275`) | transferredBy/To, parentCallId |
| `IPostMediaCallNegotiated` | `saveWebrtcSession` success (`CallDirector.ts:176-182`) | SDP state / streams (media state, hold) — **exposes SDP; see security note** |
| `IPostMediaCallEnded` | `CallDirector.hangupCallById` success (`CallDirector.ts:400-408`) — **already emits `callEnded`+`historyUpdate`** | endedBy, hangupReason, duration, `IMediaCall` |
| `IPostMediaCallDTMF` | `BroadcastAgent.onDTMF` (`ee/packages/media-calls/src/server/BroadcastAgent.ts:42-44`) | dtmf tone/duration |

**Participant join/leave framing:** there is **no multi-party participant model server-side** — calls are strictly
`kind:'direct'` two-actor (`IMediaCall.ts:37,44-45`). "Join/leave" maps to reachable/ringing → accept → active →
hangup. Client-side participant abstractions exist only in `media-signaling`
(`IClientMediaCallParticipant.ts`), not persisted. An app wanting join/leave semantics derives them from the
accept/active/hangup transitions above. Multi-party would be a much larger schema change.

**Adding a Post event — files to touch** (from the traced message-sent path):
1. `packages/apps-engine/src/definition/metadata/AppInterface.ts` — add `IPostMediaCall*` member(s).
2. `packages/apps-engine/src/definition/metadata/AppMethod.ts` — add `CHECK…`/`EXECUTE…` method names.
3. `packages/apps-engine/src/definition/mediaCalls/IPostMediaCall*.ts` — new handler interface(s) + context type
   (model on `messages/IPostMessageSent.ts:5-27` and existing context types like `IRoomUserJoinedContext`).
4. `packages/apps-engine/src/definition/mediaCalls/index.ts` — export them.
5. `packages/apps/src/server/managers/AppListenerManager.ts` — add to `IListenerExecutor` map (`:40-246`), add a
   `case` in `executeListener` (`:348-476`), add the private `executeMediaCall*` loop (copy post template `:554-596`
   or simple-post `:901-907`).
6. `apps/meteor/app/apps/server/bridges/listeners.ts` — extend the `HandleEvent` union (`:42-183`), add `case`(s) in
   `handleEvent` (`:190-245`), add a `mediaCallEvent(args)` group handler that converts the payload and calls
   `executeListener` (model on `messageEvent` `:297-378`).
7. Host trigger call sites — from `MediaCallService` (`apps/meteor/server/services/media-call/service.ts:36-41`)
   for Strategy 1, or from the EE engine's new hook bus for Strategy 2:
   `void Apps.self?.triggerEvent(AppEvents.IPostMediaCall*, payload)`.
8. `packages/apps/src/converters/` (+ host `apps/meteor/app/apps/server/converters/`) — a media-call converter if
   the payload needs RC↔app shape mapping. `AppImplements`/manager detection is automatic via
   `Object.keys(AppInterface)` (`AppListenerManager.ts:270-273`) — no manual edit.
9. Rebuild `@rocket.chat/apps`.

For Pre events, additionally return the value up the chain and (Extend/Modify) provide a builder/extender accessor.

### 2.B Read accessor — `IMediaCallRead`

Let apps read call state/history. Precedent is `IVideoConferenceRead` (single `getById`); a richer surface is
warranted given the query helpers already on the model (`MediaCalls.ts:41-70,187-227`).

Proposed surface: `getById(callId)`, `getActiveCallsByUser(uid)` (backs the existing
`MediaCalls.findAllNotOverByUid` `:199-210`), `getCallHistory(uid, opts)`, `getNegotiations(callId)`.

Recipe (worked precedent = VideoConference; from the accessor sweep):
- **Definitions:** create `packages/apps-engine/src/definition/accessors/IMediaCallRead.ts` (mirror
  `IVideoConferenceRead.ts:7-15`); create `packages/apps-engine/src/definition/mediaCalls/IMediaCall.ts` (the
  app-facing shape); export from `accessors/index.ts` (mirror `:57`); add `getMediaCallReader(): IMediaCallRead` to
  `IRead.ts` (mirror `:49`).
- **Engine:** create `packages/apps/src/server/accessors/MediaCallRead.ts` (mirror `VideoConferenceRead.ts:6-15`);
  create abstract `packages/apps/src/server/bridges/MediaCallBridge.ts` with permission-gated `doGetById`
  (mirror `VideoConferenceBridge.ts:10-95`); export from `bridges/index.ts`; add `abstract getMediaCallBridge()` to
  `AppBridges.ts:100` and to the `Bridge` union (`:30-55`); wire into `AppAccessorManager.getReader()`
  (`packages/apps/src/server/managers/AppAccessorManager.ts:178-219`, add `new MediaCallRead(...)` and pass to
  `Reader`); add the getter to `Reader.ts` (`:79-81`).
- **Host:** create `apps/meteor/app/apps/server/bridges/mediaCalls.ts` (`class AppMediaCallBridge extends
  MediaCallBridge`, mirror `videoConferences.ts:10-76`); create `apps/meteor/app/apps/server/converters/mediaCalls.ts`
  (mirror `converters/videoConferences.ts:5-33`); register bridge in `bridges/bridges.js`
  (import + `this._mediaCallBridge = new AppMediaCallBridge(orch)` at `:54` + getter at `:142-144`); register
  converter in `orchestrator.js:70`.
- **Cross-cutting:** add `mediaCall: { read, write }` to `AppPermissions.ts:106-110` (+ `defaultPermissions`
  `:162-164` if legacy apps should inherit).

Call chain (read): `IRead.getMediaCallReader()` → `MediaCallRead.getById` → `MediaCallBridge.doGetById`
(permission check) → `AppMediaCallBridge.getById` → converter → `MediaCalls` model.

### 2.C Modify accessors / builders

More sensitive than reads (calls are live sessions), so scope narrowly and route through the engine, never the
model directly. Options, in rough order of safety:

- **`IMediaCallModify` action methods (recommended):** `hangup(callId, reason)`, `transfer(callId, to)`,
  `sendDTMF(callId, tone)` — wrappers over the existing engine capabilities
  (`MediaCallDirector.hangup`/`transferCall`; `IMediaCallService` methods). These mirror real user actions and
  reuse all existing guards, rather than mutating the record. Expose via a bridge `doHangup`/`doTransfer` gated by
  `mediaCall.write`.
- **`IModifyCreator.startMediaCall()` builder:** let an app *place* a call programmatically, committing via the
  existing `ModifyCreator.finish()` switch on `RocketChatAssociationModel` (`ModifyCreator.ts:151`). Requires a
  `MEDIA_CALL` association member (`RocketChatAssociations.ts:1-10`) and routes to `callServer.requestCall`
  (`MediaCallServer.ts:86`, params `InternalCallParams` `definition/common.ts:11-19`).
- **`IModifyExtender.extendMediaCall(id)`:** additive metadata only (e.g. app-owned tags), analogous to
  `extendVideoConference` (`IModifyExtender.ts:31`).

Avoid exposing raw `IMediaCall` field writes — the persisted state machine is guarded at the model layer for
race-safety (`MediaCalls.ts:80-185`) and bypassing it would corrupt live calls.

### 2.D Provider pattern — pluggable call backend (larger, forward-looking)

The provider model (Pattern B) is the template if a future goal is to let an app *back* media calls (e.g. an
alternate SIP/telephony provider, or supply routing/URLs). Today the SIP vs internal fork is hard-coded in
`MediaCallServer.createCall` (`ee/packages/media-calls/src/server/MediaCallServer.ts:116-125`) based on
`callee.type`. A `IMediaCallProvider` (mirroring `IVideoConfProvider.ts:11-70`) with lifecycle callbacks
(`onCallRequested`, `onCallEnded`, `generateRoute`) would require: a provider definition + `IMediaCallProvidersExtend`
accessor + `AppMediaCallProviderManager` (mirror `AppVideoConfProviderManager.ts`) + bridge + host registry + host
call sites in the engine's routing (`parseCallContacts` `:161-232`). This is a significant refactor of the routing
layer and should be treated as a separate initiative from events/accessors.

### 2.E Persistence & associations

Apps get private storage for free via `IPersistence`/`IPersistenceRead`
(`packages/apps-engine/src/definition/accessors/IPersistence.ts:8-97`, `IPersistenceRead.ts:8-40`). To let apps key
their records to a call, add `MEDIA_CALL` to `RocketChatAssociationModel`
(`packages/apps-engine/src/definition/metadata/RocketChatAssociations.ts:1-10`). Then an app handling
`IPostMediaCallEnded` can persist per-call analytics with
`createWithAssociation(data, new RocketChatAssociationRecord(RocketChatAssociationModel.MEDIA_CALL, callId))`.
Low-cost, high-value for CDR/analytics/compliance apps; no engine routing changes.

### 2.F Adjacent surfaces (already generic — usable today)

These require **no** media-call-specific work; they are worth noting so extension design doesn't duplicate them:

- **Notifications / ephemeral UI:** `INotifier` (`.../accessors/INotifier.ts:31-63`) — an app reacting to a call
  event can `notifyUser`/`notifyRoom`.
- **Slash commands:** `ISlashCommandsExtend` — e.g. `/call <user>` could drive `MediaCall`/`callServer.requestCall`.
- **UIKit / contextual bar / action buttons:** apps can already contribute UI; a call-ended handler could open a
  UIKit survey. See `apps/meteor/ee/server/apps/communication/uikit.ts`.
- **Scheduler:** `ISchedulerExtend`/`ISchedulerModify` — scheduled call reminders/callbacks.
- **Message hooks around history messages:** call outcomes are written as system messages via
  `saveCallToHistory`/`sendHistoryMessage` (`service.ts:148-296`), which already flow through `sendMessage` and thus
  the existing `IPreMessageSent*`/`IPostMessageSent` hooks — apps can act on call-history messages **today**.

### 2.G Settings & permissions extension

Apps can define their own settings (`ISettingsExtend`) and the media-call feature already exposes clean, injectable
policy callbacks (`IMediaCallServerSettings.permissionCheck` / `isFeatureAvailableForUser`,
`IMediaCallServer.ts:40-41`; wired `service.ts:434-435`). A high-leverage, low-surface extension is to let apps
*participate* in those two callbacks (call authorization + feature availability) via a dedicated
`IPreMediaCallRequested` Prevent hook rather than a full accessor.

---

## 3. Recommended phasing

1. **Phase 1 — Observe (cheap, high value).** Strategy-1 Post events subscribed to `callServer.emitter`
   (`service.ts:36-41`): `IPostMediaCallActivated`, `IPostMediaCallEnded` (+ history/push). Add `IMediaCallRead`
   and the `MEDIA_CALL` association. Enables analytics/CDR/compliance/notification apps with no engine changes.
2. **Phase 2 — Act.** `IMediaCallModify` action methods (`hangup`/`transfer`/`sendDTMF`) + remaining Post events
   (created/ringing/accepted/transferred/DTMF). Requires the EE engine hook bus (Strategy 2 scaffolding).
3. **Phase 3 — Intervene.** Pre-Prevent/Modify hooks (`IPreMediaCallRequested`, `IPreMediaCallCreated`,
   `IPreMediaCallTransferred`) wired into `MediaCallDirector`/`MediaCallServer`, reusing the `CallRejectedError`
   rejection contract.
4. **Phase 4 — Provide (optional, large).** `IMediaCallProvider` pluggable backend (Pattern B), refactoring the
   routing fork in `MediaCallServer.createCall`.

---

## 4. Cross-cutting concerns for implementers

- **SDP / sensitive data.** Signal payloads and negotiations carry SDP; the engine already strips it for logs
  (`ee/packages/media-calls/src/server/stripSensitiveData.ts:3-24`, applied `MediaCallServer.ts:60`). Any hook or
  accessor exposing signals/negotiations to apps must apply the same stripping and gate behind a distinct
  permission.
- **SIP vs internal uniformity.** Both providers funnel every state change through the *same* `MediaCallDirector`
  methods, so hooks placed there fire uniformly regardless of provider
  (fork only at `MediaCallServer.createCall:116-125`; agent asymmetry `CastDirector.ts:97-116`). Place post-hooks in
  the director, not in the agents, to avoid provider-specific gaps.
- **Non-user-driven transitions.** Expiry (`CallDirector.ts:288-312`), errors, and `hangupByServer` (`:44-46`) end
  calls without a user actor. Pre-hangup vetoes and any hook payload must tolerate `ServerActor`
  (`IMediaCall.ts:17-20`) and non-user `endedBy`.
- **Multi-instance / performance.** Events fan out across instances via the microservice bus and the
  `BroadcastActorAgent` mechanism (`ee/packages/media-calls/src/server/BroadcastAgent.ts`). Post-hooks should be
  fire-and-forget (as the existing listener contract is) to avoid adding latency to real-time call signaling.
- **EE gating.** Media calls are enterprise + module `teams-voip` (`apps/meteor/ee/server/settings/voip.ts:4-10`).
  Any host trigger sites must be safe when the feature/module is disabled.
- **Build coupling.** Host imports engine from `@rocket.chat/apps/dist` — rebuild `packages/apps` after engine edits
  (`apps/meteor/app/apps/server/bridges/bridges.js:1`).

---

## 5. File reference index

### Media call feature
- Persisted model: `packages/core-typings/src/mediaCalls/IMediaCall.ts`, `IMediaCallNegotiation.ts`
- Model methods (guarded state machine): `packages/models/src/models/MediaCalls.ts`, `MediaCallNegotiations.ts`;
  typings `packages/model-typings/src/models/IMediaCallsModel.ts`, `IMediaCallNegotiationsModel.ts`
- EE engine: `ee/packages/media-calls/src/server/{MediaCallServer,CallDirector,CastDirector,BroadcastAgent,
  configuration,injection,stripSensitiveData}.ts`; `internal/{InternalCallProvider,SignalProcessor}.ts`;
  `internal/agents/{UserActorAgent,CallSignalProcessor}.ts`; `sip/providers/*`; `server/signals/*`
- EE engine definitions: `ee/packages/media-calls/src/definition/{IMediaCallServer,IMediaCallAgent,
  IMediaCallCastDirector,common}.ts`; public exports `ee/packages/media-calls/src/index.ts`
- Signaling protocol / client model: `packages/media-signaling/src/definition/{call/*,signals/*,client.ts}`;
  client runtime `packages/media-signaling/src/lib/{Session,Call,TransportWrapper}.ts`
- **Integration seam:** `apps/meteor/server/services/media-call/service.ts` (emitter wiring `:36-41`)
- Core-service contract: `packages/core-services/src/types/IMediaCallService.ts`;
  proxy `packages/core-services/src/index.ts:194`; event `packages/core-services/src/events/Events.ts:307`
- Transport: `apps/meteor/server/modules/notifications/notifications.module.ts:290-299`;
  `apps/meteor/server/modules/listeners/listeners.module.ts:148-150`;
  client `packages/ui-voip/src/providers/useMediaSessionInstance.ts:287-308`
- REST: `apps/meteor/server/api/v1/media-calls.ts`
- Settings/gating: `apps/meteor/ee/server/settings/voip.ts`; permissions in `service.ts:451-459`
- UI: `packages/ui-voip/src/**` (widgets, providers, history table)

### apps-engine (definitions / engine / host)
- Event enums: `packages/apps-engine/src/definition/metadata/{AppInterface,AppMethod}.ts`
- Handler interface templates: `packages/apps-engine/src/definition/messages/{IPostMessageSent,
  IPreMessageSentPrevent,IPreMessageSentExtend,IPreMessageSentModify}.ts`; rooms `.../rooms/*`
- Listener manager: `packages/apps/src/server/managers/AppListenerManager.ts`
- Accessor interfaces: `packages/apps-engine/src/definition/accessors/{IRead,IModify,IVideoConferenceRead,
  IModifyCreator,IModifyUpdater,IModifyExtender,IModifyDeleter,IPersistence,IPersistenceRead,INotifier}.ts`
- Accessor impls: `packages/apps/src/server/accessors/{Reader,VideoConferenceRead,RoomRead,ModifyCreator,
  Persistence,Notifier}.ts`; assembly `packages/apps/src/server/managers/AppAccessorManager.ts`
- Bridges (abstract): `packages/apps/src/server/bridges/{AppBridges,BaseBridge,VideoConferenceBridge,RoomBridge,
  MessageBridge,ListenerBridge}.ts`
- Provider pattern (precedent): `packages/apps-engine/src/definition/videoConfProviders/IVideoConfProvider.ts`;
  `packages/apps/src/server/managers/AppVideoConfProviderManager.ts`;
  `packages/apps/src/server/accessors/VideoConfProviderExtend.ts`
- Associations / permissions: `packages/apps-engine/src/definition/metadata/{RocketChatAssociations,
  AppPermissions}.ts`
- Host bridges/converters/orchestrator: `apps/meteor/app/apps/server/bridges/{bridges.js,listeners.ts,
  videoConferences.ts,messages.ts,rooms.ts}`; `apps/meteor/app/apps/server/converters/*`;
  `apps/meteor/ee/server/apps/orchestrator.js`
- Trigger idiom reference: `apps/meteor/server/lib/messages/sendMessage.ts:241,247-257,287-291`
