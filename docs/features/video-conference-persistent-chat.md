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

`AddParticipantsModal` accepts users via autocomplete, excluding the room's current members. A **Keep chat history** checkbox decides where the chat continues; DMs never offer it because a DM can't grow.

> Dial-out (typing a raw phone/SIP destination into the same field) is **not** wired up. No provider on this branch exposes a dial-out channel, so the affordance would have silently discarded the input; it was removed rather than left as dead UI. Restoring it means passing a provider-supplied `onDialOut` down to the modal.

`POST /v1/video-conference.add-participants` takes `keepHistory` and branches:

- **`true`** → `addUsersToConferenceRoom` invites the users into the conference's **active** room (`discussionRid || rid`), so they get its history. `discussionRid` is left alone.
- **`false`** → `createConferenceDiscussionWithParticipants` creates a fresh discussion, carries members over, leaves a `discussion-created` pointer in the parent room, and repoints `discussionRid` at it.

Existing members are carried over from the room doc for DMs (`usernames`) and from subscriptions for channels/groups. The conference's own `users` list is **not** used as the member source — it only holds people who actually joined the call.

Both paths notify each added user with a desktop notification (`requireInteraction`, plus a "Join call" action on desktop that joins directly via `conferenceId`).

The modal does not refetch the conference afterwards — `assignDiscussionToConference` broadcasts `discussionUpdated`, and every participant's panel (including the one that triggered the add) follows that single signal.

### Verified behaviour per room type

What the code actually does, confirmed end-to-end against the endpoint. "Active room" means `discussionRid || rid`.

| Conference is in | `keepHistory` | Result | New `discussionRid` |
|---|---|---|---|
| **DM** (`t: 'd'`) | `false` — the only value the client sends for a DM | Discussion `t: 'p'`, `prid` = the DM, members = both DM members + invitees | the new discussion |
| **DM** | `true` | **Rejected**: `400 error-cant-invite-for-direct-room` | unchanged |
| **Channel** (`t: 'c'`) | `true` | Invitees added to the channel itself | unchanged |
| **Channel** (`t: 'c'`) | `false` | Discussion `t: 'c'`, `prid` = the channel, members = channel members + invitees | the new discussion |
| **Private group** (`t: 'p'`) | `false` | Same, but `t: 'p'` (the default discussion type) | the new discussion |
| **A discussion the conference *started* in** | `false` | New discussion, `prid` **walked up to the top-level room** (not nested under the current discussion), members = the current discussion's members + invitees | the new discussion |
| **A discussion the conference *moved* into** | `true` | Invitees added to that discussion | unchanged |
| **A discussion the conference *moved* into** | `false` | New discussion built from the **original room**, not the current discussion — see below | the new discussion |

The discussion type comes from `roomCoordinator.getRoomDirectives(parent.t).getDiscussionType(parent)`: `'c'` for a public channel (`'p'` if it belongs to a private team), and `'p'` for everything else including DMs. Nesting is always flattened — `getRoomForDiscussion` walks `prid` up to the top-level room, so discussions never nest inside discussions.

The DM rule is enforced in two places for different reasons: the client never offers the checkbox for a DM, and the server's invite path rejects it outright because a DM cannot take new members. So there is no way to widen a DM — but the server-side refusal surfaces as a raw `error-cant-invite-for-direct-room`, not a friendly message, because nothing guards it explicitly before `addUsersToRoomMethod` runs.

### Known divergence: repeated "don't keep history" loses earlier invitees

`addUsersToConferenceRoom` reads `{ rid, discussionRid }` and acts on `discussionRid || rid`. `createConferenceDiscussionWithParticipants` reads only `{ rid }` and acts on `call.rid` — so once the conference has already moved into a discussion, a second "don't keep history" add **rebuilds from the original room** instead of the discussion the chat is currently in.

Confirmed:

1. Channel with `[rodrigo, bob]`; start a conference.
2. Add `alice`, `keepHistory: false` → discussion **D1** `[alice, bob, rodrigo]`; `discussionRid` = D1.
3. Add `don`, `keepHistory: false` → discussion **D2** `[bob, rodrigo, don]`, `prid` = the channel. **`alice` is gone.**

`assignDiscussionToConference` partly masks this in practice: it adds every entry of `call.users` to the new discussion, so anyone who actually *joined the call* is re-added. Anyone invited but not yet joined is dropped. In the run above `call.users` was empty, so nothing masked it.

If the intent is "a discussion with all current participants plus the invitee", the fix is to make the two methods agree — project `discussionRid` and use `discussionRid || rid` as the base room. `parent` resolution is unaffected, since `getRoomForDiscussion` walks up to the same top-level room either way.

