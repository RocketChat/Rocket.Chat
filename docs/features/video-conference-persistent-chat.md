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

### When the call window opens

Every call type opens its window **on the click that asked for it**, inside the browser's user-activation
window. That matters: `window.open` from anything later — a stream event, a timer — is something the browser is
entitled to refuse, and `VideoConfBlockModal` then has to ask the user to click again for a window they already
asked for.

A direct call used to be the exception. It rang the callee and kept the caller waiting in the room, opening the
window only once the answer arrived, which is exactly the refusable case. Now placing a direct call rings the
callee **and** opens the window, so the caller sets up mic and camera in the call while the other side is still
ringing, and initiation reads the same for every room type.

The wait therefore moves into the call window, which is also where its outcome is reported — see
[When nobody picks up](#when-nobody-picks-up). The room stops showing an outgoing popup for a call the user is
already sitting in, even though the caller's client keeps ringing the callee from there.

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

`AuthenticationCheck` also had to learn the difference between "not logged in" and "not logged in *yet*". It
decided from `useUser()` alone, which is null while a stored session is still being resumed — so a window that
opens with a session already in hand, a call popout above all, showed a login form for the few hundred
milliseconds that took. It now waits instead, on either signal that a resume is under way: `isLoggingIn` once
Meteor has started one, or a stored login token for the instant before that. A token that turns out to be stale
is cleared when the resume fails, which lands as an ordinary logged-out visitor, and a forced login always goes
straight to the form.

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

## Members Panel

Who is on the call and where each of them stands. It shares the side panel with the chat — **one at a time**,
since two side panels would leave the call a sliver — and it is the one open by default: on arriving in a call
the useful question is who else is here, and for the caller of a call still ringing it is the only place that
answers it. A bar button switches between the two, and the provider bridge's chat commands act on the chat
specifically rather than closing whatever happens to be open.

It is split in two — **In call** and **Not in the call** — because the halves answer different questions: who is
here, and who still isn't. A section nobody is in isn't shown. Rows are shaped like the room's own members list
(avatar, name, `@username`, presence) so the two read the same way, and members in the call need no label beyond
the section they are in.

For the rest, one status from `getConferenceMemberStatus`:

| Status | Meaning |
|---|---|
| **Ringing** | rung within the last 15s, and hasn't answered yet |
| **Waiting for answer** | rung longer ago than that, and never answered |
| **Declined** | dismissed the ring |
| **Left** | joined and left since |

The entry accumulates rather than replaces — `joined` never goes back to false, and a decline stays recorded
after the person changes their mind — so the fields are read in order of what happened *last*. Being in the call
beats everything; having left beats an earlier decline, since they did answer.

Members who can't read the chat carry an icon beside their name — beside, because it qualifies who that person
is in the call, and a second line pushed every row apart for something most members never have. It is the one
thing about a member the other participants can act on (from the notice above the call). Anyone not currently in the call can be **rung individually**,
including someone who declined or left — "call them back" is exactly that case.

The ring button is offered only when there is something to ask for: not while they are in the call, and not
while their phone is *already* ringing. `ringingAt` on the entry is what makes that knowable to everyone rather
than only to whoever pressed the button — every ring records itself, including the one that starts a direct
call. A ring stops on its own with nothing to announce it, so each row wakes itself when its window is up and
offers the button again.

The bar carries two counts: how many people are in the call, and what is unread in the chat while it is closed.
The unread one goes through `useUnreadDisplay`, the sidebar's own rules, so a mention reads as urgent in both
places and a muted room stays quiet in both. The members count is deliberately `secondary` — a count of who is
here is information, and a red badge would read as a problem.

Knowing what is unread needs the room's subscription, and that is the **page's** business rather than the chat
panel's: the badge exists precisely when that panel is closed, and a panel that isn't mounted can't keep
anything fresh. `useConferenceSubscription` seeds it and follows `subscriptions-changed` for the life of the
page. Nothing else would: the conference renders outside the main app, so the sidebar's own watcher never starts.

This panel is where the membership model becomes visible at all: before it, a decline was recorded and an
outside member counted in aggregate, with nowhere to see either against a name.

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

## Leaving a Call

A conference has no natural end when the provider doesn't report one, so closing the call window is the signal.
`useLeaveConferenceOnClose` posts `POST /v1/video-conference.leave` on `pagehide`, and `leaveCall` decides what
it means:

- The member's entry gets a `leftAt`. Leaving is neither declining nor un-joining — membership and `joined` both
  stand, so they keep their history entry and can rejoin, which clears `leftAt`.
- If nobody is left in the call, the conference **ends**, which is what writes everyone's call history.

"Left in the call" is `isInVideoConference` — joined, and not left since. `joined` never goes back to false
(it records that they were there), so presence has to be that pair. A member who was added and never joined
doesn't hold a call open, so an unanswered ring can't keep one alive forever.

Ending is a consequence of the call being empty, never of one participant asking for it — the same rule
declining follows. The expiry cron remains the backstop for the cases a browser can't report: a crash, a lost
network, a killed tab.

`pagehide` rather than `beforeunload`: it fires for the bfcache case too and doesn't suppress the cache. The
request needs `keepalive`, because the document is being torn down and an ordinary `fetch` dies with it;
`sendBeacon` would be the usual tool but can't carry the auth headers the REST API needs.

> Verified end to end against a running workspace. Placing a DM call and closing the call window ended the call
> and wrote both history items — `ended`/`outbound` for the caller, `not-answered`/`inbound` for the callee who
> never answered, which is the case that used to leave no trace at all. Leaving a call with another member still
> in it set `leftAt` and left the call running, writing nothing.

## When nobody picks up

Because the caller lands in the call window immediately, that window is where they find out the call went
nowhere. `useCallOutcome` watches the other members and reports one of two things:

| Outcome | When |
|---|---|
| **declined** | every other member has declined *this* ring. A decline is an answer, so this is reported at once |
| **unanswered** | nobody else is present once the ring has had its chance |

How long "its chance" is depends on which ring it was. The first attempt gets 40s, longer than both things that
ring it: the caller's client republishing (30s) and the server's own direct-call timeout (40s). A ring the user
asked for gets 15s, because a server-originated ring is one-shot — the callee's client aborts it after 10s and
nothing repeats it, so waiting the full window would leave the caller in front of a call that stopped ringing
half a minute ago.

"Declined *this* ring" matters because `declined` never goes back to false. Taken at face value, a member who
declined once would keep the call reported as declined forever, and ringing again would put the modal straight
back up instead of waiting to see what they do this time. So each ring records which decline each entry already
showed — `declinedAt` is what changes when they decline again — and only a different one counts. Comparing the
recorded values rather than "declined before now" keeps it honest across the gap between the server's clock and
the browser's.

Nothing is reported while anyone else is present, or when there is nobody else to wait for — a conference
started in a channel rings nobody in particular, and silence there isn't an outcome. A member who joined and
left counts as unanswered rather than declined: they are absent, but they did answer, and saying they declined
would be untrue.

`CallOutcomeModal` goes through the app's modal region (`useSetModal`), which is what puts it in a portal over a
backdrop with focus trapped. Rendered inline it sat in the page's flex column and pushed the call and the chat
panel down the screen. It offers the three things the caller might reasonably want — **stay**, **ring again**, or
**leave**. Closing the window for them would be presumptuous, and a call window that vanishes reads as a crash.
Ringing again is offered only for a direct call, since that is the only case where a particular person was
called.

`POST /v1/video-conference.ring` rings every member who isn't in the call, which includes someone who joined and
left — "call them back" is exactly that case. It exists because a ring is one-shot and adding an existing member
again rings nobody, so there was previously no way to try a second time.

On the receiving side, a fresh ring has to survive a **dismissal**. Dismissal exists to stop the caller's client
re-ringing someone with the `call` it publishes on a loop, and it deliberately outlives the call — so a callee
who had declined or let the ring time out was refusing to ring again, and "Ring again" arrived silently. A
server-originated `ring` now clears it, since it is the opposite thing: a deliberate new attempt. The caller's
own repeats stay suppressed.

The desktop notification that accompanies a ring is explicitly silent (`audioNotificationValue: 'none'`). The
ringing popup plays the ringtone; left unset, the notification would also play the new-message sound, so a call
announced itself as a message arriving.

Membership state reaches the window over the conference stream: `membersUpdated` fires whenever someone joins,
declines, leaves or is added, and the window re-reads the conference.

> Verified end to end: placing a DM call opened the call window at `/conference/:id` immediately, with the callee
> registered as a member at `joined: false` while still ringing and the room showing no outgoing popup. After the
> ring window the call window showed "Nobody answered", naming the callee, with **Leave call**, **Stay in the
> call** and **Ring again**; ringing again succeeded and restarted the wait.

### Being called makes you a member

Starting a direct call registers the callee as a member with `joined: false`, exactly as being added to a group
conference does. Without it the callee only appeared once they answered, so nothing could tell "still ringing"
from "nobody was called" — and a call they missed left them no history entry at all. Now a missed 1:1 call shows
up in their call history as `not-answered`, which is the whole point of a call log.

## Chat Access

`video-conference.info` carries a `chatAccess` descriptor: the room the chat lives in (`discussionRid || rid`), its display name and type, which members can't read it, and whether that room can take new members (`canInvite`).

Access isn't always a subscription question — a plain public channel is readable by anyone — so a plain public channel and a plain private room (group or DM) are each answered from one `Subscriptions` query for all the member ids at once: a public channel is free for everyone except anyone explicitly banned from it, a private room needs an actual (non-invited) subscription. A room that belongs to a team, is a discussion, or carries ABAC attributes can grant access through paths a subscription read doesn't see (team membership, the parent room's own rules, an ABAC decision), so those still ask `canAccessRoomIdAsync` once per member, exactly as before.

`ChatAccessNotice` surfaces the situation to participants who *can* read the chat, and hides itself from the members it is about — they can't resolve it for themselves. It counts only members who have **joined**: someone merely invited may never turn up, and a banner about a person who isn't there asks everyone else to fix a situation that hasn't happened.

It sits above the call and both panels, not inside either. The situation is about the call rather than about whichever panel happens to be open, and a banner that moved as panels changed would read as a different message each time.

`POST /v1/video-conference.share-chat` applies the remedy, taking a `mode`:

| `mode` | Effect | `discussionRid` |
|---|---|---|
| `'invite'` | The missing members are added to the chat's room, exposing its whole history | unchanged |
| `'discussion'` | The chat moves to a fresh discussion carrying the union of the room's members and the conference's | the new discussion |
| omitted | The room's own rules decide: `invite` when it can take members, otherwise `discussion` | as above |

`invite` is refused for a room that can't take new members, re-derived server-side rather than trusted from the client. The room is asked with `allowMemberAction(room, RoomMemberActions.INVITE, uid)` rather than tested for `t === 'd'`: the room type owns that rule, and it covers cases the type check misses, such as a federated DM that *can* grow.

Which action leads in the modal is a privacy judgement — see [Resolving chat access is the user's call](#resolving-chat-access-is-the-users-call).

Discussion type comes from `roomCoordinator.getRoomDirectives(parent.t).getDiscussionType(parent)`: `'c'` for a public channel (`'p'` if it belongs to a private team), `'p'` for everything else including DMs. Nesting is always flattened — `getRoomForDiscussion` walks `prid` up to the top-level room, so discussions never nest inside discussions.

### Historical: the keep-history choice

Adding used to ask **Keep chat history** up front and act on the answer immediately — the choice `share-chat`
now offers as a remedy instead, because forcing it on whoever adds a participant demands a decision before
anyone knows whether it matters, and a DM had no valid answer to give.

Moving it also fixed a divergence: the two paths disagreed about which room to build from, so once a conference
had moved into a discussion, a second "don't keep history" add rebuilt from the **original** room and dropped
everyone added since. Both now build from `discussionRid || rid`, and `assignDiscussionToConference` subscribes
the union of the room's members and the conference's, so a new discussion contains everyone involved.

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
| POST | `/v1/video-conference.leave` | Record that the caller left; ends the conference when nobody is left in it |
| POST | `/v1/video-conference.ring` | Ring the members who aren't in the call again |
| POST | `/v1/video-conference.join` | Join a conference — accepts `discussionRid` members |
| POST | `/v1/video-conference.share-chat` | Give the members who can't read the chat access to it (`mode: 'invite' \| 'discussion'`) |
| GET | `/v1/video-conference.info` | Conference info — accepts `discussionRid` members; carries `chatAccess` |
| GET | `/v1/video-conference.list` | Paginated history, with discussion title / last message |

## Streams

| Stream | Event | Payload | Authorized for |
|--------|-------|---------|----------------|
| `video-conference` | `<callId>/discussionUpdated` | `{ discussionRid }` | conference members, or anyone who can read the chat's room |
| `video-conference` | `<callId>/chatAccessUpdated` | — | same |
| `video-conference` | `<callId>/membersUpdated` | — | same |

## Why membership exists

The prose above describes the shipped behaviour. This section is the record of *why* it is shaped that way,
plus the follow-up work deliberately left out. The phase-by-phase plan it was built from lives in the git
history and is not repeated here.

### The problem it solved

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
| 8 | "External" (a member with no access to the chat) is **derived**, not stored, so it stays true as access changes. It is surfaced per member in the members panel and in aggregate by the chat-access notice. |

### Future work (not in scope)

- **Non-user participants.** Members are registered Rocket.Chat users only, for now. Representing SIP
  extensions, phone numbers, external email addresses, or participants derived from a calendar event is
  wanted later. `IVideoConferenceUser extends Pick<Required<IUser>, '_id' | 'username' | 'name'>` — required
  `username` *and* `name` — so that constraint has to relax when it happens. Adding a nullable `source`
  discriminator to the entry while Phase 1 is being written costs nothing and avoids a migration later.
- **Docking the ringing widget.** Decision 5 keeps the current floating overlay for every case. Docking it
  over the room list, with a floating fallback when the list isn't visible, was considered and deferred. It is
  also the better answer to [a ring being missed entirely](#the-ring-can-still-be-missed-entirely).

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
| Leaving ends an empty call and writes history; a direct call qualifies; no duplicates; a reload doesn't end it | `apps/meteor/tests/unit/server/services/video-conference/leaveCall.spec.ts` |
| Adding registers without touching rooms, skips existing members, rings the batch, respects the cap | `apps/meteor/tests/unit/server/services/video-conference/addMembers.spec.ts` |
| A decline is recorded and never ends the call | `apps/meteor/tests/unit/server/services/video-conference/declineCall.spec.ts` |
| Which room types can be answered from one subscription read, and which still can't | `apps/meteor/tests/unit/server/services/video-conference/getChatAccess.spec.ts` |
| Who counts as still in the call, and which conferences get history | `apps/meteor/tests/unit/lib/videoConference/callHistory.spec.ts` |
| Leaving is reported on `pagehide`, with `keepalive`, and on demand | `apps/meteor/client/views/conference/hooks/useLeaveConferenceOnClose.spec.ts` |
| Declined vs unanswered vs still-ringing, and that ringing again restarts the wait | `apps/meteor/client/views/conference/hooks/useCallOutcome.spec.ts` |
| A direct call opens its window on the click, still rings, and stops the room reporting "calling"; a fresh ring survives a dismissal | `apps/meteor/client/lib/VideoConfManager.spec.ts` |
| Member statuses, and who can be rung back — including not while their phone is ringing | `apps/meteor/tests/unit/lib/videoConference/memberStatus.spec.ts` |
| The members panel: sections and counts, statuses, the no-access tag, per-member ring, adding people | `apps/meteor/client/views/conference/CallMembersPanel.spec.tsx` |
| What the outcome modal offers, and that a refused ring doesn't restart the wait | `apps/meteor/client/views/conference/CallOutcomeModal.spec.tsx` |
| One panel at a time, members open by default, and the provider's chat commands | `apps/meteor/client/views/conference/hooks/useProviderCallBridge.spec.ts` |
| Who gets rung again, and who doesn't | `apps/meteor/tests/unit/server/services/video-conference/ringMembers.spec.ts` |
| Which mode wins, and that an impossible invite is refused rather than swapped | `apps/meteor/tests/unit/lib/videoConference/chatAccess.spec.ts` |
| Which action leads, and that a DM only offers the discussion | `apps/meteor/client/views/conference/ChatAccessModal.spec.tsx` |
| The incoming popup renders for a room the member can't see | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopups.spec.tsx` |
| Which side of the chat-access split each participant sees | `apps/meteor/client/views/conference/ConferenceChat.spec.tsx` |
| That a window resuming a session waits rather than flashing the login form | `apps/meteor/client/views/root/MainLayout/AuthenticationCheck.spec.tsx` |
| Who the notice is shown to, that it ignores members who never joined, and that Review opens the modal | `apps/meteor/client/views/conference/ChatAccessNotice.spec.tsx` |
| Both stream events refetch the conference; the chat follows a discussion | `apps/meteor/client/views/conference/hooks/useConferenceEmbedded.spec.tsx` |
| The chat subscription is seeded and followed for the life of the page | `apps/meteor/client/views/conference/hooks/useConferenceSubscription.spec.ts` |
| Adding works without the room, and posts the usernames | `apps/meteor/client/views/conference/AddParticipantsModal.spec.tsx` |
| The membership update *shapes* — the `$addToSet` trap | `packages/models/src/models/VideoConference.spec.ts` |

There is also an end-to-end REST suite at `apps/meteor/tests/end-to-end/apps/video-conference-membership.ts`,
covering the endpoints against a real server and real Mongo: membership without room access, authorization by
membership, decline, leave, ring, `chatAccess`, and both `share-chat` modes. It follows the provider-app harness
in `apps/meteor/tests/end-to-end/apps/video-conferences.ts` (a test app supplies the conference provider) and is
EE-gated, since a private app is never enabled outside EE.

> It has **not** been run locally: the API suite authenticates as the fixture admin
> `rocketchat.internal.admin.test`, which a real development workspace doesn't have. It is type-checked, and CI
> seeds that user. Treat its first CI run as the real one.

There is also an end-to-end REST suite at `apps/meteor/tests/end-to-end/apps/video-conference-membership.ts`,
covering the endpoints against a real server and real Mongo: membership without room access, authorization by
membership, decline, leave, ring, `chatAccess`, and both `share-chat` modes. It follows the provider-app harness
in `apps/meteor/tests/end-to-end/apps/video-conferences.ts` — a test app supplies the conference provider — and
is EE-gated, since a private app is never enabled outside EE.

> It has **not** been run locally. The API suite authenticates as the fixture admin
> `rocketchat.internal.admin.test`, which a real development workspace doesn't have; it is type-checked, and CI
> seeds that user. Treat its first CI run as the real one.

`packages/models/src/models/VideoConference.spec.ts` stubs `BaseRaw`, which participates in a circular
import that leaves it uninitialized when the module is loaded directly by jest.

Where the seams are drawn matters: `resolveChatAccessMode` and `chatAccessLeadsWithDiscussion`
(`apps/meteor/lib/videoConference/chatAccess.ts`) exist as pure functions **shared by the server's default and
the modal's primary button**, so the rule is tested once and the two can't drift. `VideoConfService` itself is
not unit-tested — proxyquiring it means stubbing some thirty modules, one of which opens a Mongo driver at
import time — which is why the decisions worth pinning down were moved out of it.

### Nothing else "ends" a Jitsi conference

`endCall` runs when something tells Rocket.Chat the call is over. For a third-party provider, nothing does:
the Jitsi app never reports an end, so before closing the window became a signal, conferences sat at `STARTED`
until `videoConferencesCron` expired them a day later — and the expire path wrote no history at all. Both gaps
are closed: leaving ends the call when nobody is left, and expiry writes history as a backstop.

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

### Deliberate limits

Not gaps — choices, recorded so they aren't mistaken for oversights.

- **`add-participants` is capped at 10 users per call.** That cap is what guarantees an add always rings, since
  the whole batch fits inside the ringing limit. Adding more means several requests.
- **Ringing is decided per call event, not per call.** Starting a conference rings the room's subscribers, so a
  large room rings nobody; adding rings just the people added.
- **Membership never expires and is additive-only.** Leaving, declining and rejoining all annotate the entry
  rather than removing it, which is what makes the call log and the members list possible after the fact.

What remains genuinely unfinished is under [Improvement suggestions](#improvement-suggestions).


## Improvement suggestions

What is still thinner than it looks. Everything previously listed here that has since been built — the members
panel, ringing a member again, reporting what an add actually did, the reload grace period, cheaper chat-access
reads — is described in the sections above instead.

### The ring can still be missed entirely

A server ring fires once and gives up after 10s, and the caller's own repeats stop at 30s. Being added is also a
desktop notification, which covers a backgrounded tab, but someone with notifications denied and no client on
screen has no signal beyond finding the conference in their call history afterwards.

The deferred docked ringing widget (decision 5) is the intended answer. Repeating the server ring for a bounded
window would be the cheaper one.

### `share-chat`'s invite path is all-or-nothing

`addUsersToConferenceRoom` hands every missing member to `addUsersToRoomMethod` in one call. If it throws for
one of them, the caller gets an error toast; the others may or may not have gone through. It is not silent — the
notice re-reads and shows whoever is still missing — but the toast says less than it could. Per-user results
would make a partial outcome legible at the moment it happens.

### The members panel has no search

Fine at conference scale, and the list is split into sections that keep it readable. A room's own members list has
a search box and a role filter; if conferences ever carry dozens of members, that is the shape to copy.

### The autocomplete's exclusion list is capped

`AddParticipantsModal` excludes the room's existing members from its suggestions, reading at most 100 of them. In
a bigger room existing members can therefore be offered; selecting one is harmless — the server skips them and
the modal now says so — but it is a suggestion that shouldn't have been there.

### Access lost mid-call falls back to "not found"

The chat panel decides between the room and the not-shared explanation from `chatAccess`, which is only as fresh
as the last read. A member removed from the room *during* a call still has the room attempted, and gets
`ConferenceRoomPreload`'s not-found fallback until the next read. Rare, and self-correcting.

### No conference detail view in call history

Clicking a conference row in the personal call history opens its room, which is the useful action. Deep-linking
straight to `/call-history/details/:historyId` for a conference still falls through to the generic "call info
could not be loaded" panel, because the detail panel is contact-call-shaped.

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
| Chat access | `apps/meteor/client/views/conference/ChatAccessNotice.tsx`, `ChatAccessModal.tsx`, `ConferenceChatNotShared.tsx` |
| Call outcome | `apps/meteor/client/views/conference/CallOutcomeModal.tsx`, `hooks/useCallOutcome.ts`, `ConferenceMemberRow.tsx` |
| Leaving | `apps/meteor/client/views/conference/hooks/useLeaveConferenceOnClose.ts` |
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
