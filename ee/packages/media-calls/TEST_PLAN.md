# Test plan — `@rocket.chat/media-calls`

## 1. Context

`ee/packages/media-calls` is the server-side engine for Rocket.Chat media (WebRTC/SIP)
calls. It owns call lifecycle, the WebRTC "perfect negotiation" state machine, signal
routing to/from clients, and the SIP bridge (via `drachtio-srf`). It is consumed by the
Meteor service at `apps/meteor/server/services/media-call`, which wires the package's
`callServer` emitter to DDP/streamer and push notifications.

**Current state: no test harness.** The package has `@types/jest` in `devDependencies`
but no `jest`, no `jest.config.ts`, no `test`/`testunit` scripts, and no
`@rocket.chat/jest-presets`. It is the only package under `ee/packages/*` without a
harness, and there is zero coverage of its logic anywhere in the repo.

This document is a plan to (a) stand up the harness matching repo conventions and
(b) cover the functionality, prioritized from cheap high-confidence wins to the hard
protocol state machines.

### Dependency seams (what makes this testable — or not)

| Seam | Mechanism | Test approach |
| --- | --- | --- |
| DB layer | `@rocket.chat/models` (`MediaCalls`, `MediaCallNegotiations`, `Users`) — hard imports | `jest.mock('@rocket.chat/models', …)` |
| `CastDirector` / `MediaCallServer` | injected singletons via `server/injection.ts` (`setCastDirector`/`setMediaCallServer`) | inject fakes — the cleanest seam in the package |
| SIP stack | `drachtio-srf` `Srf` class, hard-imported, **constructed at import time** | `jest.mock('drachtio-srf')` |
| Logger | `@rocket.chat/logger` | leave real (silent) or mock |
| Client transport | `MediaCallServer.emitter` (`@rocket.chat/emitter`) events | assert on captured emitter events |
| Time | `setTimeout` (expiration), `new Date()`, `randomUUID()`, `Random.id()` | `jest.useFakeTimers()`, fixed clock |

### Import-time side effects (⚠ read before writing any spec)

`src/index.ts` → `server/configuration.ts` runs at module load:

```ts
export const castDirector = new MediaCallCastDirector();
export const callServer = new MediaCallServer();   // → new SipServerSession() → new Srf()
setCastDirector(castDirector);
setMediaCallServer(callServer);
```

Consequences for tests:

- **Importing anything that transitively pulls in `configuration.ts` or `sip/Session.ts`
  constructs a real `Srf`** and opens no connection but registers event handlers. Any spec
  touching that path must `jest.mock('drachtio-srf')` (hoisted) or the import throws /
  leaks handles (`drachtio-srf` is a patched dep and is not always installed locally).
- The injected singletons are process-global. Specs that call `setMediaCallServer`/
  `setCastDirector` must restore them in `afterEach` to avoid cross-test bleed.
- `CallDirector` keeps a **module-level** `scheduledExpirationChecks: Map` of live
  timers. Tests must use fake timers and clear the map (see §4 "Recommended refactors").

Prefer testing the **classes directly** (`new MediaCallServer()`, `mediaCallDirector`
is exported as a singleton from `CallDirector.ts`) and injecting fakes, rather than
importing the package barrel.

---

## 2. Harness setup

Match the `omnichannel-services` / `presence` convention exactly (Jest 30 + `@swc/jest`
via the shared preset, co-located `*.spec.ts`, `turbo run testunit`).

**2.1 `package.json`** — add scripts and devDeps (`@types/jest`, `@rocket.chat/tsconfig`,
`typescript` already present):

```jsonc
"scripts": {
  // …existing…
  "test": "jest",
  "testunit": "jest"        // ← this alone enrolls the package in `turbo run testunit` / CI
},
"devDependencies": {
  // …existing…
  "@rocket.chat/jest-presets": "workspace:~",
  "jest": "~30.2.0"
}
```

No root `package.json` or `turbo.json` change is needed — turbo discovers any workspace
with a `testunit` script, and CI runs `yarn testunit --concurrency=1`
(`.github/workflows/ci-test-unit.yml`).

**2.2 `jest.config.ts`** (new file at package root):

```ts
import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
  preset: server.preset,
  testMatch: ['<rootDir>/src/**/*.spec.(ts|js|mjs)'],
} satisfies Config;
```

The server preset already gives `testEnvironment: 'node'`, `@swc/jest` TS transform, and
`collectCoverage: true`. No babel/swc config file is needed (swc options are inline in the
preset).

