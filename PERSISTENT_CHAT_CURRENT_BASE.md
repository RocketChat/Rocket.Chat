# The Persistent Chat already on `feat/pexip-integration`

Companion to [`PERSISTENT_CHAT_REIMPL.md`](PERSISTENT_CHAT_REIMPL.md), which inventories the commit
being dropped (`19b9cb2043f`). This one describes **what is already here**, and maps the dropped
commit's 15 sections onto it.

---

## 0. Two features, one name

They are not the same feature and they are not competing:

| | `19b9cb2043f` (dropped) | On this branch (merged) |
| --- | --- | --- |
| **Purpose** | Ship Pexip as a product: SIP dial-in, scheduled conferences, a chat beside the Pexip iframe | Make a conference a first-class Rocket.Chat object: who belongs to it, when it ends, who can read its chat |
| **Driving question** | "How does a desk phone reach this call, and where does its chat live?" | "Membership is not room access — so what?" |
| **Centre of gravity** | `packages/pexip`, SIP aliases, `/conference/:alias?scheduled=1` | `IVideoConferenceUser`, presence leases, `chatAccess` |
| **Chat model** | Discussion created when participants are added | Room / discussion / **thread**, chosen by setting, with an explicit access remedy |
| **Window** | `ConferenceEmbeddedPage` + `SideRail` in `apps/meteor` | `packages/ui-conference`, a whole package of call chrome |

The overlap is real but mostly **mechanical**: both had to solve "render a Rocket.Chat room next to a
call in a window that must not navigate away", and both grew a discussion-forking path. The merged
one solved those more thoroughly. What it does **not** have is anything Pexip-specific.

---

## 1. Where it came from, and what's still missing

```
4bd0d753a68  chore(video-conf): conference data model, server service & API (1/4)  (#41934)
e4e82e71a7f  chore(video-conf): conference window, unmounted (2/4)                 (#41956)
437aab1b60f  regression: video calls failing when forced E2EE meets persistent chat (#41963)
67af48fc493  chore: move canAccessConference to Authorization service              (#42169)
```

**3/4 and 4/4 are not merged.** Two consequences you will hit:

- `VideoConf_Persistent_Chat_Mode` is **read but never registered** — `settings.get` in
  `service.ts:1931` and `useSetting` in `useConferenceEmbedded.ts:53`, with no `settings.add`
  anywhere. Both sides fall back to `'main_room'`. The code comments say the call window registers
  it, i.e. it arrives in a later part.
