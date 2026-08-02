# Video Conference Persistent Chat

## Overview

Persistent chat gives a video conference a Rocket.Chat room that lives alongside the call, so the conversation survives after the call ends. Instead of handing the user off to the provider's own page, joining a conference opens an in-product page at `/conference/:id` — the provider's call in an iframe, a control bar along the bottom, and the conference's chat in a collapsible panel docked to the inline end.

The chat room is resolved from the conference record: `discussionRid` when a discussion exists, otherwise the conference's `rid` (the room the call was started in). A conference's `rid` never changes; only `discussionRid` moves.

Gated by the EE setting `VideoConf_Enable_Persistent_Chat` (requires `Discussion_enabled`, module `videoconference-enterprise`).

## Opening a Conference

1. `VideoConfManager.joinCall(callId)` calls `POST /v1/video-conference.join` and emits `call/join` with `{ url, callId, providerName }`. Starting a group call (`startCall`) funnels into `joinCall`, so both paths behave the same.
2. `VideoConfProvider` handles `call/join`:
   - **Persistent chat enabled** — opens `/conference/:id` (absolute URL) instead of the provider URL.
   - **Disabled** — opens the provider URL directly, the pre-existing behavior.
3. `useVideoConfOpenCall` opens the call window. On desktop, `openInternalVideoChatWindow` takes over.

### How the call window is opened

A call opens as a **popout** — a dedicated window sized to 1280×800 (capped to the available screen) and centred — mirroring the desktop app's dedicated video window and keeping the call visible while the user works in the main app. If the popout is refused, it falls back to an ordinary **tab**; some browsers and extensions block popup-shaped windows while still allowing a plain one. Only if both are blocked does `VideoConfBlockModal` ask the user to allow it.