**2.3 Keep specs out of the published build.** The package builds with
`tsc -p tsconfig.json` and `include: ["./src/**/*"]`, which would compile specs into
`dist`. Adopt the `omnichannel-services` split:

- add `tsconfig.build.json`:
  ```jsonc
  {
    "extends": "./tsconfig.json",
    "compilerOptions": { "declaration": true },
    "exclude": ["./dist", "./src/**/*.spec.ts", "./src/**/*.fixtures.ts"]
  }
  ```
- point `build`/`dev` at it: `tsc -p tsconfig.build.json …`.

(Alternatively add the two `exclude` globs to the existing `tsconfig.json`; the separate
build config is the established pattern.)

**2.4 Test file layout.** Co-locate `*.spec.ts` next to source. Put shared builders in
`src/tests/fixtures.ts` (call/negotiation/contact/signal factories) and reusable fakes in
`src/tests/fakes.ts` (fake `IMediaCallServer`, fake `IMediaCallCastDirector`, fake
`IMediaCallAgent`, fake `Srf`). Name model-mock helpers `*.fixtures.ts` so the build
excludes them.

**2.5 Model mocking — pick per suite:**

- **Pattern A — `jest.mock('@rocket.chat/models', () => ({ … }))`** (dominant in EE
  packages, e.g. `omni-core-ee`, `abac`, `omnichannel-services`): declare each used model
  with `jest.fn()` methods; cast to `jest.Mocked<typeof X>` for assertions. Use for the
  bulk of unit specs. Remember chained cursors: `findAllExpiredCalls`/`findAllNotOverByUid`
  return async iterables/`.toArray()` — mock them to return an array or an async generator.
- **Pattern B — `registerModel('IMediaCallsModel', fake)`** (used by `presence`): register
  a fake against the models proxy layer. Cleaner when a suite spans several modules that
  each import models. Restore/overwrite between tests.
- **Pattern C — `mongodb-memory-server` + real `*Raw` model classes** (used by `abac`):
  reserve for a small number of integration specs if we want to exercise the real Mongo
  update operators (`acceptCallById`, `transferCallById`, `findAllExpiredCalls` query,
  etc.). Requires adding `mongodb-memory-server` + `mongodb` devDeps and relies on the
  `MONGOMS_*` turbo pass-through env already configured. **Verify the model methods this
  package calls actually exist in `@rocket.chat/models`/`model-typings`** before relying on
  them (see §4 open question).

**2.6 Mocking gotchas (learned from the code, save yourself the debugging):**

- **`mediaCallDirector` is a hard-imported singleton, not injected.** Unlike the server /
  cast seams (which have `set*` injectors), `CallDirector.ts` exports
  `const mediaCallDirector = new MediaCallDirector()` and every consumer imports it by name.
  To stub it from a consumer's spec (e.g. testing `InternalCallProvider` or
  `UserActorSignalProcessor` without exercising the real director), use
  `jest.mock('../server/CallDirector', () => ({ mediaCallDirector: { … } }))`. Its
  `.cast` getter still delegates to `getCastDirector()`, so the cast director stays
  injectable even when reached through a real director.
- **`instanceof` checks block plain-object fakes** in three places — supply *real*
  instances (or `jest.mock` the module) rather than duck-typed objects:
  - `GlobalSignalProcessor.processCallSignal` requires the resolved agent to be a real
    `UserActorAgent` (else `internal-error`).
  - both SIP providers require a real `BroadcastActorAgent`.
  - `MediaCallServer.requestCall` branches on `error instanceof CallRejectedError` — throw
    the real error class from `definition/common.ts`, not a look-alike.
- **Fire-and-forget async won't be awaited by the public call.** `void x.then/.catch`,
  `.catch(() => null)` appear in `MediaCallServer.requestCall`,
  `UserActorSignalProcessor.processDTMF`/`reviewLocalState` (`setStableById`),
  `InternalCallProvider` (transferred-call hangup), and every SIP dialog handler. Specs must
  flush microtasks (`await Promise.resolve()` / `await flushPromises()` /
  `jest.advanceTimersByTimeAsync`) before asserting these side effects.
- **Nondeterministic ids:** spy on `crypto.randomUUID` (`CallDirector.createCall`) and mock
  `@rocket.chat/random`'s `Random.id` (`SipServerSession`) when asserting ids.
- **Chained model returns:** `findAllExpiredCalls`/`findAllNotOverByUid` return
  cursors/async-iterables — mock them to return an async generator (or an object with
  `.toArray()`), not a bare array, to match the call sites.

---