- `packages/ui-conference` is described in its own commit message as **"unmounted"** — the package
  exists, is fully tested and storybooked, and `ConferenceRoute` does mount `ConferenceWindow`, but
  the surrounding product wiring (settings, the start flow's entry points) is still landing.

`docs/features/video-conference.md` (142 lines, added by 1/4) is the design rationale in prose.
**Read it before touching any of this** — it explains the membership/presence split, the lease model,
the grace period, the ringing rules, the chat-access trade-off table, and the window's theming and
panel/sheet behaviour.

---

## 2. What the merged feature actually models

### 2.1 Membership ≠ presence

`IVideoConferenceUser` grew from "someone who joined" into a full membership record:

```ts
ts          // became a member
joined?     // ever joined       (absent reads as true — pre-existing entries)
joinedAt?
declined?   // dismissed it      (not exclusive with joined)
declinedAt?
leftAt?     // cleared on rejoin, so it describes only the latest departure
leftReason? // 'reported' | 'timeout'
lastSeenAt? // last evidence they were in the call
ringingAt?  // last rung
```

with predicates exported from core-typings: `hasJoinedVideoConference`, `isInVideoConference`,
`isRingingVideoConferenceMember`, plus `VIDEO_CONF_RINGING_WINDOW_MS = 15_000` and
`RING_RECIPIENTS_LIMIT = 10`.

**Membership grants no room access.** That single fact drives most of the rest.

### 2.2 Presence leases

`apps/meteor/lib/videoConference/presence.ts`:

- `PRESENCE_HEARTBEAT_MS = 30_000`, `PRESENCE_THROTTLED_HEARTBEAT_MS = 60_000` (hidden-tab timer
  throttling), `PRESENCE_LEASE_TICKS = 3`, `PRESENCE_LEASE_MS = 180_000`
- `expiredPresenceLeases(users, now, leaseMs)` — stamps `leftAt` with **last evidence**
  (`lastSeenAt ?? joinedAt ?? ts`), never the sweep time
- `isPresenceSweepDue(uptimeMs)` — a restarted process waits out a full lease before believing its
  own reads
- `INFERRED_LEAVE_REASONS = ['timeout']` — a renewal undoes a `timeout` departure, never a
  `reported` one

Server side: `renewPresence`, `expirePresenceLeases`, `endCallIfEmpty`, and
`EMPTY_CALL_GRACE_MS = 10_000` so a reload doesn't end the call.
Client side: `useConferencePresenceLease`, `useLeaveConferenceOnClose` (with a `departureFor`
decision table: joined → leave, placing a direct call → cancel, was rung → decline, otherwise
nothing).

### 2.3 Chat access — the part that overlaps most with yours

```ts
type VideoConferenceChatAccess = {
    rid; name; type;
    membersWithoutAccess: IUser['_id'][];
    canInvite: boolean;   // asked of the room directives, not `t === 'd'`
};
type VideoConferenceChatAccessMode = 'invite' | 'discussion';
```

- `getMembersWithoutRoomAccess` — one `Subscriptions` read for ordinary rooms; per-member
  `canAccessRoomIdAsync` only for team channels, discussions and ABAC rooms
- `resolveChatAccessMode({ mode, canInvite })` returns `null` (a **refusal**) rather than silently
  doing the other thing
- `shareChatWithMembers(uid, callId, mode)` → `createConferenceDiscussionWithParticipants` or
  `addUsersToConferenceRoom`
- Surfaced in the UI by `ChatAccessNotice`, `ChatAccessModal`, `ConferenceChatNotShared`, and a
  `balloon-exclamation` button in `ConferenceChat`'s header counting members **currently in the
  call** who can't read it

### 2.4 Three chat locations

`isPersistentChatEnabled()` now also refuses while `E2E_Enable && E2E_Force_Encryption_For_Private_Rooms`
(discussions are created unencrypted — that was the #41963 regression fix).

`getPersistentChatMode()` → `'thread' | 'main_room'`:
- `main_room` → `maybeCreateDiscussion` as before
- `thread` → no discussion; the chat is a thread off the call's own message, with
  `autoFollowCallThread` / `autoFollowCallThreadForAllParticipants`

`useConferenceEmbedded` resolves it client-side into `room.tmid`.

### 2.5 Ringing and joinable calls

`ring`/`decline`/`joinable` endpoints, `ringCalleeOnCallerArrival` (a direct call rings when the
**caller arrives**, not at creation), `shouldRingRecipients(n)` capped at `RING_RECIPIENTS_LIMIT`,
`leaveOtherCalls`, and a `JoinableVideoConference` list type feeding the navbar's
`NavBarItemOngoingCalls` → `OngoingCallsProvider` → `OngoingCallsDropdown`.

### 2.6 Busy status

`claimBusyForCall` / `releaseBusyForCall` — keyed claims that stash and restore the displaced status,
released even on an inferred departure. Never allowed to fail a join.

### 2.7 API surface

```
POST  video-conference.start            POST  video-conference.leave
POST  video-conference.join             POST  video-conference.heartbeat
POST  video-conference.cancel           POST  video-conference.ring
POST  video-conference.decline          POST  video-conference.rename
POST  video-conference.add-participants POST  video-conference.share-chat
GET   video-conference.info             GET   video-conference.joinable
GET   video-conference.list             GET   video-conference.capabilities
GET   video-conference.providers
```

Every one of them gates on `Authorization.canAccessConference(call, uid)`:
**membership, OR access to `call.rid`, OR access to `call.discussionRid`.**

`video-conference.info` now also returns `chatAccess`.

### 2.8 Streams

`'video-conference': [{ key: `${string}/updated`; args: [] }]` — one event, argument-less, meaning
"read the conference again". Broadcast as `video-conference.updated`, relayed by
`ListenersModule`, `allowRead` gated on `canAccessConference`.

### 2.9 `packages/ui-conference`

A new package (~11k lines with tests/stories) holding the whole window as a **context-driven,
server-unaware** component tree: `ConferenceWindow`, `ConferencePreflight`, `ConferenceViewport`,
`CallTopBar`, `CallPanel`, `CallMembersPanel`, `AddParticipantsModal`, `ChatAccessModal`,
`SwitchCallModal`, `OngoingCallsDropdown`, `ConferenceIframe`, plus `panelStyles`
(`CONFERENCE_THEMED_CLASS`, `narrowRoomStyle`) implementing the dark-window/light-rooms and
docked-panel-vs-sheet rules from the doc.

`apps/meteor/client/views/conference/providers/ConferenceProvider.tsx` is the **only** wiring
between it and the workspace — reads, five actions, presence effects, and three slots the product
builds itself (`chat`, `renderUserPicker`, `renderMemberStatus`).

---

## 3. Section-by-section mapping of the dropped commit

Legend — **SUPERSEDED**: already done, better; **MERGED**: already here, effectively identical;
**NET-NEW**: absent, port it; **COLLISION**: the name exists and means something else.

### §1 Data model
| Item | Status |
| --- | --- |
| §1.1 `sipAlias`, `sipParticipantCount`, `webrtcParticipantCount` | **NET-NEW** |
| §1.1 `VideoConferenceWithDiscussion` | **NET-NEW** (see §4.2 below) |
| §1.2 `INotification` `requireInteraction` / `actions` / `payload.conferenceId` | **MERGED** — byte-identical, plus `type`/`name` made optional for ring notifications |
| §1.3 `findPaginatedByRoomId` `$or: [{rid}, {discussionRid}]` | **MERGED** — kept as a plain `findPaginated`, with a `{ discussionRid: 1, createdAt: 1 }` index so the merge is index-ordered |
| §1.3 `$lookup` for `discussionTitle` / `discussionLastMessage` | **NET-NEW** |
| §1.3 unique partial index on `{providerName, sipAlias}` | **NET-NEW** |
| §1.3 `createGroup` accepting `sipAlias` / `discussionRid` | **NET-NEW** |
| §1.3 `setDataById` / `setStatusById` / `setEndedById` `$unset sipAlias` | **NET-NEW** |
| §1.3 `setSipAliasById`, `unsetSipAliasById`, `findOneByProviderNameAndSipAlias`, `increase*ParticipantCount` | **NET-NEW** |

The model grew a lot independently: `addMemberById`, `setUserJoinedById`, `setUserDeclinedById`,
`setUserLeftById`, `setUsersRingingById`, `renewUserPresenceById`, `findActiveWithMembers`,
`setTitleById`. Port your alias methods alongside them, not by rewriting the file.

### §2 Settings — **all NET-NEW**
The Pexip integration on this branch (`c7d77021623`) is the base commit only; it has no SIP section
and no `Pexip_Integration_PersistentChat_ExternalRoom`.

While you're there: **`VideoConf_Persistent_Chat_Mode` is unregistered** (see §1 above). If your work
lands before 3/4, consider registering it — the server already reads it.

### §3 REST
| Item | Status |
| --- | --- |
| §3.1 `VideoConfAddParticipantsProps` | **COLLISION** — exists, but is `{ callId, users, ring? }` |
| §3.1 `VideoConfJoinScheduledProps` | **NET-NEW** |
| §3.1 `list` → `VideoConferenceWithDiscussion[]` | **NET-NEW** |
| §3.2 `join` / `info` access widening | **SUPERSEDED** by `Authorization.canAccessConference` (strictly stronger: membership alone counts, so your external-conference escape hatch is unnecessary) |
| §3.2 `POST add-participants` with `keepHistory` | **COLLISION** — see below |
| §3.2 `POST join-scheduled` | **NET-NEW** |

> ### ⚠ The one real collision
>
> `POST /v1/video-conference.add-participants` exists on both sides and means **different things**.
>
> - **Yours:** `{ callId, users, keepHistory }` → invite into the room, or fork a discussion. It is a
>   *room-access* decision that returns `{ rid }`.
> - **Theirs:** `{ callId, users, ring }` → add **conference members** and optionally ring them. It
>   touches no room at all and returns `{ added: string[] }`.
>
> Your semantics already exist here under a different name: **`POST /v1/video-conference.share-chat`**
> with `{ callId, mode: 'invite' | 'discussion' }` → `{ rid }`. That is the endpoint your
> `AddParticipantsModal`'s keep-history checkbox should call. Do **not** reintroduce your version of
> `add-participants` — adopt the split (add members, then optionally share the chat).

### §4 Services, events & streams
| Item | Status |
| --- | --- |
| §4.1 `video-conference.discussionUpdated` event | **SUPERSEDED** by `video-conference.updated` (argument-less; covers chat moved, access changed, join, decline, leave) |
| §4.2 `'video-conference'` streamer | **SUPERSEDED** — `${callId}/updated` |
| §4.3 `streamVideoConference` + `notifyVideoConference` | **MERGED** — same shape, `allowRead` uses `canAccessConference` instead of a raw `users` scan |
| §4.4 listeners relay | **MERGED** |
| §4.5 `createConferenceDiscussionWithParticipants` / `addUsersToConferenceRoom` on `IVideoConfService` | **SUPERSEDED** — both exist but are **private**; the service exposes `shareChatWithMembers` instead |
| §4.5 `joinCall` public, `getRidForExternalConference`, `makePersistentChatUrlForConference`, `initializeOrJoinScheduledConference` | **NET-NEW** |

### §5 `service.ts`
| Item | Status |
| --- | --- |
| §5.1 SIP alias generation (`makeSipAlias`, `addSipAlias`, `maybeAddSipAliasToCall`) | **NET-NEW** |
| §5.2 `initializeOrJoinScheduledConference`, `getRidForExternalConference`, `makePersistentChatUrlForConference`, `addUserToConferenceDiscussion` | **NET-NEW** |
| §5.3 `createConferenceDiscussionWithParticipants` | **SUPERSEDED** — and improved: it builds from `discussionRid \|\| rid` so a *second* fork doesn't drop everyone added since the first |
| §5.3 `addUsersToConferenceRoom` | **SUPERSEDED** |
| §5.3 `notifyUsersInvitedToConference` | **SUPERSEDED** — refactored into `notifyUsersAboutConference`, which omits `type`/`name` when the recipient can't open the room, and sets `audioNotificationValue: 'none'` so a call doesn't announce itself with the message sound |
| §5.4 `assignDiscussionToConference` broadcast | **SUPERSEDED** — and it now also subscribes **room members who never joined the call**, so they can follow a conversation that moved out from under them |
| §5.5 `getDiscussionDisplayName` | **MERGED** — identical |
| §5.5 `createDiscussionForConferenceData` extraction | **NET-NEW** — still inlined in `createDiscussionForConference`. You need it for the scheduled path (a discussion before the conference record exists) |
| §5.6 `SKIP_DISCUSSIONS_ON_CHANNEL_CONFERENCES` | **absent** — the equivalent knob is `getPersistentChatMode()`. Prefer a setting over a constant; this is the natural place to drop that `// temp fix for DMV project` |
| §5.7 `joinCall` public | **NET-NEW** (still `private`, line 1021) |
| §5.7 `getUrl` passing `options` to the internal provider | **NET-NEW** — line 1157 is still `provider.customizeUrl(call, userData)`, so mic/cam are dropped for `core.pexip` |
| §5.7 `requireCallUrl` assertion | **NET-NEW** |
| §5.7 `runOnUserJoinEvent` calling `provider.onUserJoin` | **NET-NEW** |
| §5.8 `getProviderCapabilities` → `getPexipHandler().capabilities` | **NET-NEW** — still the hardcoded object |
| §5.9 logging / `try`-`catch` wrapping | **moot** — don't port |

### §6 `packages/pexip` — **all NET-NEW**
`PexipEndpoint` base, alias-aware `getCallByIdentification`, `participant_connected` handling, the
`customizeUrl` rewrite, `onUserJoin`, the in-product URL in `getVideoConferenceInfo`. None of it is
here. Note `packages/ui-conference` already exports its own `ConferenceIframe`, so §7.7 is covered —
but nothing knows about the Pexip **plugin**.

### §7 Routing & the conference page — **SUPERSEDED wholesale**
| Yours | Here |
| --- | --- |
| `appLayout.wrap(…, { embedded: true })` | `{ standalone: true }` — same thing, renamed, with a comment on why `embedded` was the wrong word |
| `ConferenceEmbeddedPage` + `SideRail*` | `ConferenceViewport` + `ConferenceProvider` + `ConferenceWindow` + `CallPanel` |
| `ConferenceIframe` | `ui-conference/ConferenceIframe` |
| `ConferenceDisconnectedModal` | no equivalent — but `closeCallWindow()` in `lib/callWindow.ts` has the three-strategy close (desktop bridge → `window.close()` → navigate `/home`), which is strictly better than yours |
| `ConferenceUnauthorizedPage` | exists (kept) |
| `ConferencePageError` | exists (kept) |
| `ConferenceScheduledPage` / `ConferenceRedirectPage` | **NET-NEW** / superseded by the retained `ConferencePage` |

`ConferenceRoute` now branches on `callUrl` → `ConferencePage`, `id === 'new' && rid` →
`ConferenceStartPage`, `id` → `ConferenceWindow`. **Your `?scheduled=1` branch slots in here.**

### §8 Hooks
| Item | Status |
| --- | --- |
| §8.1 `useConferenceCallUrl` | **SUPERSEDED** by `withDisplayName` in `useConferenceEmbedded` — which wraps `new URL` in try/catch, because a throw during render takes the window down |
| §8.2 `useConferenceEmbedded` | **SUPERSEDED** — 261 lines vs your 50; same `{callId}/updated` refetch idea, plus join-as-mutation, `skipToken` cache-held session, rename, departure decision, embedded-provider detection |
| §8.3 `useConferenceScheduled` | **NET-NEW** |
| §8.4 `useConfinedNavigation` | **SUPERSEDED, but yours does more.** Theirs deliberately stops at "open in a new tab" — the comment says the opener/desktop handshake "is worth doing… A tab is the honest one-line version until that earns its own change." Theirs adds an `isConference()` allowance (so `/conference/new` → `/conference/:id` isn't intercepted) and `ROOT_URL_PATH_PREFIX` correctness, which yours lacks. **Merge, don't replace:** keep their `isConference` + site-root handling, add your `openInOpenerOrTab`. |
| §8.5 `usePexipPlugin` | **NET-NEW** |

### §9 The embedded chat room
| Item | Status |
| --- | --- |
| §9.1 `ConferenceChat` | **SUPERSEDED** — chat-access notice, thread support, `Trans`-interpolated room icon |
| §9.2 `ConferenceRoomPreload` | **SUPERSEDED** by `useConferenceSubscription` (`useRoomSubscriptionQuery` + store-ready flags + `subscriptions-changed` watcher) — and deliberately hoisted to the page so the **closed** chat's unread badge still works |
| §9.3 `ConferenceRoom` | **SUPERSEDED** by `ConferenceRoomPanel` — `RoomProvider embedded`, `ModalProviderWithRegion`, thread-over-room, three distinct error states |
| §9.4 `useOpenRoomById` | **MERGED** |
| §9.5 `mapRoomFromApi` | **MERGED** |
| §9.6 `RoomComposer` embedded styling | check — likely superseded by `narrowRoomStyle` + `RoomProvider embedded` |
| §9.7 `MainLayout` / `TwoFactorAuthSetupCheck` `LayoutWithSidebar` move | verify before porting; the standalone route no longer needs it |

### §10 Add participants
`ui-conference/AddParticipantsModal` exists (with spec + stories), wired through
`ConferenceProvider.actions.addParticipants` and `slots.renderUserPicker` →
`ConferenceUserPicker`. It adds **members** and optionally rings them.

**NET-NEW from yours:** the phone-number / SIP dial-out affordance (the `rcx-first-option-` synthetic
option and `onDialOut` → Pexip plugin). The keep-history checkbox should become a `share-chat` call,
which the `ChatAccessModal` already models.

### §11 Call history contextual bar — **all NET-NEW**
Untouched on this branch: `useCallsRoomAction` still reads `icon: 'phone'`, `title: 'Calls'`,
`order: 999`, and `VideoConfList` is still a flat `Virtuoso`. Your grouping, `VideoConfSectionDivider`,
discussion-title/last-message item and `Call_chat` button all still apply.

**But** `useVideoConfList` is now an `useInfiniteQuery` returning `{ videoConfs, total }` via `select`
over pages of `{ items, itemCount }`, mapped through `mapVideoConfFromApi`. Rewrite against that
shape — the `select` already gives you `videoConfs`/`total`, so it's closer than it looks.

### §12 Misc
| Item | Status |
| --- | --- |
| §12.1 `OngoingConferenceBanner` | **NET-NEW** — but reconsider. The merged feature answers "what can I join" with `GET video-conference.joinable` + the navbar `OngoingCallsDropdown`, which is a better fit than a per-discussion banner and already handles declined/joined state |
| §12.2 `useVideoConfOpenCall` shared conference tab | **NET-NEW** |
| §12.3 `VideoConfProvider` routing `core.pexip` to `/conference/:id` | **NET-NEW** |
| §12.4 `MediaCallProvider` disabled on `/conference` | **NET-NEW** |
| §12.5 `videoConfJoinDisabled` in `UiKitContext` | **NET-NEW** |
| §12.6 `useNotification` join action | **MERGED** — and hardened: it checks `event.action === 'join'` so a second action added later can't silently join |
| §12.7 `useExternalRouteNavigation` | **NET-NEW** (the receiving half of §8.4) |
| §12.8 `window.videoCallWindow` | **MERGED** — now a proper `IVideoCallWindow` in `desktop-api` with `openInMainWindow`, `close`, `requestScreenSharing`, `getAuthCredentials`, all non-optional |
| §12.9 `IRocketChatDesktop.onNavigateToRoute` | **NET-NEW** |
| §12.10 `TooltipProvider` IFRAME guard | **NET-NEW** |

### §13 i18n
Already present: `Chat`, `Create_discussion`, `Ongoing_calls`, `You_were_invited_to_a_conference`,
`Join_call`.

Still missing (13 of yours, plus the 10 Pexip setting keys):
`__param__Video_Call_Chat`, `Add_participants`, `Call_chat`, `Conference_call_history`,
`Conference_started_by__name__`, `Conference_will_close_in_seconds`, `Join_ongoing_call`,
`Keep_chat_history`, `Keep_open`, `Past_calls`, `Unable_to_start_video_call`,
`You_have_been_disconnected`, and all `Pexip_Integration_SIP*` / `Pexip_Integration_PersistentChat*`.

---

## 4. What this means for the reimplementation

### 4.1 The scope shrank a lot
Of the dropped commit's 80 files, the genuinely net-new surface is roughly:

1. **SIP** — aliases (model + index + generation + release), `join-scheduled`, the scheduled
   conference route, `PexipEndpoint`, `participant_connected` counting, the SIP settings section
2. **Pexip provider polish** — `customizeUrl` with join options, `onUserJoin`, the in-product URL,
   capabilities from the handler, `getUrl` passing `options` through
3. **The Pexip plugin bridge** — `usePexipPlugin` and dial-out
4. **External conferences** — `Pexip_Integration_PersistentChat_ExternalRoom` and
   `getRidForExternalConference`
5. **Call history** — the whole of §11
6. **Cross-window navigation** — §12.7 + §12.9 + the opener half of §8.4
7. **The small guards** — §12.2, §12.3, §12.4, §12.5, §12.10

Everything else is either already here or here in a better form.

### 4.2 `VideoConferenceWithDiscussion` needs a decision
Your version replaced `findPaginatedByRoomId`'s `find` with an aggregation to `$lookup` the
discussion's title and last message. The merged version kept the `find` and added a
`{ discussionRid: 1, createdAt: 1 }` index specifically so the `$or` can be served by an
index-ordered merge rather than a blocking in-memory sort.

An aggregation with `$lookup` gives that up. Either:
- keep the aggregation and accept the cost (conferences per room are few — probably fine), or
- fetch the discussion rooms in a second query client-side / in the service, keeping the indexed find.

Worth deciding deliberately rather than by diff.

### 4.3 Three names to change before you start
- `add-participants` → use **`share-chat`** for the keep-history/discussion choice (§3)
- `discussionUpdated` → use **`updated`** (§4)
- `embedded` → the layout flag is **`standalone`** (§7)

### 4.4 Read the doc first
`docs/features/video-conference.md` states the invariants the merged code is built on. Several of
your changes quietly violate them if ported verbatim — most notably anything that treats
`call.users` as "people in the call" (it is now membership, and `isInVideoConference` is the other
question), or anything that assumes access to `call.rid` is what authorizes a member.
