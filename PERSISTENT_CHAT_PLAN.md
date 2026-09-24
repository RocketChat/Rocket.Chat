# Porting `19b9cb2043f` onto `feat/pexip-integration` — implementation plan

**Goal:** everything the dropped commit explicitly implemented behaves exactly as it did there.

Companions: [`PERSISTENT_CHAT_REIMPL.md`](PERSISTENT_CHAT_REIMPL.md) (what the commit did, §-numbered —
referenced throughout as `§n`) and [`PERSISTENT_CHAT_CURRENT_BASE.md`](PERSISTENT_CHAT_CURRENT_BASE.md)
(what the base already has).

**Ground rules**

- `git show 19b9cb2043f -- <path>` is the reference for every step. Port the *behaviour*, not the diff.
- Never reintroduce the §5.9 logging/`try`-`catch` wrapping. It changed nothing and caused most of the conflicts.
- `call.users` now means **membership**, not "people who joined". Every read the commit added or modified
  needs an explicit predicate — see **D6**.
- Phases 1–5 are server/shared and land independently. Phase 6 is the only one needing a package refactor.

---

## Decisions taken

Twelve places where "exactly as before" needed a judgement. Each is reversible; change them here, not mid-port.

| # | Conflict | Decision |
| --- | --- | --- |
| **D1** | `add-participants` exists on both sides with different meanings (§3) | Leave the base's alone. Port his semantics by extending **`share-chat`** with an optional explicit `users` list. Same inputs, same outputs, no collision. |
| **D2** | `SKIP_DISCUSSIONS_ON_CHANNEL_CONFERENCES = true` (§5.6) | **Port it.** Pierre's call: it is a temporary DMV fix due for removal, so it stays a constant in the source rather than becoming deployment configuration. Gate only the two `maybeCreateDiscussion` call sites, exactly as the original did — the narrowest possible blast radius, and a one-line revert when it goes. It knowingly disables the merged feature's `main_room` auto-creation while set. See step 3.3 for the thread-mode caveat. |
| **D3** | `VideoConferenceWithDiscussion` aggregation vs the base's index (§1.3) | Keep his aggregation. `$match`/`$sort`/`$skip`/`$limit` are pushed into the query layer ahead of `$lookup`, so the base's `{discussionRid: 1, createdAt: 1}` index still serves the OR-merge and `$lookup` runs on ≤25 docs. No performance given up. |
| **D4** | His access checks vs `Authorization.canAccessConference` (§3.2) | Adopt the base's. It's a superset — membership alone grants access — so nothing he allowed is now refused. His external-conference escape hatch becomes dead code; drop it. |
| **D5** | `discussionUpdated` vs `updated` stream (§4.1–4.2) | Adopt `updated`. It fires on a superset of his events and the handler is an idempotent refetch, so outcomes are identical. Delete his event, streamer entry and `notifyVideoConference`. |
| **D6** | `call.users` semantics | At each site his commit added or changed, restore joined-only semantics with `hasJoinedVideoConference` / `isInVideoConference` from core-typings. Sites listed in step 3.9. |
| **D7** | `audioNotificationValue: '' `(his) vs `'none'` (base) | Keep `'none'`. His `''` makes a call announce itself with the new-message sound on top of the ringtone; that's a bug, not behaviour worth preserving. |
| **D8** | Second discussion fork drops room members joined since the first (§5.3) | Restore his union: members of `call.rid` **∪** current `discussionRid` subscribers **∪** the new usernames. |
| **D9** | Should added participants become conference *members*? | No — preserve his. They were room members only, and `listJoinableCalls` matches `discussionRid` subscriptions, so they still discover the call through the navbar dropdown. (§12.1's banner is therefore genuinely unnecessary — see step 10.6.) |
| **D10** | Conference window (§7) | Fold into `ConferenceWindow`/`CallPanel`, keeping his deliberate defaults: chat panel **open on arrival**, panel docked on the **left**. Drop `SideRail` — `CallPanel` is a superset except for the toggle handoff, which ports as a flag. |
| **D11** | Preflight | His page auto-joined with `{mic: true, cam: false}`; the base shows a preflight. Pexip's capabilities are `{mic: false, cam: false}`, so its preflight would offer no device choice at all. Preserve his: auto-join when the provider offers no device capabilities. Contained behind one context flag (step 6.6). |
| **D12** | §11 avatar stack counts non-joined members | Filter with `hasJoinedVideoConference` so the count matches what his rendered. |

---

## Phase 1 — Typings and model

> `packages/core-typings`, `packages/model-typings`, `packages/models`. Lands alone.

**1.1** `core-typings/src/IVideoConference.ts` — add to `IVideoConference`:
`sipAlias?: string`, `sipParticipantCount?: number`, `webrtcParticipantCount?: number`.

**1.2** Same file — add `VideoConferenceWithDiscussion = VideoConference & { discussionTitle?: string; discussionLastMessage?: IMessage }`.

**1.3** `models/src/models/VideoConference.ts` — add a fourth index, keeping all three existing ones:
```ts
{ key: { providerName: 1, sipAlias: 1 }, unique: true, partialFilterExpression: { sipAlias: { $exists: true } } }
```

**1.4** Replace `findPaginatedByRoomId` with the aggregation from §1.3 of the reference doc. Keep the base's
`$or: [{ rid }, { discussionRid: rid }]` match (already there, same as his). Return
`FindPaginated<AggregationCursor<VideoConferenceWithDiscussion>>`; update `IVideoConferenceModel` to match.
Only one caller (`VideoConf.list`), so the blast radius is one line.

**1.5** `createGroup` — **keep `ringing` required** (the base still requires it; his branch had dropped it) and add
optional `sipAlias` / `discussionRid`, conditionally spread.

**1.6** Add `$unset: { sipAlias: true }` to `setEndedById`, and to `setDataById` / `setStatusById` when the status
is `EXPIRED | ENDED | DECLINED`. Narrow `setDataById`'s parameter to `Partial<Omit<VideoConference, '_id' | 'sipAlias'>>`.

**1.7** Add `setSipAliasById`, `unsetSipAliasById`, `findOneByProviderNameAndSipAlias`,
`increaseSipParticipantCount`, `increaseWebRTCParticipantCount` — verbatim from the commit. Declare all five on
`IVideoConferenceModel`.

**1.8** Extend `packages/models/src/models/VideoConference.spec.ts` (the base has one) with cases for alias
uniqueness, alias release on each terminal status, and the `$lookup` projection.

*Skip §1.2 entirely — `INotification` is already merged byte-for-byte.*

---

## Phase 2 — Settings

> `apps/meteor/server/settings/pexip.ts`, `packages/pexip/src/definition/PexipSettings.ts`. Lands alone.

**2.1** Change the `Pexip_Integration_Meeting_Url` default to
`/webapp/conference?conference={callId}&join=1`. (Affects fresh installs and unset values only.)

**2.2** Add section `Pexip_Integration_SIP`: `Pexip_Integration_SIP_AddAlias` (boolean, public, `false`),
`Pexip_Integration_SIP_Host` (string, public, `''`), `Pexip_Integration_SIP_Port` (int, public, `5060`).

**2.3** Add section `Pexip_Integration_PersistentChat` with `Pexip_Integration_PersistentChat_ExternalRoom`
(`roomPick`, public, `''`).

**2.4** `getPexipSettings()` += `sip: { addAlias, host, port }`; mirror on the `PexipSettings` type.

**2.5** *Optional, not from the commit.* Registering `VideoConf_Persistent_Chat_Mode` would close the gap where
the base reads it in two places and registers it nowhere. **Given D2, don't** — registering it invites someone to
set `'thread'`, which the ported constant does not suppress (step 3.3b). Leave it to part 3/4, by which point the
constant should be gone.

---

## Phase 3 — Server service

> `apps/meteor/server/services/video-conference/service.ts`, `packages/core-services`, `server/lib/videoConfProviders.ts`.

**3.1** Port `makeSipAlias()` verbatim — including the rejection sampling (`< 252` → 1–9 for the first digit,
`< 250` → 0–9 after). The bias avoidance is the point; don't simplify it to `% 10`.

**3.2** Port `addSipAlias(callId, attempt = 0)` with the 20-attempt `E11000` retry, and
`maybeAddSipAliasToCall(callId, providerName)` gated on `providerName === 'core.pexip'` **and**
`Pexip_Integration_SIP_AddAlias`.

**3.3** Call `maybeAddSipAliasToCall` in `startDirect` and `startGroup`, immediately after the record is created
and **before** `runNewVideoConferenceEvent`.

**3.3b** **(D2)** Port the constant verbatim, keeping its comment so its provenance and temporariness survive:

```ts
// temp fix for DMV project: skip Discussions when starting new conferences from rocket.chat
const SKIP_DISCUSSIONS_ON_CHANNEL_CONFERENCES = true;
```

Wrap the two existing `maybeCreateDiscussion` calls — `service.ts:850` in `startDirect` and `:953` in
`startGroup`, the same two sites the original gated:

```ts
if (!SKIP_DISCUSSIONS_ON_CHANNEL_CONFERENCES) {
    await this.maybeCreateDiscussion(callId, user);
}
```

Gate **nothing else**. Specifically, leave `isPersistentChatEnabled()` and `chatLivesInAThread()` alone:
`autoFollowCallThread*` has four further call sites (`:868`, `:974`, `:1013`, `:1308`) and suppressing those
would go beyond what the original did. Fork-on-demand (`shareChatWithMembers` →
`createConferenceDiscussionWithParticipants`) is likewise untouched, which matches the original — it never
gated that path.

> **Caveat to leave in the code.** This suppresses discussions, not threads. Today that is moot, because
> `VideoConf_Persistent_Chat_Mode` is unregistered and both sides default to `main_room` — but once part 3/4
> registers it, setting it to `'thread'` gives conferences a persistent chat again with this constant still
> `true`. Note it beside the constant so whoever lands 3/4 sees it. If you want the flag to mean "no persistent
> chat at all" at that point, the one-line version is an early `return false` in `isPersistentChatEnabled()` —
> but that is deliberately *not* what the original did, so it stays out until someone asks for it.

**3.4** Port `getRidForExternalConference()` — reads `Pexip_Integration_PersistentChat_ExternalRoom`, which is a
`roomPick` array; returns the first entry's `_id` or `null`.

**3.5** Extract `createDiscussionForConferenceData(name, rid, createdBy): Promise<string>` out of
`createDiscussionForConference`, leaving the latter to resolve the user, delegate, then call
`assignDiscussionToConference`. The scheduled path needs a discussion created *before* a conference record exists.

**3.6** Port `addUserToConferenceDiscussion(conference, uid)` — `Room.addUserToRoom`, errors logged and swallowed.

**3.7** Port `initializeOrJoinScheduledConference(sipAlias, uid)` verbatim: feature gate →
`findOneByProviderNameAndSipAlias` → join existing discussion and return, or resolve the external room, create the
discussion, `createGroup({ ..., title: sipAlias, sipAlias, discussionRid })`. Keep the `// TODO: custom title`.

**3.8** Port `makePersistentChatUrlForConference(conferenceId)` → `` `${Site_Url}/conference/${conferenceId}` ``.

**3.9** **(D6)** Fix the `call.users` reads the commit introduced or changed:
- the external-conference escape hatch in his `add-participants` → deleted outright by D4, no fix needed;
- the stream `allowRead` → deleted by D5;
- `VideoConfListItem`'s `joinedUsers` → handled in step 9.4.

Then audit for any read you carry over: `hasJoinedVideoConference` for "ever joined", `isInVideoConference` for
"in the call now".

**3.10** **(D8)** In the base's `createConferenceDiscussionWithParticipants`, widen `existingMembers` to the union
of `call.rid`'s members and the current `discussionRid`'s subscribers, so a second fork can't drop anyone.
Add a spec case.

**3.11** §5.7 provider plumbing, all four:
- make `joinCall` `public`;
- add the `requireCallUrl` assertion helper;
- `getUrl` → `provider.customizeUrl(call, userData, options)` (line ~1157 — mic/cam are currently dropped for
  `core.pexip`);
- `runOnUserJoinEvent` → `return provider.onUserJoin(call, user)` instead of returning early.

**3.12** §5.8 — `videoConfProviders.getProviderCapabilities('core.pexip')` → `this.getPexipHandler().capabilities`.

**3.13** `IVideoConfService` — declare `joinCall`, `getRidForExternalConference`,
`makePersistentChatUrlForConference`, `initializeOrJoinScheduledConference`, and widen `list` to
`VideoConferenceWithDiscussion[]`. Do **not** add `createConferenceDiscussionWithParticipants` /
`addUsersToConferenceRoom` — they stay private behind `shareChatWithMembers`.

**3.14** Extend `shareChatWithMembers(uid, callId, mode, users?)` **(D1)**: when `users` is given, skip the
`membersWithoutAccess` derivation and the empty early-return, and pass it straight through to whichever of the two
private methods `resolveChatAccessMode` selects. Behaviour with `users` omitted is unchanged.

---

## Phase 4 — `packages/pexip`

> Entirely additive; nothing here exists on the base.

**4.1** Add `@rocket.chat/core-typings` to `packages/pexip/package.json` (+ `yarn.lock`).

**4.2** New `src/endpoints/endpoint.ts` — `PexipEndpoint` with `getIdentificationFromAlias`,
`normalizeSipExtension`, `getCallByIdentification` (all-digits → alias lookup first, else `findOneById`).

**4.3** `serviceConfiguration.ts` — extend `PexipEndpoint`, drop the local `getIdentificationFromAlias`, read
`protocol` off the request, resolve via `getCallByIdentification` so a SIP alias resolves as well as a call id.

**4.4** `eventSink.ts` — extend `PexipEndpoint`; turn `post()` into a switch over `conference_ended` and
`participant_connected`. Port `processParticipantConnected` (ignores missing `destination_alias` and
`call_direction !== 'in'`, fire-and-forget) and the two counters. `ConferenceEndedEventData` and
`ParticipantStatusEventData` already exist in `src/definition/EventSinkRequest.ts` — just import them.

**4.5** `videoConfProvider.ts`:
- `generateUrl` → `` `${baseUrl}${relativeUrl}` ``; delete `getDiscussionUrl`, `getDiscussionRoute`,
  `joinUrlParams`, `joinUrlAndParams`, `getBaseURLWithoutTrailingSlash`;
- rewrite `customizeUrl(call, user, options?)` on `URL`/`searchParams` — `name`, `muteMicrophone` when
  `options.mic === false`, `muteCamera` when `options.cam === false`, `pin`;
- `getVideoConferenceInfo` → print `` `${siteUrl.replace(/\/+$/, '')}/conference/${call._id}` ``;
- add `onUserJoin(call, user?)`.

---

## Phase 5 — REST

> `packages/rest-typings`, `apps/meteor/server/api/v1/videoConference.ts`.

**5.1** New `VideoConfJoinScheduledProps.ts` — `{ sipAlias: string }` + `isVideoConfJoinScheduledProps`. Export it.

**5.2** Add `users?: string[]` to `VideoConfShareChatProps` and its ajv schema **(D1)**.

**5.3** Register `POST /v1/video-conference.join-scheduled` → `{ callId: string }`, auth required, rate limit
15 / 3 s, calling `VideoConf.initializeOrJoinScheduledConference`.

**5.4** Widen `/v1/video-conference.list`'s response type to `VideoConferenceWithDiscussion[]`.

**5.5** Do **not** touch `video-conference.add-participants`, and do not port his access-check widening on
`join`/`info` **(D4)** — `loadAccessibleConference` already covers both.

---

## Phase 6 — The conference window

> `packages/ui-conference`, `apps/meteor/client/views/conference`. The only phase needing a package change.
> Per **D10**: fold into `CallPanel`, keep his defaults.

**6.1** *Lift the panel state.* Move `activePanel` / `togglePanel` out of `ConferenceWindow` into
`ConferenceProvider`, exposed on `ConferenceContextValue` as
`panel: { active: 'chat' | 'members' | undefined; toggle(p); set(p) }`. Carry the `thread.close()` coupling with
it. `ConferenceWindow` reads it instead of owning it. This is what lets a provider-side hook both observe and
drive the chat panel — the plugin bridge must stay mounted while the panel is closed, so it cannot live in
`slots.chat`.

**6.2** *Dock side.* Add `dock?: 'start' | 'end'` to `CallPanel` (default `'end'`, so nothing else changes) and
have `ConferenceWindow` render the panel before or after the iframe accordingly. Set `'start'` for `core.pexip`
to reproduce his left-hand placement. Sheet mode ignores it.

**6.3** *Plugin bridge.* Port `usePexipPlugin` verbatim to
`apps/meteor/client/views/conference/hooks/usePexipPlugin.ts` and mount it in `ConferenceProvider`, fed by
`session.url` and the lifted panel state. Keep the origin check exactly as written — it must accept
`event.origin === 'null'`, because the plugin runs in a sandboxed sub-frame with an opaque origin.

**6.4** *Toggle handoff.* Add `session.providerOwnsChatToggle?: boolean`, set from `usePexipPlugin().connected`.
`ConferenceWindow` hides its own chat `IconButton` when true — reproducing his rail button disappearing once
Pexip's in-meeting toolbar draws its own. The members button stays.

**6.5** *Chat open on arrival.* `ConferenceProvider` initialises `panel.active` to `'chat'` for `core.pexip`,
`undefined` otherwise.

**6.6** *Auto-join* **(D11)**. Add `session.autoJoin?: boolean`, true when the provider reports no device
capabilities (`!capabilities.mic && !capabilities.cam`). When set, `ConferenceWindow` calls
`actions.join({ mic: true, cam: false })` in an effect instead of rendering `ConferencePreflight` — his exact
join arguments.

**6.7** *Dial-out.* Extend `ConferenceUserPicker` with his synthetic `rcx-first-option-` phone entry
(`phone-out` icon, typed text as label) and thread `actions.dialOut` through from `usePexipPlugin`.

**6.8** *Keep-history.* Add his checkbox to `AddParticipantsModal`, hidden for DMs. On submit: dial each number,
then call `share-chat` with `{ callId, mode: keepHistory ? 'invite' : 'discussion', users }` **(D1)**, then
invalidate `videoConferenceQueryKeys.conference(callId)`. Per **D9** do *not* also call `add-participants` —
he added room members, not conference members.

**6.9** *Disconnect countdown.* Port `ConferenceDisconnectedModal` verbatim (10 s, "Keep open" / "Close",
auto-close at zero) and wire it to `usePexipPlugin`'s `onDisconnected`. Close through the base's
`closeCallWindow()` from `lib/callWindow.ts` rather than his inline branch — it handles the desktop bridge, the
browser, *and* a `ROOT_URL_PATH_PREFIX`-correct `/home` fallback.

**6.10** Delete nothing of his that isn't replaced: `SideRail*`, `ConferenceEmbeddedPage`, `ConferenceIframe`,
`ConferenceRoom`, `ConferenceRoomPreload`, `ConferenceChat`, `ConferenceRedirectPage`, `useConferenceCallUrl` and
`useConferenceEmbedded` all have live equivalents on the base and are simply not ported.

**6.11** Update `ConferenceWindow.stories.tsx` and `CallPanel`'s stories for the new `dock` prop and the hidden
toggle; add a spec for `providerOwnsChatToggle` and one for `autoJoin`.

---

## Phase 7 — The scheduled route

**7.1** Port `useConferenceScheduled(sipAlias)` verbatim — query
`['conference-scheduled', sipAlias]` → `POST /v1/video-conference.join-scheduled`.

**7.2** Port `ConferenceScheduledPage` — `<ConferenceWindow>` on success (via `ConferenceProvider`, matching the
base's composition), `<ConferencePageError />` on error, `<PageLoading />` while pending.

**7.3** Add the branch to the base's `ConferenceRoute`, *before* the plain `id` branch:
```
callUrl            → ConferencePage            (base, unchanged)
id === 'new' && rid→ ConferenceStartPage       (base, unchanged)
id && scheduled    → ConferenceScheduledPage   (new)
id                 → ConferenceWindow          (base, unchanged)
```
Read `scheduled` with `useSearchParameter`, as the base reads `callUrl` and `rid`.

---

## Phase 8 — Cross-window navigation

**8.1** Port `useExternalRouteNavigation` verbatim (§12.7) — `NAVIGATE_TO_ROUTE_MESSAGE`, the same-origin
`message` listener, the `RocketChatDesktop.onNavigateToRoute` registration — and mount it in `AppLayout`.

**8.2** Add `onNavigateToRoute?: (cb: (path: string) => void) => void` to `IRocketChatDesktop` (§12.9).
`IVideoCallWindow` already has `openInMainWindow`, so §12.8 needs nothing.

**8.3** **Merge, don't replace, `useConfinedNavigation`.** Keep the base's `isConference()` allowance and its
`_relativeToSiteRootUrl` handling — yours has neither, and without them `/conference/new → /conference/:id`
opens in a tab and `ROOT_URL_PATH_PREFIX` deployments misroute. Replace only the base's `openElsewhere` with his
`openInOpenerOrTab`: desktop bridge → opener `postMessage` + focus-by-name → new tab. Keep the base's
`onOpenThread` parameter. Its existing spec must keep passing; add cases for the three branches.

---

## Phase 9 — Call history (§11)

> Untouched on the base, so this is a straight port against a changed hook shape.

**9.1** `useCallsRoomAction` — `icon: 'history'`, `title: 'Conference_call_history'`, `order: 8`.

**9.2** Extend `mapVideoConfFromApi` to revive `discussionLastMessage` (it currently maps `createdAt`, `endedAt`,
`_updatedAt` and `users` only) — otherwise `MessageBody` gets a serialized message.

**9.3** `VideoConfList` — `Virtuoso` → `GroupedVirtuoso`, ongoing (`!endedAt`) / past (`endedAt`) groups, empty
groups omitted, `VideoConfSectionDivider` as `groupContent`, pagination moved to a `Footer` wrapping
`InfiniteListAnchor`. Fix the error/empty guard as he did (`total === 0 && error`; empty state needs `!error`).
`useVideoConfList`'s `select` already returns `{ videoConfs, total }`, so the consumer shape barely changes.

**9.4** `VideoConfListItem` — drop the avatar/`MessageLeftContainer`, title from `discussionTitle` with his
`VideoConf_Persistent_Chat_Discussion_Name` fallback, `discussionLastMessage?.msg` in the body, the
ongoing/ended button split, `+N` overflow. **(D12)** filter `joinedUsers` with `hasJoinedVideoConference` so the
stack counts what his counted.

**9.5** Port `VideoConfSectionDivider`, `VideoConfList.stories.tsx` and `mocks.ts`.

---

## Phase 10 — Remaining client changes

**10.1** §12.2 — `useVideoConfOpenCall`: the module-level `conferenceWindow` reference and shared
`rocketchat-conference` window name; same-origin URLs focus the existing tab when its live `location.pathname`
matches, otherwise open/navigate it. External provider URLs keep opening plainly.

**10.2** §12.3 — `VideoConfProvider`: on `call/join`, route `core.pexip` to
`absoluteUrl(router.buildRoutePath({ name: 'conference', params: { id: callId } }))`.

**10.3** §12.4 — `MediaCallProvider`: disable when `useCurrentRoutePath()` includes `/conference`.

**10.4** §12.5 — `videoConfJoinDisabled` on `UiKitContextValue`; computed in `useMessageBlockContextValue` from
`routeName === 'conference'`; short-circuits `join`/`callBack`; `VideoConferenceBlock` disables the Join and
Call-again/Call-back buttons and makes "Join discussion" `primary`.

**10.5** §12.10 — `TooltipProvider`: close when `anchor.tagName === 'IFRAME'`.

**10.6** §12.1 — **skip `OngoingConferenceBanner`.** `listJoinableCalls` matches `discussionRid` subscriptions, so
everyone his banner served already sees the call in the navbar's `OngoingCallsDropdown`, with declined/joined
state his banner didn't have. Nothing is lost. *(If you disagree, it ports in ~30 lines against
`useVideoConfList`'s `select` shape.)*

**10.7** §9.6/§9.7 — verify before porting. `narrowRoomStyle` + `RoomProvider embedded` likely already cover the
composer styling, and the standalone route no longer needs the `LayoutWithSidebar` move. Port only what's
demonstrably missing.

---

## Phase 11 — i18n

**11.1** Add the 12 still-missing keys from §13 to `en` and `de`: `__param__Video_Call_Chat`, `Add_participants`,
`Call_chat`, `Conference_call_history`, `Conference_will_close_in_seconds`, `Keep_chat_history`, `Keep_open`,
`Past_calls`, `Unable_to_start_video_call`, `You_have_been_disconnected`, plus
`Conference_started_by__name__` and `Join_ongoing_call` **only if** you find a consumer — both appear unused in
the original diff, and `Join_ongoing_call` is dead under 10.6.

**11.2** Add the 10 Pexip setting keys (`Pexip_Integration_SIP*`, `Pexip_Integration_PersistentChat*`).

**11.3** Already present, don't re-add: `Chat`, `Create_discussion`, `Ongoing_calls`,
`You_were_invited_to_a_conference`, `Join_call`.

---

## Phase 12 — Verification

Behavioural checks, in the order they're cheapest to run:

1. **Alias lifecycle** — start a group call with `AddAlias` on; assert an 8-digit alias with no leading zero,
   unique index enforced, and `$unset` on each of `ENDED` / `EXPIRED` / `DECLINED`.
2. **Alias collision** — force `E11000` twice and assert a retry, then 20 failures and assert `null` + one error log.
3. **Policy server** — `GET` the service-configuration endpoint with `sip:<alias>@host` and with a raw call id;
   both must resolve to the same conference.
4. **Event sink** — post `participant_connected` for `WebRTC` and for `SIP`, `call_direction: 'in'`; assert each
   counter increments and that `call_direction: 'out'` is ignored.
5. **Scheduled** — hit `/conference/<alias>?scheduled=1` as two different users; the first materialises the
   conference in the external room, the second joins the same one and lands in its discussion. This path calls
   `createDiscussionForConferenceData` directly and so is **unaffected** by D2 — assert the discussion is still
   created with the constant `true`, since that is the one auto-creation the original kept.
5b. **D2 gate** — start a group call and a direct call with `VideoConf_Enable_Persistent_Chat = true` and
   `VideoConf_Persistent_Chat_Mode` unset; assert no `discussionRid` is written and the chat panel shows the
   main room. Then assert `share-chat` still forks a discussion on demand.
6. **Join options** — join with `{mic: false}` and assert `muteMicrophone=true` reaches the Pexip URL. This is
   currently broken on the base (step 3.11) and is the easiest regression to miss.
7. **Plugin bridge** — with the plugin connected, assert the window's own chat button is gone, the badge tracks
   unread, `toggle-chat` from the plugin moves the panel, and `disconnected` raises the countdown.
8. **Dial-out** — add a raw number in the modal and assert one `dial-out` message per number, with users in the
   same submission still going to `share-chat`.
9. **Share-chat with explicit users** — both modes; assert the discussion carries room members ∪ prior discussion
   members ∪ new users **(D8)**, and that the notification fires once per user with `requireInteraction` and a
   `join` action.
10. **Confined navigation** — the base's existing spec must still pass, plus: internal link reaches the opener,
    desktop bridge preferred when present, external link opens a tab, `/conference/*` is not intercepted.
11. **Call history** — ongoing and past sections, discussion title and last message, `+N` counting only joined
    members **(D12)**.
12. **Full suite** — `yarn test` in `packages/models`, `packages/pexip`, `packages/ui-conference`, and
    `apps/meteor`'s video-conference specs. The base ships ~2,500 lines of service specs; they are the best
    early warning that a ported change broke the membership model.

---

## Suggested landing order

| PR | Phases | Reviewable alone? |
| --- | --- | --- |
| 1 | 1, 2 | Yes — typings, model, settings |
| 2 | 3, 4 | Yes — depends on 1 |
| 3 | 5 | Yes — depends on 2 |
| 4 | 6 | The risky one; `ui-conference` refactor |
| 5 | 7, 8 | Depends on 6 |
| 6 | 9, 10, 11 | Independent of 4–5; can go in parallel |

Phases 9–11 touch nothing phases 1–8 touch, so PR 6 can run alongside PR 4 if you want the call-history work
off the critical path.