## 3. Test suites, prioritized

Tiers are ordered by cost/confidence. Each item lists the file under test and the concrete
cases that matter (derived from the branches in the code).

### Tier 1 — Pure functions (no DB, no mocks) — do first

Fast, deterministic, high coverage-per-effort. These pin down the signal-shaping contract
with clients.

**`server/getCallRoleForUser.ts`**
- caller match → `'caller'`; callee match → `'callee'`; neither → `null`.
- ignores non-`user` actor types even when ids collide (sip actor with same id ≠ match).

**`server/stripSensitiveData.ts`**
- `stripSensitiveDataFromSdp`: `null`/`undefined`/missing `.sdp` returned as-is; present sdp
  replaced with `length=<n>`, other fields preserved; input not mutated.
- `stripSensitiveDataFromSignal`: signals with `sdp` get it stripped; signals without `sdp`
  pass through unchanged; input not mutated (it spreads, verify).

**`server/signals/getNewCallSignal.ts`** (+ `getCallFlags` behavior)
- caller vs callee: `self`/`contact` swapped correctly.
- `internal` flag only when both actors are `type:'user'`; `create-data-channel` only for
  internal **and** caller.
- `replacingCallId` present iff `parentCallId` set; `transferredBy` present iff
  `getNewCallTransferredBy` returns non-null; `requestedCallId` present only for caller with
  `callerRequestedId`.

**`server/signals/getNewCallTransferredBy.ts`**
- null when `createdBy` or `parentCallId` missing.
- null when `createdBy` equals caller or callee (type+id).
- returns `createdBy` when it is a third party (transfer case).

**`server/signals/getStateNotification.ts`** (+ `getStateForNotification`)
- `ended` or `state==='hangup'` → `'hangup'`.
- `state==='active'` → `'active'`.
- pending state (`isPendingState`) or no `callee.contractId` → `null` (no signal).
- otherwise → `'accepted'`.
- output includes `signedContractId` only when the role's actor has a `contractId`;
  `features` passed through.

**`server/getDefaultSettings.ts`**
- shape/defaults: `sip.enabled=false`, `routeExternally='never'`, `mobileRinging=false`,
  `permissionCheck` resolves `false`, `isFeatureAvailableForUser` returns `false`.
- returns a fresh object each call (no shared mutable singleton).

**`constants.ts`** — `DEFAULT_CALL_FEATURES` / `SIP_CALL_FEATURES` values (guards against
accidental edits; trivial).

**`base/BaseAgent.ts`** (via a minimal concrete subclass in the spec)
- `actor` getter; `oppositeRole` mapping (caller↔callee); `isRepresentingActor`
  (type+id match); `getMyCallActor`/`getOtherCallActor` pick the right side by role;
  `getSignedActor` merges `contractId`.

**`sip/errorCodes.ts`** — `SipError` carries `sipErrorCode` + default message; spot-check a
couple of code constants.

### Tier 2 — Orchestration with mocked models + injected fakes

The core call-lifecycle logic. Mock `@rocket.chat/models`; inject a fake
`IMediaCallServer` (capture emitted events) and fake `IMediaCallCastDirector`. Use fake
timers.

**`server/CallDirector.ts` (`mediaCallDirector` singleton)** — highest-value target.
- `createCall`:
  - throws `invalid-caller` when caller has no `contractId`; throws `invalid-call-service`
    for non-`webrtc` service; throws on missing caller/callee agent.
  - sets reciprocal `oppositeAgent` on both agents.
  - `features` filtered through `isFeatureAvailableForUser`.
  - `_id` is a UUID; `uids` contains only `type:'user'` actor ids; `createdBy` defaults to
    `caller` when no `requestedBy`; `expiresAt` = now + 120 000; `callerRequestedId`/
    `parentCallId` set only when provided.
  - throws `failed-to-create-call` / `failed-to-retrieve-call` on insert/find failure.
  - schedules an expiration check for the new call id.
- `acceptCall`:
  - loads latest negotiation **before** state change; returns `false` when
    `acceptCallById.modifiedCount===0` (no longer ringing).
  - on success: notifies `calleeAgent.onCallAccepted` and opposite; when `webrtcAnswer`
    present and a negotiation exists → `setAnswerById` + opposite
    `onRemoteDescriptionChanged`; schedules expiration check.
  - returns `false` when updated call can't be re-fetched.
- `activate`: no-op when `activateCallById.modifiedCount===0`; on success emits
  `callActivated` with `uids`, schedules expiration, calls opposite `onCallActive`.