> This is largely superseded by [Roadmap: membership-based conferences](#roadmap-membership-based-conferences), which removes the keep-history choice from the add flow entirely. The fix above is still wanted for the discussion *remedy* that replaces it.


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

When the conference's chat moves, `assignDiscussionToConference` broadcasts:

- `video-conference.discussionUpdated` on the new `video-conference` stream → open conference views refetch `conference-info` and follow the new room.
- `notify-room/…/videoconf` → the in-room conference message block refreshes its "Join discussion" button.

The `video-conference` stream's `allowRead` authorizes against the **conference's participant list**, not room access — invited users may not have access to the room the conference originated in.

## Access Control

`video-conference.join` and `video-conference.info` accept a user with access to **either** `call.rid` **or** `call.discussionRid`. Users invited into a conference discussion often have no access to the parent room, so checking only `rid` would lock them out of the call they were invited to.

> `video-conference.add-participants` currently checks only `call.rid`. A user who belongs only to the discussion sees the "Add people" button but will get `invalid-params`. This mirrors the upstream PR and is a known inconsistency.

## Conference Call History

The room's "Conference call history" tab (`icon: history`) groups conferences into **Ongoing** / **Past** sections. Ongoing calls show a primary **Join**; ended calls show **Call chat**, linking to the discussion (disabled when there is none).

`findPaginatedByRoomId` is an aggregation that:
- matches `rid` **or** `discussionRid`, so opening a discussion resolves the conference it belongs to even when its members can't see the parent room;
- `$lookup`s the discussion room to attach `discussionTitle` and `discussionLastMessage`, avoiding one request per conference.

The `discussionRid` index is compound with `createdAt` specifically so that `$or` match can be served by an index-ordered merge. With a `discussionRid`-only index, Mongo cannot produce the sort from either branch and falls back to a blocking in-memory sort of the room's entire conference history before paginating.

Entries are named after the discussion, falling back to the name the discussion *would* have had (`VideoConf_Persistent_Chat_Discussion_Name`, with `[date]` substitution matching the server).

Conference discussions don't carry the call's message block, so `OngoingConferenceBanner` surfaces a "Join ongoing call" banner in discussion rooms.

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
| POST | `/v1/video-conference.add-participants` | Add users to the conference's room, or to a new discussion (`keepHistory: false`) |
| POST | `/v1/video-conference.join` | Join a conference — accepts `discussionRid` members |
| GET | `/v1/video-conference.info` | Conference info — accepts `discussionRid` members |
| GET | `/v1/video-conference.list` | Paginated history, with discussion title / last message |

## Streams

| Stream | Event | Payload | Authorized for |
|--------|-------|---------|----------------|
| `video-conference` | `<callId>/discussionUpdated` | `{ discussionRid }` | conference participants |

## Roadmap: membership-based conferences

> **Status: planned — none of this section is implemented yet.** Everything above describes shipped
> behaviour. This section is the agreed design and the progress tracker; update the checkboxes as work
> lands, and move prose up into the sections above once a phase ships.

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

- [ ] Add `joined: boolean` and `joinedAt?: Date` to `IVideoConferenceUser`; `ts` stays "added at".
- [ ] Make the array update safe. `addUserById` currently uses `$addToSet` with a **whole document**, which compares entire objects — adding a member as `{…, joined: false}` and later marking them joined would append a *duplicate* entry instead of updating. Replace with two operations:
  - `addMemberById` — a `$push` guarded by `{ _id: callId, 'users._id': { $ne: uid } }`, which is atomic and idempotent in a single document update (and fixes the racy in-memory `call.users.find(...)` dedup in `addUserToCall`).
  - `setUserJoinedById` — `$set` on `users.$[u].joined` / `users.$[u].joinedAt` via `arrayFilters: [{ 'u._id': uid }]`, mutating the existing entry in place.
- [ ] `VideoConf.addUser` (called by the apps bridge and the EE `onJoinVideoConference` callback) becomes: ensure member exists, then mark joined.
- [ ] `POST /v1/video-conference.add-participants` registers members instead of touching rooms; drop `keepHistory`.
- [ ] `video-conference.join` / `.info` authorize on **room access OR conference membership**, replacing `canAccessConference`'s body. This also fixes the `add-participants` authorization inconsistency noted under [Access Control](#access-control).
- [ ] **Decide how existing records read.** Every `users[]` entry already in the database predates the flag and represents someone who *joined*, so a reader filtering `joined === true` would show every historical conference as having no participants. Either treat absent as joined (`joined !== false`) or backfill with a migration alongside the existing ones in `server/startup/migrations/`. Default-true reading is the safer of the two and works without a deploy-order dependency; a backfill can follow.
- [ ] Confirm the REST response schemas carry the new fields through. `infoResponseSchema` is `additionalProperties: true` so it should be fine, but `listResponseSchema` refs `#/components/schemas/IGroupVideoConference` and friends, and those refs are not registered on the `ajv` instance in `packages/rest-typings/src/v1/Ajv.ts` — worth confirming rather than assuming.

### Phase 1b — teach every reader the difference

The risk in Phase 1 is not the write path, it's the readers: `users[]` currently means "joined", and several
places rely on that. Miss one and added-but-absent people render as if they were in the call.

- [ ] `VideoConferenceBlock` — `usersCount`, `joinedNamesOrUsernames`, `VideoConfMessageUserStack`, "Be the first to join" → **joined only**
- [ ] `VideoConfListItem` — participant avatars → **joined only**
- [ ] `updateDirectCall` ring-stop check → **joined only**
- [ ] `addUserToCall` dedup → **membership**, then mark joined
- [ ] `video-conference` stream `allowRead` → **membership**, so an added user can follow `discussionUpdated` before joining. This is a behaviour fix over today.
- [ ] `assignDiscussionToConference` → union of room members and conference members (decision 7)

### Phase 2 — ringing as a per-event list

- [ ] Extract the cap into a shared helper taking the list to ring. It currently lives as `Subscriptions.countByRoomId(rid) > 10` inside the EE `videoconference` type-registration condition, which decides `ringing` at *creation* time and can't be reused as-is.
- [ ] Ring on add via `notifyUser(uid, 'ring', …)` per added user, bypassing `notifyUsersOfRoom`.
- [ ] Cap the add action itself at 10 users, so the same helper always permits the ring.
- [ ] Rename `incomingDirectCalls` → `incomingCalls` in `VideoConfManager`; it is already keyed by `callId` and driven by the `ring` action, not by directness.

### Phase 3 — decline

- [ ] Persist the decline flag on the member's `users[]` entry.
- [ ] Move decline **server-side**. It is currently client-published to `notify-user/${uid}/video-conference`, so any client can publish it on another user's behalf; persisting a claim like that is a soft spoofing vector.
- [ ] Regression test: a decline from one member leaves the conference running for everyone else. This holds today only because `onDirectCallRejected` bails when `params.callId !== currentCallData?.callId`, and the `video-conference.cancel` teardown sits behind that same guard plus `!joined`. Nothing stops that guard being widened later.

### Phase 4 — conference call history

The largest remaining piece, and independently shippable. Gives the "rejoin from a past call" entry point.

- [ ] New `type: 'video-conference'` variant on the `CallHistoryItem` union. The union is the intended extension point (`ICallHistoryItem` is deliberately separate from `IMediaCallHistoryItem`), but today's payload is 1:1-contact-shaped (`contactId`, `contactExtension`, `duration`) and a conference item is room-and-many-participants shaped.
- [ ] Write the item on conference end.
- [ ] New row component — all three existing rows (`CallHistoryRowInternalUser`, `…External`, `…UnknownUser`) are contact-shaped.
- [ ] Extend `call-history.list` filters and `CallHistoryService.search`.

### Phase 5 — surface who can't see the chat

- [ ] Derive "members with no chat access" = conference members − room members, exposed via `video-conference.info`.
- [ ] Banner in the conference page and in the chat panel, with a remedy button.
- [ ] Remedy by room type: channel/group → invite to the room; DM → can't grow, so create a discussion. Reuses `addUsersToConferenceRoom` / `createConferenceDiscussionWithParticipants` as *remedies* rather than an up-front choice.
- [ ] Fix `createConferenceDiscussionWithParticipants` to read `discussionRid || rid` (see [Known divergence](#known-divergence-repeated-dont-keep-history-loses-earlier-invitees)).

### Future work (not in scope)

- **Non-user participants.** Members are registered Rocket.Chat users only, for now. Representing SIP
  extensions, phone numbers, external email addresses, or participants derived from a calendar event is
  wanted later. `IVideoConferenceUser extends Pick<Required<IUser>, '_id' | 'username' | 'name'>` — required
  `username` *and* `name` — so that constraint has to relax when it happens. Adding a nullable `source`
  discriminator to the entry while Phase 1 is being written costs nothing and avoids a migration later.
- **A call members panel.** Decision 4 persists declines, but there is deliberately nowhere to *see* one in
  this scope. The intended home is a members panel listing the call's members and their state — added,
  joined, declined, external. Until it exists, a decline is recorded but invisible to the adder.
- **Docking the ringing widget.** Decision 5 keeps the current floating overlay for every case. Docking it
  over the room list, with a floating fallback when the list isn't visible, was considered and deferred.

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
| Join routing | `apps/meteor/client/providers/VideoConfProvider.tsx`, `client/views/room/contextualBar/VideoConference/hooks/useVideoConfOpenCall.tsx` |
| Room opening | `apps/meteor/client/views/room/hooks/useOpenRoomById.tsx`, `client/lib/utils/mapRoomFromApi.ts` |
| Ongoing banner | `apps/meteor/client/views/room/OngoingConferenceBanner/OngoingConferenceBanner.tsx` |
| Call history | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/` |
| Join guard | `apps/meteor/client/uikit/hooks/useMessageBlockContextValue.ts`, `packages/fuselage-ui-kit/src/blocks/VideoConferenceBlock/VideoConferenceBlock.tsx` |
| Layout | `apps/meteor/client/views/root/MainLayout/MainLayout.tsx`, `TwoFactorAuthSetupCheck.tsx`, `client/lib/appLayout.tsx` |
| Notifications | `apps/meteor/client/hooks/notification/useNotification.ts`, `packages/core-typings/src/INotification.ts` |