`noopener` is deliberately **never** in the features string. The conference page posts navigation requests back to its opener (see [Confined Navigation](#confined-navigation)), and `noopener` would both sever that link and make `window.open` return `null` — which would look identical to a blocked popup.

Same-origin (in-product) conferences share a named window, `rocketchat-conference`, so repeated joins reuse it instead of stacking duplicates:

| State of the shared window | Behaviour |
|---|---|
| already showing this conference | focused without reloading (empty URL) and **without features**, so a window the user has arranged is not resized or recentred |
| showing a different conference | navigated to the new one |
| closed, or never opened | opened fresh as a popout |

Whether it is showing this conference is decided by reading the window's actual `location.pathname`, not the URL we last passed — those differ in string form between the start and join paths.

External provider URLs (persistent chat off) get their own popout each time, unnamed.

## Layout

The conference renders **standalone**, without the app's navigation chrome.

`LayoutWithSidebar` (NavBar + Sidebar + `MainContent`) is applied by `MainLayout`, not by the authentication chain. This matters: `AuthenticationCheck → LoggedInArea → UsernameCheck → PasswordChangeCheck → TwoFactorAuthSetupCheck` is shared by every authenticated route, so anything it renders would also appear on the conference page. `TwoFactorAuthSetupCheck` therefore returns `children` directly.

The conference route is the only consumer of `AuthenticationCheck` outside `MainLayout`; every other route (including dynamic admin/account/room/audit groups) wraps in `MainLayout` and keeps the chrome.

The same applies to the chain's *loading placeholder*. `UsernameCheck` shows `HomeSkeleton` — a sidebar list, room and composer skeleton — while it resolves the user, which would flash a whole fake app shell in a conference window that never shows one. `AuthenticationCheck` and `UsernameCheck` therefore take an optional `loading` node; it still defaults to `HomeSkeleton` (so no existing route changes), and the conference route passes `PageLoading` instead. A plain spinner also matches what the conference itself shows while joining, making startup one continuous state rather than two.

Because it has no `MainContent` ancestor to inherit height from, `ConferenceViewport` establishes the `100dvh`/`100%` box the conference fills. The route is also wrapped with `appLayout.wrap(..., { embedded: true })`, which drops the global banner and cloud-announcement regions.

### Call chrome

The conference is a column: a row holding the call and the chat panel, then `CallBar` beneath it.

`CallBar` is the in-call control bar pinned along the bottom — the position third-party providers put their own toolbar in, so an embedded provider and the future native conference read the same. It is `relative`, and `CallBarActions placement='end'` is taken out of flow and anchored to the inline end, so adding or removing end actions never pulls the centred controls off-centre. Today the bar holds only the chat toggle (with an unread badge while the panel is closed); the native conference will fill the centre group with mic/camera/screen-share/hang-up.

`CallPanel` is a **sibling of the call area, not a child of the bar**. That is what makes toggling the chat animate its own width without ever reflowing the bar — the bar stays full width and fixed in place by construction, not by careful sizing. Its inner box keeps full width while the outer collapses, so content slides instead of reflowing mid-animation. On viewports narrower than `md` it floats over the call instead of taking width from it.

The panel is docked to the inline end, so its close button sits at the far end of its header — matching every other closable surface in the product.

## Route Behavior (`/conference/:id`)

| Condition | Renders | Auth |
|-----------|---------|------|
| `?callUrl=` present | `ConferencePage` — hands off to the provider's external URL | `guest` allowed |
| `:id` present | `ConferenceEmbeddedPage` — call + chat split view | authentication required (`guest={false}`) |
| neither | `ConferencePageError` | — |

Guests can't be members of the conference's room, so the embedded page requires a real account. A user without access to the conference's room gets `ConferenceUnauthorizedPage`, which logs out **without navigating away**, so re-login returns to the same conference.

## Chat Panel

The conference page renders one room outside the main app, so the cached stores the room UI reads from are never populated by the sidebar's subscriptions:

- `ConferenceRoomPreload` seeds the single room + subscription into the stores and marks them ready.
- `ConferenceRoom` opens the room by id (`useOpenRoomById`), forces `isEmbedded` layout, and subscribes to `notify-user/…/subscriptions-changed` to keep unread counts fresh (no sidebar watcher is running).
- `useOpenRoomById` is the by-rid counterpart to the router-driven `useOpenRoom`. It fetches via `GET /v1/rooms.info` (hence `mapRoomFromApi` to deserialize dates) and falls back to fetching the subscription directly, since `Subscriptions.state` may be empty here.

`LegacyRoomManager.open` is what starts the message stream the composer waits on. It resolves rooms by **name** for channels/groups but by **rid** for DMs — passing the wrong identifier leaves the composer stuck loading.

`ConferenceRoom` also carries `narrowRoomStyle`, which reclaims horizontal space for the 400px panel: it restores the composer's inline padding (the embedded layout zeroes it, sized for the tiny `?layout=embedded` iframe) and trims the message start padding and avatar gutter margin. It is scoped to that subtree, so the room's normal full-width appearance and every external embed are untouched. Only the *start* padding is trimmed — the message toolbar and timestamp column sit against the end padding and need the room.

The call iframe is named with `aria-label` rather than `title`: a `title` on a full-viewport iframe also renders as a hover tooltip, floating a label over the call for as long as the pointer is inside it.

Video conference message blocks inside the panel have their join/call-back actions disabled (`videoConfJoinDisabled`, set when the current route is `conference`) — joining another conference from inside a conference would replace the call the user is in.

## Confined Navigation

The chat panel is a full room UI, so a link, channel reference or user mention would navigate the conference window away from `/conference/:id` and **tear down the call**. `useConfinedNavigation` pins the window to the conference, covering both interaction paths:

- **`<a href>` clicks** — intercepted on the *capture* phase, so it runs before React/router handlers. Left alone: modified/non-primary clicks, `target` other than self/top/parent, `download`, non-http(s) protocols, and same-path URLs (`?jump=<msgId>`, `#hash`) which the app handles in place.
- **Programmatic `router.navigate`** — mentions and room links don't go through an anchor, so the shared `navigate` is monkey-patched. The patch is idempotent (`_confined` marker) and cleanup only restores when its own wrapper is still installed, so a newer patch is never clobbered and a stale one never reinstated. Numeric deltas and same-pathname navigations pass through untouched.

Internal routes are handed to the window that launched the conference rather than opened as a fresh tab, so the target is a client-side navigation (no full reload), in this order:

1. **Desktop app** — no `window.opener` (the conference is a standalone Electron window), so `window.videoCallWindow.openInMainWindow(route)` routes and focuses the main window. This bridge is distinct from `window.RocketChatDesktop`, which only exists in the main app webview.
2. **Browser** — `postMessage` a `rocketchat:navigate-to-route` request to the opener (same-origin only), then focus its tab. `opener.focus()` can't switch the active tab, so the opener is re-opened by window name with an empty URL, which focuses without navigating.
3. **Fallback** — a `noopener` new tab.

`useExternalRouteNavigation` is the receiving half, running in the main app (`AppLayout`). It listens for that `postMessage` and registers the desktop `onNavigateToRoute` bridge, turning both into `router.navigate`.

External (cross-origin) links always open in a `noopener` new tab.

## Adding Participants

Adding someone to a conference makes them a **member of the conference**. It puts them in no room: membership is what authorizes joining the call, and being able to read the chat is a separate concern, surfaced afterwards rather than decided here. See [Chat Access](#chat-access).

`AddParticipantsModal` accepts users via autocomplete. The conference's room members are excluded — they can already join, so adding them would be a no-op — and everyone else is offerable, which is the point. The exclusion list is best-effort: a member who can't read the chat has no room to enumerate, and the modal still works for them, offering everyone.

> Dial-out (typing a raw phone/SIP destination into the same field) is **not** wired up. No provider on this branch exposes a dial-out channel, so the affordance would have silently discarded the input; it was removed rather than left as dead UI. Restoring it means passing a provider-supplied `onDialOut` down to the modal.

`POST /v1/video-conference.add-participants` takes `{ callId, users }` — no `keepHistory`, no room choice — and calls `addMembers`:

- Each user who isn't already associated with the call gets a `users[]` entry with `joined: false`. Users who already have an entry are skipped, so an existing member's `joinedAt` (or `declined`) is never overwritten.
- Everyone actually added is **rung** (`notifyUser(…, 'ring', …)`). The endpoint caps a single add at `VIDEO_CONF_ADD_PARTICIPANTS_LIMIT` (10), which is what guarantees an add always rings — unlike starting a call in a large room, where the room's subscriber count can exceed the cap and nobody is rung.
- They also get a desktop notification, because the ring only reaches a client that is on screen and is one-shot. It deliberately carries **no room name**, which is what stops its click from navigating: the room behind the call may be one they can't open. Clicking focuses the app, where the ring is; the "Join call" action joins the conference itself.

Nothing about the conference's rooms changes, so `discussionRid` is untouched and no discussion is created.

### What the member sees

| | |
|---|---|
| Rung, app on screen | The incoming-call popup, describing the call. It renders without the room — see [the popup note](#the-incoming-call-popup-assumed-the-callee-was-in-the-room). |
| Accepts | Joins the conference outright; no handshake with whoever added them — see [Accepting a server ring](#accepting-a-server-ring-joins-it-doesnt-negotiate). |
| Declines | Recorded on their `users[]` entry. It never ends the call for anyone else, and they can still join afterwards. |
| Misses the ring | The conference is in their call history, joinable from there. The ring itself doesn't repeat. |
| Opens the chat panel without room access | An explanation, not an error — see [A member who can't read the chat](#a-member-who-cant-read-the-chat-is-told-so-not-shown-an-error). |

## Chat Access

`video-conference.info` carries a `chatAccess` descriptor: the room the chat lives in (`discussionRid || rid`), its display name and type, which members can't read it, and whether that room can take new members (`canInvite`).

Access is asked per member with `canAccessRoomIdAsync` rather than derived from subscriptions, because reading a room doesn't always need one — a public channel is readable by anyone, unless it belongs to a private team.

`ChatAccessNotice` surfaces the situation to participants who *can* read the chat, and hides itself from the members it is about — they can't resolve it for themselves. It sits inside the chat panel, where the remedy is in context, and moves up to the conference page while the panel is closed, so it can't be missed and is never shown twice.

`POST /v1/video-conference.share-chat` applies the remedy, taking a `mode`:

| `mode` | Effect | `discussionRid` |
|---|---|---|
| `'invite'` | The missing members are added to the chat's room, exposing its whole history | unchanged |
| `'discussion'` | The chat moves to a fresh discussion carrying the union of the room's members and the conference's | the new discussion |
| omitted | The room's own rules decide: `invite` when it can take members, otherwise `discussion` | as above |

`invite` is refused for a room that can't take new members, re-derived server-side rather than trusted from the client. The room is asked with `allowMemberAction(room, RoomMemberActions.INVITE, uid)` rather than tested for `t === 'd'`: the room type owns that rule, and it covers cases the type check misses, such as a federated DM that *can* grow.

Which action leads in the modal is a privacy judgement — see [Resolving chat access is the user's call](#resolving-chat-access-is-the-users-call).

Discussion type comes from `roomCoordinator.getRoomDirectives(parent.t).getDiscussionType(parent)`: `'c'` for a public channel (`'p'` if it belongs to a private team), `'p'` for everything else including DMs. Nesting is always flattened — `getRoomForDiscussion` walks `prid` up to the top-level room, so discussions never nest inside discussions.

### Historical: the keep-history choice, and what it got wrong

Adding used to ask **Keep chat history** up front and act on the answer immediately: `true` invited the users into the conference's active room, `false` built a fresh discussion. That is the choice `share-chat` now offers as a remedy, and moving it there fixed a divergence worth recording.

`createConferenceDiscussionWithParticipants` read only `{ rid }` and built from `call.rid`, while `addUsersToConferenceRoom` acted on `discussionRid || rid`. So once a conference had moved into a discussion, a second "don't keep history" add rebuilt from the **original room**, dropping everyone added since the first move. Confirmed at the time:

1. Channel with `[rodrigo, bob]`; start a conference.
2. Add `alice`, `keepHistory: false` → discussion **D1** `[alice, bob, rodrigo]`; `discussionRid` = D1.
3. Add `don`, `keepHistory: false` → discussion **D2** `[bob, rodrigo, don]`, `prid` = the channel. **`alice` is gone.**

`assignDiscussionToConference` partly masked it — it re-adds everyone in `call.users` — but anyone invited and not yet joined was lost. Both methods now build from `discussionRid || rid`, and `assignDiscussionToConference` subscribes the union of room members and conference members, so a new discussion contains everyone involved.

The other thing the old flow got wrong was forcing the decision on whoever added a participant, before anyone knew whether it mattered. A DM also had no valid answer: the client never offered the checkbox, and the server rejected `keepHistory: true` with a raw `error-cant-invite-for-direct-room`.

## Provider → Parent Bridge

A provider embedded in the conference iframe usually renders its own in-call toolbar, including a chat toggle. Rather than showing two competing sets of controls, it can drive ours by posting to the parent window:

```js
parent.postMessage({ type: 'rocketchat:conference', command: 'set-call-bar-visible', visible: false }, '*');
parent.postMessage({ type: 'rocketchat:conference', command: 'set-chat-visible', visible: true }, '*');
parent.postMessage({ type: 'rocketchat:conference', command: 'toggle-chat' }, '*');
```

`useProviderCallBridge` owns both pieces of chrome state, so our own bar button and the provider's messages drive one source of truth rather than fighting over two.

**Trust model:** the iframe is cross-origin, so `event.origin` cannot be allow-listed against our own origin. Instead every message must have come from `iframeRef.current.contentWindow` — the exact window we embedded, which no other frame or tab can forge. Messages failing that check, carrying an unknown `command`, or with a non-boolean `visible`, are ignored. `useProviderCallBridge.spec.ts` covers each rejection path.

## Realtime Updates

Two things can change the chat under a participant, and each has its own signal on the `video-conference` stream:

- **The chat moves.** `assignDiscussionToConference` broadcasts `video-conference.discussionUpdated`, plus `notify-room/…/videoconf` so the in-room conference message block refreshes its "Join discussion" button.
- **The same room becomes readable** by members who couldn't read it. Inviting them leaves the conference record untouched, so nothing else would say anything: `shareChatWithMembers` broadcasts `video-conference.chatAccessUpdated`.

Both are answered the same way — refetch the conference, which carries both the room and who can see it — so the client subscribes to both and invalidates one query. The participant who *asked* for the change also invalidates locally rather than waiting on the round trip.

The stream's `allowRead` accepts **conference membership or access to the chat's room**, the same pair `video-conference.info` accepts. Both halves matter: members may have no access to the room the call originated in, and membership alone would refuse a room member who opens the conference before their join lands — a refused subscription is never retried.

## Access Control

Every conference endpoint authorizes through one `canAccessConference` check, which accepts, in order:

1. **Conference membership** — a `users[]` entry. This is the point of the membership model: it authorizes joining the call without granting any room access.
2. Access to `call.rid`, the room the call was started in.
3. Access to `call.discussionRid`, the room the chat moved to. Someone who belongs only to the discussion has no access to the parent room, so checking only `rid` would lock them out of the call.

Because all of them share that check, `add-participants` no longer disagrees with `join` and `info` about who is allowed in.

## Conference Call History

The room's "Conference call history" tab (`icon: history`) groups conferences into **Ongoing** / **Past** sections. Ongoing calls show a primary **Join**; ended calls show **Call chat**, linking to the discussion (disabled when there is none).

`findPaginatedByRoomId` is an aggregation that:
- matches `rid` **or** `discussionRid`, so opening a discussion resolves the conference it belongs to even when its members can't see the parent room;
- `$lookup`s the discussion room to attach `discussionTitle` and `discussionLastMessage`, avoiding one request per conference.

The `discussionRid` index is compound with `createdAt` specifically so that `$or` match can be served by an index-ordered merge. With a `discussionRid`-only index, Mongo cannot produce the sort from either branch and falls back to a blocking in-memory sort of the room's entire conference history before paginating.

Entries are named after the discussion, falling back to the name the discussion *would* have had (`VideoConf_Persistent_Chat_Discussion_Name`, with `[date]` substitution matching the server).

Conference discussions don't carry the call's message block, so `OngoingConferenceBanner` surfaces a "Join ongoing call" banner in discussion rooms.

### Personal Call History

Separately from the room-scoped tab above, a group conference also leaves an entry in the personal, cross-room "Call history" page (`GET /v1/call-history.list`) alongside VoIP calls — the same "rejoin from a past call" entry point, for conferences.

`CallHistoryItem` (`packages/core-typings/src/ICallHistoryItem.ts`) gains a `type: 'video-conference'` variant, `IVideoConferenceHistoryItem`, alongside the existing 1:1-contact-shaped media-call variants. It carries `rid` (the conference's room), `title` (if the conference had one), and `usersCount` (how many members actually joined — `hasJoinedVideoConference`, not raw membership count). `callId`, `uid`, `ts`, `direction` and `state` come from the shared `ICallHistoryItem` base.

Items are written once, when a **group** conference stops — either because it was ended (`endCall`) or because the expiry cron ran past its 24h TTL (`expireCall`). Both matter: a provider that never reports the end back to Rocket.Chat, which includes the bundled Jitsi app, leaves *every* conference to be expired, so writing only on end writes almost never. Direct and livechat conferences are out of scope — they have no `title` and aren't the many-participants case this covers. `buildConferenceCallHistoryItems` (`apps/meteor/lib/videoConference/callHistory.ts`) builds one item per entry in the conference's `users[]` membership list — a room subscriber who was rung at start but never joined, was never added, and never declined has no membership entry, so gets no history item. Per member:
- `direction` is `outbound` for the conference's creator, `inbound` for everyone else.
- `state` is `ended` for a member who joined and `not-answered` for one who did not. Only members get an item, and a member either joined or was rung and didn't — so not joining *is* not answering, whether they declined explicitly or ignored it. Reporting an ignored ring as a normal ended call would hide a missed conference.

Both paths are reachable more than once for one call — an app can send `ENDED` repeatedly, and the cron runs every three hours — so `shouldWriteConferenceHistory` refuses a call that already carries `endedAt`, and must be given the call as read *before* `endedAt` is set. Otherwise every member collects a duplicate entry per attempt.

All call-history items — media calls and conferences alike — live in the same `call_history` collection, so the existing `direction`/`state` filters on `call-history.list` already apply to conference items with no change. The free-text `filter` search term gains one more `$or` branch matching the conference's `title` (`CallHistoryRaw.findAllByUserIdAndSearchFilters`).

The call-history page's table dispatches a conference item to `CallHistoryRowConference` (`apps/meteor/client/views/mediaCallHistory/`) instead of the three contact-shaped rows (`CallHistoryRowInternalUser`/`…External`/`…UnknownUser`), showing the room/title and joined-participant count in place of a contact. It doesn't reuse `CallHistoryTableRow` from `@rocket.chat/ui-voip` — that component's `contact`/`duration` props are contact-call-shaped and don't apply. Clicking the row opens the conference's room directly (`useGoToRoom`), the same "Call chat" action used by the room-scoped tab above, rather than the contact-shaped call-info side panel the other rows open — so `MediaCallHistoryContextualbar`/`MediaCallHistoryExternal` were only adjusted to keep compiling against the widened `CallHistoryItem` union, not to render a conference-specific detail view. Deep-linking straight to a conference item's `/call-history/details/:historyId` (bypassing the row) still falls through to the generic "Call info could not be loaded" panel — building a dedicated detail view was left out as out of scope.

## Provider Requirements

A provider must declare the **`persistentChat` capability** for `maybeCreateDiscussion` to create a discussion for its conferences.

Providers that don't declare it still work in the split view — the chat panel falls back to the conference's `rid`, showing the room the call was started in — but get no dedicated per-call discussion. The bundled **Jitsi app (v2.1.1) declares only `{ mic, cam, title }`**, so it falls into this case; adding `persistentChat` is an app-side change.

The provider's URL is embedded in an iframe, so it must permit framing (no restrictive `X-Frame-Options` / `frame-ancestors`). Rocket.Chat's own CSP allows `frame-src *`. Note the public `meet.jit.si` server disconnects embedded calls after 5 minutes and asks you to use a self-hosted instance or JaaS.

## Settings

| Setting | Notes |
|---------|-------|
| `VideoConf_Enable_Persistent_Chat` | EE; requires `Discussion_enabled`. Also gates whether joining opens the in-product conference page. |
| `VideoConf_Persistent_Chat_Discussion_Name` | Discussion name; `[date]` is substituted, or the date is prefixed when absent. |

## REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/video-conference.add-participants` | Register users as conference members and ring them; touches no room. Capped at 10 per call |
| POST | `/v1/video-conference.decline` | Record that the caller dismissed the call, without ending it |
| POST | `/v1/video-conference.join` | Join a conference — accepts `discussionRid` members |
| POST | `/v1/video-conference.share-chat` | Give the members who can't read the chat access to it (`mode: 'invite' \| 'discussion'`) |
| GET | `/v1/video-conference.info` | Conference info — accepts `discussionRid` members; carries `chatAccess` |
| GET | `/v1/video-conference.list` | Paginated history, with discussion title / last message |

## Streams

| Stream | Event | Payload | Authorized for |
|--------|-------|---------|----------------|
| `video-conference` | `<callId>/discussionUpdated` | `{ discussionRid }` | conference members, or anyone who can read the chat's room |
| `video-conference` | `<callId>/chatAccessUpdated` | — | same |

## Roadmap: membership-based conferences

> **Status: complete.** All phases have landed. The prose above describes the shipped behaviour; this section
> is kept as the record of the design and the decisions behind it, plus the follow-up work deliberately left
> out.

### Why

Today, adding someone to a conference *puts them in a room* — either the conference's room (keeping its
history) or a fresh discussion. Authorization to join the call is then derived from room membership. That
conflates two separate things: **being in the call** and **being able to read the chat**.

The target model separates them:

- Being added to a conference makes you a **member of the conference**. It does not put you in any room.
- Authorization to join is *room access **or** conference membership*.
- Members who can't see the chat are surfaced in the UI, with a remedy offered — rather than the decision
  being forced up-front, before anyone knows whether it matters.
- Being added **rings** you, and you accept or decline from the call widget.

### Decisions on record

| # | Decision |
|---|---|
| 1 | Conference membership lives on the existing `users[]`, with a per-entry `joined` flag — not a second array. Keeps one list of "who is associated with this call" and leaves room for future participant kinds. |
| 2 | `ts` keeps its current meaning (added to the conference). A separate `joinedAt` records when they actually joined. |
| 3 | Ringing is decided **per call event** against the list being rung, capped at 10. At start the list is the room's subscribers (so a >10-person room still rings nobody). On add, the list is the added users, capped at 10 per action — so an add always rings. |
| 4 | A decline is recorded as a flag on the member's `users[]` entry. It must never end the call for anyone else. |
| 5 | The ringing widget is **not** changed for now — the current floating overlay stays for every case. Revisit later. |
| 6 | Membership never expires, and is additive-only. |
| 7 | `assignDiscussionToConference` subscribes the **union of the original room's members and the conference's members**, so a newly created discussion contains everyone involved rather than only those who joined the call. |
| 8 | "External" (a member with no access to the chat) is **derived**, not stored — see [Future work](#future-work-not-in-scope). |

### Phase 1 — `users[]` becomes the membership list

- [x] Add `joined: boolean` and `joinedAt?: Date` to `IVideoConferenceUser`; `ts` stays "added at".
- [x] Made the array update safe. `addUserById` used `$addToSet` with a **whole document**, which compares entire objects — adding a member as `{…, joined: false}` and later marking them joined would have appended a *duplicate* entry instead of updating. Replaced by two operations:
  - `addMemberById` — a `$push` guarded by `{ _id: callId, 'users._id': { $ne: uid } }`, atomic and idempotent in a single document update, which also removed the racy in-memory `call.users.find(...)` dedup in `addUserToCall`.
  - `setUserJoinedById` — `$set` on `users.$[user].joined` / `users.$[user].joinedAt` via `arrayFilters`, mutating the existing entry in place.
- [x] `VideoConf.addUser` (called by the apps bridge and the EE `onJoinVideoConference` callback) becomes: ensure member exists, then mark joined.
- [x] `POST /v1/video-conference.add-participants` registers members instead of touching rooms; drop `keepHistory`.
- [x] `video-conference.join` / `.info` authorize on **room access OR conference membership**, replacing `canAccessConference`'s body. This also fixes the `add-participants` authorization inconsistency noted under [Access Control](#access-control).
- [x] **Existing records read as joined.** Decided in favour of default-true reading over a backfill: Every `users[]` entry already in the database predates the flag and represents someone who *joined*, so a reader filtering `joined === true` would show every historical conference as having no participants. `hasJoinedVideoConference` in `@rocket.chat/core-typings` is the single place that decides, so no reader tests the field directly and no deploy-order dependency exists. A backfill migration can still follow later.
- [x] REST response schemas carry the new fields through — confirmed, though `joinedAt` needed deserializing in `useVideoConfList` (it arrives as a string, exactly like `ts`), which the typecheck caught.

### Phase 1b — teach every reader the difference

The risk in Phase 1 is not the write path, it's the readers: `users[]` currently means "joined", and several
places rely on that. Miss one and added-but-absent people render as if they were in the call.

- [x] `VideoConferenceBlock` — `usersCount`, `joinedNamesOrUsernames`, `VideoConfMessageUserStack`, "Be the first to join" → **joined only**
- [x] `VideoConfListItem` — participant avatars → **joined only**
- [x] `updateDirectCall` ring-stop check → **joined only**
- [x] `addUserToCall` dedup → **membership**, then mark joined
- [x] `video-conference` stream `allowRead` → **membership**, so an added user can follow `discussionUpdated` before joining. This is a behaviour fix over today.
- [x] `assignDiscussionToConference` → union of room members and conference members (decision 7)

### Phase 2 — ringing as a per-event list

- [x] Extracted the cap into `shouldRingVideoConference(count)` in `lib/videoConference/constants.ts`, taking the size of the list being rung. It had been inlined as `Subscriptions.countByRoomId(rid) > 10` inside the EE `videoconference` type-registration condition, which decides `ringing` at *creation* time and could not be reused.
- [x] Ring on add via `notifyUser(uid, 'ring', …)` per added user, bypassing `notifyUsersOfRoom`.
- [x] Cap the add action itself at 10 users, so the same helper always permits the ring.
- [x] Renamed `incomingDirectCalls` → `incomingCalls` and `getIncomingDirectCalls` → `getIncomingCalls`; both are keyed by `callId` and now driven by the `ring` action too, not by directness. The `IncomingDirectCall` *type* keeps its name — it still describes the `DirectCallParams`-shaped payload.

### Phase 3 — decline

- [x] Persist the decline on the member's `users[]` entry (`declined` / `declinedAt`). Someone rung as a room member has no entry yet, so declining creates one — otherwise there is nowhere to record it. Declining is not exclusive with joining: a member can decline and join later.
- [x] Moved the *record* server-side, via `POST /v1/video-conference.decline`, which takes no target user and writes only against the caller's own membership. The client-published `rejected` stays, because the 1:1 flow depends on it (the caller's client is waiting on that message) — but it is a claim one client makes about another user's call, so it is no longer what gets stored.
- [x] Regression test in `client/lib/VideoConfManager.spec.ts`: a `rejected` for a call we are not placing never reaches `video-conference.cancel`. This holds only because `onDirectCallRejected` bails when `params.callId !== currentCallData?.callId`, and the teardown sits behind that guard plus `!joined` — so it is pinned, since widening that guard would silently let one decline end everybody's call. The spec also covers `ring` and `call` both registering an incoming call.

### Phase 4 — conference call history

Gives the "rejoin from a past call" entry point. Landed; see [Personal Call History](#personal-call-history).

- [x] New `type: 'video-conference'` variant on the `CallHistoryItem` union. The union is the intended extension point (`ICallHistoryItem` is deliberately separate from `IMediaCallHistoryItem`), but today's payload is 1:1-contact-shaped (`contactId`, `contactExtension`, `duration`) and a conference item is room-and-many-participants shaped.
- [x] Write the item on conference end.
- [x] New row component — all three existing rows (`CallHistoryRowInternalUser`, `…External`, `…UnknownUser`) are contact-shaped.
- [x] Extend `call-history.list` filters and `CallHistoryService.search`. (`direction`/`state` needed no change — every item type shares one collection; only the free-text search term gained a `title` branch.)
- [x] Guard against writing twice, since `setStatus(ENDED)` can be reached repeatedly for one call.

### Phase 5 — surface who can't see the chat

- [x] Derived on `video-conference.info` as `chatAccess`. Access is asked per member with `canAccessRoomIdAsync` rather than derived from subscriptions, because reading a room doesn't always need one — a public channel is readable by anyone unless it belongs to a private team. Conferences are small, and getting that case wrong is worse than the extra reads.
- [x] `ChatAccessNotice` renders inside the chat panel, where the remedy is in context, and moves up to the conference page while the panel is closed — so it can't be missed, and is never shown twice.
- [x] `POST /v1/video-conference.share-chat` applies the remedy, reusing `addUsersToConferenceRoom` / `createConferenceDiscussionWithParticipants`. It asks the room whether it can take new members — `allowMemberAction(room, RoomMemberActions.INVITE)` — rather than testing for a DM: the room type owns that rule, and it covers cases a `t === 'd'` check misses, such as a federated DM that *can* grow.
- [x] The caller picks *how*, via `mode`. Both ways give something away, so neither is applied on the user's behalf — see [Resolving chat access is the user's call](#resolving-chat-access-is-the-users-call).
- [x] Fixed `createConferenceDiscussionWithParticipants` to build from `discussionRid || rid`, closing the divergence documented above.

### Future work (not in scope)

- **Non-user participants.** Members are registered Rocket.Chat users only, for now. Representing SIP
  extensions, phone numbers, external email addresses, or participants derived from a calendar event is
  wanted later. `IVideoConferenceUser extends Pick<Required<IUser>, '_id' | 'username' | 'name'>` — required
  `username` *and* `name` — so that constraint has to relax when it happens. Adding a nullable `source`
  discriminator to the entry while Phase 1 is being written costs nothing and avoids a migration later.
- **A call members panel.** Declines are persisted, but there is deliberately nowhere to *see* one in
  this scope. The intended home is a members panel listing the call's members and their state — added,
  joined, declined, external. Until it exists, a decline is recorded but invisible to the adder.
- **Docking the ringing widget.** Decision 5 keeps the current floating overlay for every case. Docking it
  over the room list, with a floating fallback when the list isn't visible, was considered and deferred.

## Implementation notes

Things worth knowing that aren't visible from the code alone.

### Group ringing was dead code before this work

The server had long set `ringing: true` on group conferences and broadcast an `action: 'ring'` to each room
member, but **no client ever handled it** — the only match for `'ring'` in the client was a word in the E2EE
wordlist. Real 1:1 ringing is driven entirely client-side, by the caller's own `VideoConfManager` republishing
`'call'` on an interval while it waits.

`VideoConfManager` now handles `'ring'`, which is what makes ringing-on-add work. The side effect is that
group conferences which had been silently not ringing **will now ring** — the behaviour the EE code always
intended, but a visible change beyond "ring on add".

A server-originated ring is one-shot: nothing refreshes the 10s abort timeout that a 1:1 caller keeps alive,
so it rings once and gives up. That suits an already-running conference, where there is no caller waiting.

### Declining makes you a member

There is nowhere to record a decline except on a `users[]` entry, so declining creates one for someone who
was rung as a room member. Since membership authorizes joining, a member who declines can still join
afterwards — which is intended, but is a consequence of where the flag is stored rather than a separate
decision.

### Resolving chat access is the user's call

Both ways out of "some members can't see the chat" give something away, in different directions: inviting
exposes the room's whole history to an outsider, while moving the chat to a discussion leaves the earlier
history behind for everyone already there. So `share-chat` takes a `mode` and `ChatAccessModal` spells out
each consequence next to its button, naming the room in bold — that name is the context the decision turns on.

Which action *leads* is a privacy judgement: opening a private room's history is the bigger step, so private
rooms and DMs lead with the discussion, and public rooms — whose history is already open — lead with the
invite. A DM can't take new members at all, so there the discussion is the only option offered. The server
re-derives `canInvite` and rejects `mode: 'invite'` it can't honour, rather than trusting the client's read.

The notice itself is `AnnouncementBanner` — the same banner rooms use for announcements — so it inherits
readable contrast instead of hand-rolled colours. It is passed no `onClick`: the Review button is the only
control, which keeps one interactive element rather than nesting a button inside a `role='button'` bar.

### A member who can't read the chat is told so, not shown an error

The panel used to let the room fetch fail and fall back to `NotFoundPage` — *"The page does not exist or you
may not have access permission"* — which reads as something being broken. The server already works out who
can't read the chat, so `ConferenceChat` checks whether the current user is one of them and renders
`ConferenceChatNotShared` instead, without attempting a fetch that is known to fail.

`ChatAccessNotice` hides itself from those same members for the same reason: it offers to share the chat, and
they are the ones it would be shared with — `share-chat` would fail for them anyway, since they can't add
anyone to a room they can't see.

### The incoming-call popup assumed the callee was in the room

Ringing on add is the first case where a call rings someone who has no access to the room it belongs to, and
the popup was built entirely around that room — it read it from the client store with `useUserRoom(rid)` and
returned `null` when it wasn't there, while still calling `focusManager.focusFirst()`, which then looked for
the parent of a node the focus scope never got (`Cannot read properties of undefined`).

Incoming popups now render without a room, describing the call from the conference's own record instead
(`VideoConfPopupCallerInfo`, fed by the `video-conference.info` the popup already fetches). The popups that act
*on* a room — starting or placing a call — still require one.

### Accepting a server ring joins; it doesn't negotiate

1:1 accept is a handshake: the callee publishes `accepted` and waits for the caller's client to reply
`confirmed` with the go-ahead, giving up after 5s. A server-originated ring has no caller waiting, so running
that handshake left the added user staring at *"No response from remote user after notifying the call was
accepted"*. Incoming calls now carry a `handshake` flag; without it, accepting joins the conference outright —
membership is what authorizes joining — and declining records the decline without publishing `rejected` to
whoever added them, which their client would read as their own call being turned down.

### Test coverage and where it lives

The cheap runners were used deliberately: mocha under `apps/meteor/tests/unit/**` (~2s for the whole config)
and package-level jest.

| What | Where |
|---|---|
| `hasJoinedVideoConference` back-compat, ringing cap boundaries | `apps/meteor/tests/unit/lib/videoConference/membership.spec.ts` |
| Per-member history semantics | `apps/meteor/tests/unit/lib/videoConference/callHistory.spec.ts` |
| A decline can't tear down a conference; `ring` and `call` both register; accepting a ring joins outright while accepting a call negotiates | `apps/meteor/client/lib/VideoConfManager.spec.ts` |
| The share-chat `mode` contract | `apps/meteor/tests/unit/definition/rest/v1/video-conference/VideoConfShareChatProps.spec.ts` |
| Which mode wins, and that an impossible invite is refused rather than swapped | `apps/meteor/tests/unit/lib/videoConference/chatAccess.spec.ts` |
| Which action leads, and that a DM only offers the discussion | `apps/meteor/client/views/conference/ChatAccessModal.spec.tsx` |
| The incoming popup renders for a room the member can't see | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopups.spec.tsx` |
| Which side of the chat-access split each participant sees | `apps/meteor/client/views/conference/ConferenceChat.spec.tsx` |
| Who the notice is shown to, and that Review opens the modal | `apps/meteor/client/views/conference/ChatAccessNotice.spec.tsx` |
| Both stream events refetch the conference; the chat follows a discussion | `apps/meteor/client/views/conference/hooks/useConferenceEmbedded.spec.tsx` |
| Adding works without the room, and posts the usernames | `apps/meteor/client/views/conference/AddParticipantsModal.spec.tsx` |
| The membership update *shapes* — the `$addToSet` trap | `packages/models/src/models/VideoConference.spec.ts` |

`packages/models/src/models/VideoConference.spec.ts` stubs `BaseRaw`, which participates in a circular
import that leaves it uninitialized when the module is loaded directly by jest.

Where the seams are drawn matters: `resolveChatAccessMode` and `chatAccessLeadsWithDiscussion`
(`apps/meteor/lib/videoConference/chatAccess.ts`) exist as pure functions **shared by the server's default and
the modal's primary button**, so the rule is tested once and the two can't drift. `VideoConfService` itself is
not unit-tested — proxyquiring it means stubbing some thirty modules, one of which opens a Mongo driver at
import time — which is why the decisions worth pinning down were moved out of it.

### Nothing "ends" a Jitsi conference

Worth knowing before wondering why a call is missing from history: `endCall` runs when something tells
Rocket.Chat the call is over — an app provider posting `ENDED`, or a direct call being hung up. Nothing in the
Jitsi app does that, so its conferences sit at `STARTED` until `videoConferencesCron` expires them (on startup,
then every three hours, for anything older than 24h). That is why history is written on both paths.

Conferences expired *before* this landed have `endedAt` set already, so they are permanently invisible to
history — the duplicate guard can't distinguish them from ones already written. Only conferences that stop from
now on appear.

### Verified against live data

The premise — membership without room access — was confirmed by reading a development workspace's Mongo
directly, not only by test:

- A conference on a **DM** between two users carried a third, `alice`, as a `users[]` entry with
  `joined: false` and **no subscription to that DM**. She is authorized to join the call and cannot read its
  chat, which is exactly the state the model exists to represent.
- Entries mixed both shapes as designed: joined members carry `joined: true` and a `joinedAt`; added members
  carry `joined: false` and no `joinedAt`. Every entry carries `ts`.

Not yet observed live: a persisted **decline**. `POST /v1/video-conference.decline` is covered from the client
side (`VideoConfManager.spec.ts`) and the model write is covered by shape
(`packages/models/src/models/VideoConference.spec.ts`), but no `users[].declined` flag has been seen in real
data, so the endpoint-to-model chain rests on those two tests meeting in the middle.

### Known gaps

- **No members panel.** Declines and per-member state are stored but there is nowhere to see them. See
  [Future work](#future-work-not-in-scope).
- **No conference detail view in call history.** Clicking a conference row opens its room. Deep-linking to
  `/call-history/details/:historyId` for a conference falls through to the generic "call info could not be
  loaded" panel.
- **`video-conference.add-participants` is capped at 10 users per call**, which is what guarantees an add
  always rings. Adding more means several requests.
- Everything under [Improvement suggestions](#improvement-suggestions).


## Improvement suggestions

Found while auditing the implementation against this document. None of these are broken behaviour — they are
where the feature is thinner than it looks.

### Re-adding a member can't re-ring them

`addMembers` skips anyone who already has a `users[]` entry, so only *new* entries are rung. Someone who
missed the ring, or declined and changed their mind, cannot be rung again from the add flow — the modal
reports success and nothing happens on their side. Decision 3 wanted a manual add to always ring.

The fix is to separate the two lists: create entries for users who don't have one, and ring every user in the
request who hasn't **joined**, whether their entry is new or not. The 10-user cap already bounds it.

### The ring is one-shot, and easy to miss entirely

A server ring fires once and gives up after 10s, unlike a 1:1 call whose caller keeps re-publishing. Being
added is now also a desktop notification, which covers a backgrounded tab, but a user with notifications
denied and no client on screen has no signal at all beyond finding the conference in their call history.

The deferred docked ringing widget (decision 5) is the intended answer. Repeating the server ring for a bounded
window would be the cheaper one.

### `getChatAccess` costs one access check per member, per read

Every `video-conference.info` asks `canAccessRoomIdAsync` once per member, and `info` is now refetched on every
conference stream event as well as on mount. Fine at conference scale, but it is the kind of thing that only
shows up under a large call. A single `Subscriptions` query for the member ids, plus the room-type check for
the public-channel case, would collapse it to two reads.

### Add-participants outcomes aren't reported back

The endpoint returns `{ added }`, and the modal ignores it — it toasts "Users added" unconditionally, so
selecting only people who are already members reports success for a no-op. The autocomplete's exclusion list is
also capped at 100 room members and truncates silently, which is how those selections happen in a big room.

Worth returning per-user outcomes (`added` / `already a member`) and saying which is which.

### `share-chat`'s invite path is all-or-nothing in the wrong direction

`addUsersToConferenceRoom` hands every missing member to `addUsersToRoomMethod` in one call. If it throws for
one of them, the caller gets an error toast and no indication that the others may have gone through — the
notice will simply show fewer people next time it is read. Per-user results would make the partial outcome
legible.

### The endpoints have no integration coverage

`canAccessConference`, the Mongo writes, and the room-mutating paths (`addUsersToConferenceRoom`,
`createConferenceDiscussionWithParticipants`) are only exercised by hand. They are also where the interesting
cases live — a discussion-only member, a federated DM, a public channel inside a private team. `tests/end-to-end/api/`
runs against a live server and is where those belong; the unit tests deliberately stop at the seams.

### Access lost mid-call falls back to "not found"

The chat panel decides between the room and the not-shared explanation from `chatAccess`, which is only as
fresh as the last read. A member removed from the room *during* a call still sees the room attempted, and gets
`ConferenceRoomPreload`'s not-found fallback until the next refetch. Rare, and self-correcting.


## Planned changes

Deliberate changes to make later, as opposed to the audit findings above.

### Move the "calling" state into the popout

Today the two call types open the window at different moments, and only one of them is safe:

| | When the popout opens |
|---|---|
| **Group** conference | On the click — `startCall` goes straight to `joinCall`, still inside the browser's user-activation window |
| **Direct** call | After the callee answers — `onDirectCallAccepted` calls `joinCall` from a stream event, arbitrarily far from any click |

Clicking the camera button opens the pre-call widget, and clicking Call keeps the caller in that widget in a
"calling" state while the popout waits on the answer. So for a direct call `window.open` runs with no user
activation behind it, which is the reason `VideoConfBlockModal` exists at all: the browser is entitled to refuse,
and the user has to click again to get the window they already asked for.

The change is to make the direct path behave like the group one — open the popout on the click and host the
calling state *inside* it. That removes the blocked-popup case for the flow that actually suffers from it, and it
gives the caller somewhere to set up mic and camera while the other side is still ringing, instead of a widget
that only offers a spinner.

Open questions:

- **What the popout shows while ringing.** The caller can be in the provider's room already, as they are for a
  group call, with the callee's state layered over it. Whether the 1:1 `accepted`/`confirmed` handshake still
  earns its keep once the caller is joined before the answer is worth revisiting at the same time — see
  [Accepting a server ring](#accepting-a-server-ring-joins-it-doesnt-negotiate).
- **What happens when the call is turned down.** Auto-closing a window the user is sitting in is abrupt, and it
  discards a call they may want to retry. The current thinking is to keep the window and show a modal — "everyone
  else declined" — with a button that closes it, which also covers a group conference where the last other member
  declines. A decline must not close the window for anyone still in the call.
- **No answer versus declined.** A ring that simply times out should read differently from an explicit decline,
  and today neither reaches the caller's window because there is no window yet.


## Key Files

| Layer | File |
|-------|------|
| Conference service | `apps/meteor/server/services/video-conference/service.ts` |
| API routes | `apps/meteor/server/api/v1/videoConference.ts` |
| Stream wiring | `apps/meteor/server/modules/notifications/notifications.module.ts`, `modules/listeners/listeners.module.ts` |
| Event signature | `packages/core-services/src/events/Events.ts` |
| Stream typings | `packages/ddp-client/src/types/streams.ts` |
| Conference model | `packages/models/src/models/VideoConference.ts` |
| Route + viewport | `apps/meteor/client/views/conference/ConferenceRoute.tsx`, `ConferenceViewport.tsx` |
| Call chrome | `apps/meteor/client/views/conference/ConferenceEmbeddedPage.tsx`, `ConferenceIframe.tsx`, `components/CallBar/`, `components/CallPanel/` |
| Chat panel | `apps/meteor/client/views/conference/ConferenceChat.tsx`, `ConferenceRoom.tsx`, `ConferenceRoomPreload.tsx` |
| Conference data | `apps/meteor/client/views/conference/hooks/useConferenceEmbedded.tsx`, `useConferenceCallUrl.ts` |
| Provider bridge | `apps/meteor/client/views/conference/hooks/useProviderCallBridge.ts` (+ `.spec.ts`) |
| Confined navigation | `apps/meteor/client/views/conference/hooks/useConfinedNavigation.ts` (+ `.spec.ts`), `client/views/root/hooks/useExternalRouteNavigation.ts` |
| Add participants | `apps/meteor/client/views/conference/AddParticipantsModal.tsx` |
| Chat access | `apps/meteor/client/views/conference/ChatAccessNotice.tsx`, `ChatAccessModal.tsx`, `ChatAccessMember.tsx`, `ConferenceChatNotShared.tsx` |
| Ringing popups | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/` |
| Join routing | `apps/meteor/client/providers/VideoConfProvider.tsx`, `client/views/room/contextualBar/VideoConference/hooks/useVideoConfOpenCall.tsx` |
| Room opening | `apps/meteor/client/views/room/hooks/useOpenRoomById.tsx`, `client/lib/utils/mapRoomFromApi.ts` |
| Ongoing banner | `apps/meteor/client/views/room/OngoingConferenceBanner/OngoingConferenceBanner.tsx` |
| Room-scoped call history | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/` |
| Personal call history (type + write path) | `packages/core-typings/src/ICallHistoryItem.ts`, `apps/meteor/lib/videoConference/callHistory.ts`, `apps/meteor/server/services/video-conference/service.ts` |
| Personal call history (search + row) | `packages/models/src/models/CallHistory.ts`, `apps/meteor/client/views/mediaCallHistory/CallHistoryRowConference.tsx`, `CallHistoryPage.tsx` |
| Join guard | `apps/meteor/client/uikit/hooks/useMessageBlockContextValue.ts`, `packages/fuselage-ui-kit/src/blocks/VideoConferenceBlock/VideoConferenceBlock.tsx` |
| Layout | `apps/meteor/client/views/root/MainLayout/MainLayout.tsx`, `TwoFactorAuthSetupCheck.tsx`, `client/lib/appLayout.tsx` |
| Notifications | `apps/meteor/client/hooks/notification/useNotification.ts`, `packages/core-typings/src/INotification.ts` |