- `startFirstNegotiation`: returns `null` if a negotiation already exists, else starts a
  `'caller'` negotiation.
- `startNewNegotiation`: inserts negotiation with `offerer`, `requestTimestamp`, and
  offer/`offerTimestamp` only when an offer is passed; returns `insertedId`.
- `saveWebrtcSession`: throws `invalid-negotiation` / `invalid-contract` /
  `invalid-sdp`; the offer↔offerer XOR check (`isOffer !== isOfferer`); routes to
  `setOfferById` vs `setAnswerById`; notifies opposite `onRemoteDescriptionChanged` only
  when `modifiedCount`.
- `hangup` / `hangupCallById`:
  - `endedBy` sanitized to `{type,id[,contractId]}` (server actor drops `contractId`).
  - on `modifiedCount>0`: emits `callEnded`, calls `updateCallHistory`, notifies both
    agents; no events when nothing modified.
  - `hangupCallById` rethrows on model error (logged).
- `hangupCallByIdAndNotifyAgents`: swallows model error → `false`; `Promise.allSettled`
  over agents; per-agent `onCallEnded` errors are logged not thrown.
- `hangupDetachedCall`: default `endedBy` = server actor; agent notification errors
  suppressed; returns `modified`.
- `hangupTransferredCallById`: false when call missing or no `transferredBy`; else detached
  hangup with reason `'transfer'`.
- `transferCall`: no-op (logs) when no `oppositeAgent`; on `modifiedCount` notifies
  `oppositeAgent.onCallTransferred`.
- `hangupExpiredCalls`: iterates the async cursor, hangs up each with reason `'expired'`;
  the overload returning `boolean` when `expectedCallId` matches an expired call.
- **Expiration timers** (`scheduleExpirationCheckByCallId`, `scheduleExpirationCheck`,
  `renewCallId`) with `jest.useFakeTimers()`:
  - scheduling twice clears the previous timeout for the same id.
  - on fire: if expected call wasn't expired and call is not `ended`, it reschedules; if
    `ended`, it does not.
  - `renewCallId` calls `setExpiresAtById` and reschedules.
- `getNewExpirationTime` = `Date.now()+120000` (fixed clock).

**`server/CastDirector.ts` (`MediaCallCastDirector`)** — contact resolution / routing +
agent factory. Mock `Users`.
- `getContactForActor`: `user` → `getContactForUserId`, `sip` → `getContactForExtensionNumber`,
  other → `null`.
- `getContactForUserId`: `null` when user not found; otherwise builds contact list and
  applies options.
- `getContactForExtensionNumber`: when a user has the extension, build user-based list;
  when not, build extension-only list.
- `buildContactListForUser`: maps `name→displayName`, `username`, `freeSwitchExtension→
  sipExtension`; `sip` entry only when an extension exists; `defaultContactInfo` overridden
  by real user fields.
- `getContactFromList`: `requiredType` returns that slot or `null`; else `preferredType`
  wins, then `user`, then `sip`, then `null`.
- `getAgentForActorAndRole`: `user` → `UserActorAgent`, `sip` → `BroadcastActorAgent`,
  other → `null` (+ warn).
- `getAgentsFromCall`: throws when either agent can't be built; wires reciprocal
  `oppositeAgent`.

**`server/MediaCallServer.ts`** — construct directly; inject fake cast director; capture
emitter events. Mock `InternalCallProvider` and the SIP `Session` (or its
`createOutgoingCall`).
- `sendSignal` emits `signalRequest`; `reportCallUpdate`→`callUpdated`;
  `updateCallHistory`→`historyUpdate`.
- `sendPushNotification`: **gated on `settings.mobileRinging`** — no emit when false, emits
  `pushNotificationRequest` when true.
- constructor wires `signalProcessor` `signalRequest`→`sendSignal` and
  `callRequest`→`requestCall`.
- `createCall`: `callee.type==='sip'` → `session.createOutgoingCall`; otherwise
  `InternalCallProvider.createCall`.
- `requestCall`: on `CallRejectedError` sends `rejected-call-request` to the requester with
  the error's reason **only when** there is an `originalId`
  (`requestedCallId||parentCallId`) and `requestedBy.type==='user'`; otherwise rethrows;
  non-`CallRejectedError` errors are logged then still routed/rethrown per the same rule.
- `configure` forwards to `session.configure` and stores settings; `permissionCheck` /
  `isFeatureAvailableForUser` delegate to settings.
- **`parseCallContacts` (routing/permission matrix)** — the richest logic here:
  - requester defaults to `caller`; non-`user` requester → `CallRejectedError('invalid-call-params')`.
  - `permissionCheck(requester,'any')` false → `forbidden` (fail-early, before callee lookup).
  - caller contact required type is `'user'` for new calls, `caller.type` for transfers
    (`parentCallId` set).
  - null caller/callee contact → `invalid-call-params`.
  - `requireExtensions` true + callee has no `sipExtension` → `invalid-call-params`.
  - callee `user`: requires `internal` permission for requester, callee, and (if caller is a
    different user) caller.
  - callee `sip`: caller must be `user`; requires `external` permission for requester.
  - returns caller merged with original `caller.contractId`.
- **`getCalleeContactOptions`**: `sip.enabled=false` → `{requiredType:'user'}`; else by
  `routeExternally`: `always`→`{requiredType:'sip'}`, `never`→`{preferredType:'user'}`,
  `preferably`→`{preferredType:'sip'}`, default→`{}`.

**`internal/InternalCallProvider.ts`** — mock models + cast director + `mediaCallDirector`.
- rejects (`unsupported`) when either actor is not `user`, or caller id === callee id.
- `hasUnfinishedCallsByUid(caller, parentCallId)` → `busy`; `hasUnfinishedCallsByUid(callee)`
  → `unavailable`.
- throws `invalid-caller`/`invalid-callee` when agents missing; wires reciprocal agents.
- calls `createCall`, then `runOnCallCreatedForAgent(caller)` and
  `runOnCallCreatedForAgent(callee, callerAgent)` in order.
- when `parentCallId` set, fires `hangupTransferredCallById(parent)` (fire-and-forget,
  errors swallowed).
- `runOnCallCreatedForAgent` (on `CallDirector`, but exercised here): when the agent's
  `onCallCreated` throws → hangs up with reason `'error'`, notifies the fallback agent (only
  when provided), and rethrows.

**`server/injection.ts`**
- getters throw when unset; setters + getters round-trip; verify restore pattern works.

**`server/BroadcastAgent.ts`** — inject fake server + fake provider.
- each `onCall*` calls `reportCallUpdated`.
- `reportCallUpdated`: when `provider.callId===callId`, calls
  `provider.reactToCallChanges`; if that rejects, falls back to `server.reportCallUpdate`;
  otherwise calls `server.reportCallUpdate` directly.
- `onDTMF` forwards `{dtmf,duration}`; `onCallCreated` is a no-op (logs only).

### Tier 3 — Signal state machines (the protocol core)

The correctness-critical logic. Mock models; use a fake cast director returning
`UserActorAgent`s (or spy on `mediaCallDirector`); capture `signalRequest`/`callRequest`
emitter events.

**`internal/SignalProcessor.ts` (`GlobalSignalProcessor`)**
- `processSignal` dispatch: `register`→register handler, `request-call`→request handler,
  anything with `callId`→`processCallSignal`, else logs "unrecognized".
- `processCallSignal`:
  - throws `invalid-call` when call not found.
  - **`isCaller === isCallee` guard**: throws `invalid-call` when the uid is neither or
    both actors.
  - `skipContractCheck` only for `hangup` with reason `another-client`; otherwise a mismatched
    `contractId` on a signed actor is skipped (or throws when `throwIfSkipped`).
  - calls `renewCallId`, resolves agents, requires a `UserActorAgent` (else
    `internal-error`), delegates to `agent.processSignal`.
- `processRegisterSignal`:
  - always replies `registered` with `calls` + `activeCalls` (filtered by
    uid+`contractId`).
  - no further work when there are no calls; otherwise `reactToUnknownCall` per call
    (`allSettled`).
- `reactToUnknownCall`:
  - skips `hangup` calls and calls where uid has no role.
  - **refresh detection**: signed actor whose `contractId===oldContractId` →
    `hangupDetachedCall` reason `'unknown'` (a browser refresh).
  - unsigned actor → `renewCallId`.
  - non-active call → sends `'trying'` notification to the *other* user actor.
  - when `requestSignals`, replays `getSignalsForExistingCall`.
- `processRequestCallSignal`:
  - existing requested call short-circuits (see `getExistingRequestedCall`).
  - `hasUnfinishedCallsByUid` → reject `busy`.
  - service selection: prefers `'webrtc'` from `supportedServices`, else first entry;
    features default to `DEFAULT_CALL_FEATURES`.
  - emits a `callRequest` with a well-formed `InternalCallParams`.
- `getExistingRequestedCall` (each branch throws via `rejectCallRequest`, so assert the
  emitted `rejected-call-request` + thrown reason):
  - `requestedCallId` matching a real `_id` → `invalid-call-id`.
  - no matching requested call → `null`.
  - matched call in `hangup` → `invalid-call-id`.
  - `caller.contractId` mismatch → `existing-call-id`.
  - unsupported service → `unsupported`.
  - non-pending state → `already-requested`.
  - otherwise resends `new` signal and returns the call.

**`internal/agents/UserActorAgent.ts`** — mock models; inject fake server (capture
`sendSignal`/`sendPushNotification`).
- `onCallAccepted`: only sends when `getStateNotification` yields `'accepted'`; caller
  stops there; callee additionally sends `answer` push + initial offer signal (when one is
  available; logs + returns when not).
- `onCallEnded`: callee sends `end` push; both send `hangup` notification.
- `onCallActive`: sends `active` notification.
- `onCallCreated`: sends `new` signal; callee sends `new` push.
- `onRemoteDescriptionChanged` — the negotiation-forwarding matrix:
  - no-op when call missing / not `isBusyState`.
  - no-op when the actor has no `contractId` (never send SDP to an unsigned actor).
  - no-op when negotiation missing.
  - **offerer === this.role**: no offer → send `request-offer`; offer but no answer →
    return; offer+answer → send `remote-sdp` with the **answer** + `answerStreams`.
  - **offerer !== this.role**: no offer → return; offer present → send `remote-sdp` with
    the **offer** + `offerStreams`.
- `onCallTransferred`: no-op unless `transferredBy` && `transferredTo` && signed actor;
  otherwise `server.requestCall` with parent linkage + `call.features`.
- `onDTMF`: no-op for internal calls (logs only).

**`internal/agents/CallSignalProcessor.ts` (`UserActorSignalProcessor`)** — the WebRTC
"perfect negotiation" brain. This deserves the densest coverage.
- constructor derives `signed` / `ignored` from actor `contractId` vs the signal's.
- `processSignal` dispatch table for every `type`: `local-sdp`, `answer`, `hangup`,
  `local-state`, `error`, `negotiation-needed`, `transfer`, `dtmf`.
- `saveLocalDescription`: no-op when not `signed`; else `mediaCallDirector.saveWebrtcSession`.
- `processAnswer` → `ack`/`accept`/`unavailable`/`reject`:
  - `clientIsReachable` (`ack`): callee in `'none'` → `startRingingById` (+ reschedule when
    modified); signed caller → `startFirstNegotiation` then `request-offer`.
  - `clientHasAccepted`: `validatePendingCallee` gate then `acceptCall` with features
    (default when absent).
  - `clientIsUnavailable`: ignored when unsigned; else hangup `'unavailable'`.
  - `clientHasRejected`: `validatePendingCallee` gate then hangup `'rejected'`.
  - `validatePendingCallee`: false (or throws when `throwIfSkipped`) for non-callee or
    non-pending state.
- `processError`:
  - ignored when unsigned.
  - `service` error → `service-error`, but **return without hangup** when
    `isPastNegotiation()` (`active`/`hangup`).
  - non-critical → return; `signaling` critical → `signaling-error`; then hangup.
- **`processNegotiationNeeded` (polite/impolite matrix)** — table-test all branches:
  - unsigned → ignore.
  - no latest negotiation → ignore.
  - latest has an answer → `startNewNegotiation`.
  - request not from latest (`oldNegotiationId !== latest._id`):
    - polite request (`role!=='caller'`) → ignore (existing renegotiation wins).
    - impolite request + latest impolite (`offerer==='caller'`): if latest already has an
      offer → error+ignore (duplicate/proxy); else resend `request-offer` for latest.
    - impolite request + latest polite → `startNewNegotiation`.
  - request from latest (`comingFromLatest`):
    - `role===offerer` → error+ignore (not their turn).
    - impolite request → `startNewNegotiation`.
    - polite request while impolite pending → error+ignore.
- `startNewNegotiation`: starts a negotiation for `this.role` then `request-offer` when an
  id is returned.
- `processCallTransfer`: no-op unless `isBusyState`; else `mediaCallDirector.transferCall`
  with the merged signed self.
- `processDTMF`: forwards to `oppositeAgent.onDTMF` (default duration 2000).
- `reviewLocalState`: unsigned → no-op; `clientState==='active'` with `negotiationId` →
  `setStableById` (fire-and-forget, errors swallowed); activates the call when not already
  `activatedAt`.

**`base/BaseCallProvider.ts`** — `callId` getter; `reactToCallChanges` default (logs, no
throw). Trivial.

### Tier 4 — SIP stack (mock `drachtio-srf`)

Highest coupling and hardest to test. `jest.mock('drachtio-srf')` with a fake `Srf`
exposing `on/use/invite/connect/disconnect/createUAC/createUAS`, plus fake
`Dialog`/`req`/`res` objects. Mock models + `mediaCallDirector` + cast director. These are
lower priority than Tiers 1–3 but the state machines carry real bugs.

**`sip/Session.ts` (`SipServerSession`)**
- constructor uses default settings, stays disconnected until configured.
- `getExtensionUri`: throws when no host; formats `sip:<ext>@<host>[:<port>]` (port omitted
  when falsy).
- `geContactUri`: precedence `sipExtension` → `sip`-type id → `user-<username>` →
  `user-<id>` → `'unknown'`.
- `isEnabledOnSettings`: true only when `sip.enabled` && drachtio `host` && `secret`.
- `configure`: stores settings; connects drachtio only when enabled and never connected
  before (`wasEverEnabled` guard — connecting twice is a no-op).
- `processInvite`: replies `SERVICE_NOT_AVAILABLE` when disabled; on error forwards a
  `SipError`'s code to `res`; registers the call on success.
- `reactToCallUpdate`: no-op for unknown call id; else forwards to
  `sipCall.reactToCallChanges` (rejection logged not thrown).
- `stripDrachtioServerDetails`: removes `_agent/socket/_req/_res`.

**`sip/providers/BaseSipCall.ts`**
- `reactToCallChanges`: returns early when `lastCallState==='hangup'` or call not found;
  only reflects when the agent represents a signed actor whose `contractId===sessionId`.
- `sendDTMF`: issues an INFO request with the `application/dtmf-relay` body.

**`sip/providers/IncomingSipCall.ts`**
- `processInvite`: rejects non-new invites (`NOT_IMPLEMENTED`); resolves callee from
  `calledNumber` (unavailable/not-found paths); busy check; external-permission check;
  builds caller contact from SIP headers (`X-RocketChat-Caller-*` precedence); creates the
  call + first negotiation with the offer; registers a first inbound renegotiation; notifies
  the callee agent.
- `reflectCall` routing: DTMF while dialog exists → `sendDTMF`; transfer → REFER path;
  ended → cleanup; busy → `processNegotiations`.
- `processNegotiations` / `getPendingInboundNegotiation` / `processCalleeNegotiation`:
  first negotiation with an answer → `createDialog`; later ones → `res.send(200, sdp)`;
  callee-initiated → `dialog.modify` then `saveWebrtcSession`.
- `processTransferredCall`: builds REFER `Refer-To`/`Referred-By`; on failure hangs up
  `'sip-refer-failed'`; `processedTransfer` guard.
- `processEndedCall`: maps `hangupReason` to SIP codes
  (`service-error→NOT_ACCEPTABLE_HERE`, `rejected→DECLINED`, else
  `TEMPORARILY_UNAVAILABLE`); cancels pending invites; destroys dialog once.
- `cancel`/`uas.destroy` handlers hang up the call.

**`sip/providers/OutgoingSipCall.ts`**
- `createCall`: pre-signs callee with `sessionId`; validates agents; filters features to
  `SIP_CALL_FEATURES`; registers the call; notifies caller agent.
- `reflectCall` routing incl. first-time `createDialog` when `lastCallState==='none'`.
- `createDialog`: guards re-entry; requires a negotiation offer; `startRingingById`;
  provisional/request callbacks; on failure maps SIP error → hangup reason
  (`getSipErrorCode`/`getHangupReasonForSipErrorCode`: `DECLINED`/`UNWANTED`→`rejected`,
  `NOT_ACCEPTABLE_HERE`→`service-error`); on success wires destroy/modify handlers and
  `acceptCall` with the remote SDP answer.
- `processNegotiations`/`processCalleeNegotiations`: caller-offer → `dialog.modify` →
  `saveWebrtcSession`; failure → `hangupDetachedCall('renegotiation-failed')`;
  callee-initiated → `res.send(200)`.
- `processTransferredCall` / `processEndedCall` / `cancelAnyPendingRequest` analogous to
  incoming.

### Tier 5 — Integration-style wiring

A handful of specs that exercise real modules together (real `mediaCallDirector` +
`InternalCallProvider` + `UserActorAgent` + `GlobalSignalProcessor`), mocking only
`@rocket.chat/models` (Pattern A/B) and capturing emitter output. These validate the
seams the unit tests stub. Candidate scenarios:

1. **Internal call happy path**: `request-call` → created → callee `ack` (ringing) →
   caller `ack` (first negotiation + offer request) → callee `accept` → offer/answer
   exchange via `local-sdp` → `local-state active` → `callActivated`. Assert the exact
   ordered sequence of `signalRequest` events and the negotiation writes.
2. **Reject / unavailable / busy** rejection flows end-to-end.
3. **Hangup from each side**, and **hangup `another-client`** bypassing the contract check.
4. **Transfer**: `transfer` signal → new call created with `parentCallId` → parent hung up
   with reason `'transfer'`.
5. **Register after refresh**: `register` with `oldContractId` on an active call →
   detached hangup + `registered` reply.
6. **Expiration**: create a call, advance fake timers past `EXPIRATION_CHECK_TIMEOUT`,
   assert `hangupByServer('expired')`.

---

## 4. Testability notes & recommended (small) refactors

None are required, but each materially lowers test cost and is low-risk:

- **`CallDirector` module-level `scheduledExpirationChecks` map + `EXPIRATION_TIME`
  constant.** Timers persist across tests. Add fake timers everywhere, and ideally expose a
  test-only `clearAllScheduledExpirationChecks()` (or accept the map/timeout as injectable)
  so suites can reset. Making `EXPIRATION_TIME` injectable would remove the need to advance
  120 s of fake time.
- **Import-time construction in `configuration.ts` (`new Srf()` via `SipServerSession`).**
  Consider lazily constructing the SIP session (or guarding `new Srf()` behind
  `configure`) so importing the package doesn't require `drachtio-srf`. Until then, every
  spec on that path must `jest.mock('drachtio-srf')`.
- **Global injected singletons.** Provide a `resetInjection()` helper (or have specs snapshot
  and restore in `afterEach`) to prevent cross-test leakage of `setMediaCallServer`/
  `setCastDirector`.
- **`Date.now()` / `randomUUID()` / `Random.id()`.** Use `jest.useFakeTimers({now})` and,
  where a stable id is asserted, spy on `crypto.randomUUID` / `Random.id`.
- **Open question to resolve before Tier-2/5 specs:** confirm the exact `@rocket.chat/models`
  method surface this package calls (`MediaCalls.activateCallById`, `acceptCallById`,
  `startRingingById`, `transferCallById`, `hangupCallById`, `setExpiresAtById`,
  `findAllExpiredCalls`, `findAllNotOverByUid`, `hasUnfinishedCallsByUid`,
  `findOneByCallerRequestedId`, `MediaCallNegotiations.findLatestByCallId`,
  `setOfferById`/`setAnswerById`/`setStableById`, `Users.findOneByFreeSwitchExtension`,
  …) so the mocks match real signatures and integration (Pattern C) is viable.

---

## 5. Sequencing & coverage targets

| Phase | Scope | Effort | Outcome |
| --- | --- | --- | --- |
| 0 | Harness (§2) + one trivial spec (`getCallRoleForUser`) green | ~0.5 day | CI runs `media-calls` unit tests |
| 1 | Tier 1 pure functions + `src/tests/fixtures.ts` builders | ~1 day | Signal-shaping contract locked; high line coverage on `signals/`, `stripSensitiveData`, `getCallRoleForUser`, `getDefaultSettings`, `BaseAgent` |
| 2 | Tier 2 (`CallDirector`, `CastDirector`, `MediaCallServer`, `InternalCallProvider`, `injection`, `BroadcastAgent`) | ~3–4 days | Lifecycle + routing/permission matrix + timers covered |
| 3 | Tier 3 signal state machines (`GlobalSignalProcessor`, `UserActorAgent`, `UserActorSignalProcessor`) | ~4–5 days | Perfect-negotiation + signal dispatch covered — the correctness core |
| 4 | Tier 5 integration scenarios | ~2 days | End-to-end call flows verified across real modules |
| 5 | Tier 4 SIP providers/session (mocked drachtio) | ~4–5 days | SIP bridge state machines covered |

Suggested coverage gates once Phases 1–3 land: enforce a per-package threshold in
`jest.config.ts` (`coverageThreshold`) — start modest (e.g. 60% lines / 50% branches) and
ratchet up as Tiers 4–5 land. The pure-logic and orchestration modules should reach
80 %+ branches; SIP will lag and can carry a lower target initially.

Phases 1–3 deliver the bulk of the value (the protocol logic that clients depend on) and
need no `drachtio-srf` and no live Mongo. Do them first.
