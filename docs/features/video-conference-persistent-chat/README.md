# Video Conference Persistent Chat

## Overview

Persistent chat gives a video conference a Rocket.Chat room that lives alongside the call, so the conversation survives after the call ends. Instead of handing the user off to the provider's own page, joining a conference opens an in-product page at `/conference/:id` — the provider's call in an iframe, a control bar along the bottom, and the conference's chat in a collapsible panel docked to the inline end.

The chat room is resolved from the conference record: `discussionRid` when a discussion exists, otherwise the conference's `rid` (the room the call was started in). A conference's `rid` never changes; only `discussionRid` moves.

Gated by the EE setting `VideoConf_Enable_Persistent_Chat` (requires `Discussion_enabled`, module `videoconference-enterprise`).

## The flows at a glance

Four diagrams covering a call's life. They describe the feature with persistent chat **on**; with it off none of it
applies — see [Opening a Conference](#opening-a-conference) for what happens instead.

| | |
|---|---|
| [Starting a call](./starting-a-call.svg) | the camera button, the preflight, and what confirming creates |
| [Being called](./being-called.svg) | accept, decline, silence or ignore — and where each leaves the call |
| [Adding people and chat access](./adding-people-and-chat-access.svg) | who can read the chat, and the two ways to fix it |
| [Ending a call](./ending-a-call.svg) | the four ways a call stops, and what the history records |

[How this compares to MatrixRTC](./matrix-comparison.md) sets our answers to "who is in this call" and "who may
join it" against Matrix's, and lists the three things worth borrowing.

<img src="./starting-a-call.svg" alt="Starting a call: the camera button opens a call window at /conference/new showing a preflight; nothing is created until the user confirms, after which the conference exists and the other side rings." width="680">

<img src="./being-called.svg" alt="Being called: a ring reaches you in your call list or as a notification; accepting joins outright, declining is recorded against your own membership only, silencing stops the sound, and ignoring lets the ring lapse after 15 seconds." width="680">

<img src="./adding-people-and-chat-access.svg" alt="Adding people: someone already in the room can read the chat, someone from outside cannot; once they join, a notice offers either adding them to the room or moving the chat to a discussion, depending on the room type." width="680">

<img src="./ending-a-call.svg" alt="Ending a call: the last person leaving, joining another call, or the 24-hour expiry all end it; an emptied call waits ten seconds so a reload survives, and each member's history row settles to ended or not-answered." width="680">

## Opening a Conference

**Placing a call** (`startCall`) with persistent chat on posts *nothing*. It opens the call window at
`/conference/new?rid=…`, and the conference is created there, by the [preflight](#the-preflight-screen). Without
persistent chat it goes through `VideoConfManager.startCall` as it always has.

The room's call button goes straight there. It used to open a popup to confirm and set devices first, which the
preflight now does with the user able to see what they are joining — two confirmations for one call. The popup
remains the only place to set devices when there is no preflight, so it is still what an unconfigured
persistent-chat workspace gets.

**Joining one that exists** (`joinCall`) emits `call/join`:

- **Persistent chat enabled** — `{ callId }`, and again nothing is posted: the conference page joins for itself
  once its preflight is confirmed.
- **Disabled** — `POST /v1/video-conference.join` first, then `{ url, callId, providerName }`, the pre-existing
  behavior.

`VideoConfProvider` handles `call/join` by opening `/conference/:id` (absolute URL) with persistent chat on, or
the provider URL without it, and `useVideoConfOpenCall` opens the window. On desktop,
`openInternalVideoChatWindow` takes over.

### The window opens on the click

Every call type opens its window **on the click that asked for it**, inside the browser's user-activation window.
`window.open` from anything later — a stream event, a timer — is something the browser is entitled to refuse, and
`VideoConfBlockModal` then has to ask the user to click again for a window they already asked for. A direct call
used to be the exception: it rang the callee and kept the caller waiting in the room, opening the window only once
the answer arrived, which is exactly the refusable case.

So the wait moves into the call window, and the room stops showing an outgoing popup for a call the user is
already sitting in. Telling the caller that nobody picked up is [deferred](#deferred-to-follow-ups); for now the
members panel shows the other side still ringing.

### When the callee is rung

Creating a direct call is not asking anyone to answer it. The caller lands on the [preflight](#the-preflight-screen)
first, so the ring waits for them to actually enter the call: `addUserToCall` rings the other side when the
**caller** arrives, and only members who have never been rung — a rejoin rings nobody. A second attempt is what
the members panel's per-member *ring* is for.

Being rung into a call whose caller is still choosing a camera means answering to an empty room, which is what
this avoids. The screen says as much before it happens ("Alice will be notified when you start the call") and the
button is the call itself rather than a join.

With persistent chat **off** there is no preflight to wait for, so nothing changes: the caller's own client rings
the callee from the room, on the 1:1 handshake it always used.

### How the call window is opened

A call opens as a **popout** — a dedicated window sized to 1280×800 (capped to the available screen) and centred — mirroring the desktop app's dedicated video window and keeping the call visible while the user works in the main app. If the popout is refused, it falls back to an ordinary **tab**; some browsers and extensions block popup-shaped windows while still allowing a plain one. Only if both are blocked does `VideoConfBlockModal` ask the user to allow it.

`noopener` is deliberately **never** in the features string: it makes `window.open` return `null`, which is indistinguishable from a blocked popup, and the opener link is what lets the main app notice the call window closing (see [The window that opened the call watches it](#the-window-that-opened-the-call-watches-it)).

Same-origin (in-product) conferences share a named window, `rocketchat-conference`, so repeated joins reuse it instead of stacking duplicates:

| State of the shared window | Behaviour |
|---|---|
| already showing this conference | focused without reloading (empty URL) and **without features**, so a window the user has arranged is not resized or recentred |
| showing a different conference | navigated to the new one |
| closed, or never opened | opened fresh as a popout |

Whether it is showing this conference is decided by reading the window's actual `location.pathname`, not the URL we last passed — those differ in string form between the start and join paths.

External provider URLs (persistent chat off) get their own popout each time, unnamed.

## The preflight screen

Opening the call window and being in the call are two different things, and the window opens first. What it shows
until the user says otherwise is `ConferencePreflight`: what the call is called, the devices they will arrive
with, and — for whoever started a group call — a field to name it.

### Nothing exists until it is confirmed

Clicking *call* in a room used to create the conference: a message in the room, a ring, a call in everyone's
history — for a call the user might still walk away from. Now the click only opens the window, at
`/conference/new?rid=…`, and `ConferenceStartPage` runs the preflight against the *room*: the name to offer comes
from the reader's own subscription (which is what names a DM after the other person), the devices from
`video-conference.capabilities`. Confirming posts `start` and then `join`, hands the join result to the conference
page through the query cache, and replaces the URL with `/conference/:callId` — so a reload lands on the call
rather than starting a second one, and the page doesn't ask the same questions again.

**Cancel** sits beside the confirm button and closes the window. On the start screen that leaves no trace at all,
because nothing was created; on a call that already exists it reports leaving first.

### Why the join waits

The window has to open on the click, as above. The *join*, though, is what turns mic and camera into the
provider's URL and what marks the user as present in the call — so it waits here instead:

- `VideoConfManager.joinCall` posts nothing when persistent chat is on — it only opens the window. Posting there
  would throw away the URL it returns and count the user as present in a call they have not chosen to enter yet.
- `useConferenceEmbedded` joins as a mutation, from the preflight's confirmation, carrying the preferences it was
  given.

Devices are configured **only** here. The room's start-call and incoming-call popups used to ask, seconds before
a window opened, and then the conference page joined with a hardcoded `{ mic: true, cam: false }` regardless —
so the popups now leave the question alone whenever persistent chat is on. With it off there is no preflight to
ask, so those controls stay exactly as they were.

What is on offer is what the provider can be told: today the pair it takes, on or off. They sit in `CallBar`, the
same bar the call's own controls occupy, so the control that mutes the mic doesn't move between deciding to join
and being in the call. A native provider will put input and output selection in the same place.

### What the screen says it is

A title, because the same screen serves four situations and they are not interchangeable: *Start a new
conference* / *Start conference with Alice* when nothing exists yet, *Join the conference* / *Join conference with
Alice* when it does. The confirm button follows suit — **Start call**, **Call Alice**, or **Join call**.

The name field sits above the tile, because it is the one thing here that is about the *call* rather than about
how the user shows up in it, and it carries no label: the field is its own label, prefilled with *Meeting in
&lt;room&gt;* for a conference that doesn't exist yet. The room's name is not repeated anywhere else on the screen —
it is either in the title or in that field.

### No self-view, on purpose

Where a preview would sit, the screen states what will happen: *your camera is turned off*, or *your camera will
be on* plus where the devices themselves are chosen. There is no `getUserMedia`, so no permission prompt and no
camera held open while the provider is about to ask for the same one.

That is not a shortcut — a preview would be a lie about the control on offer. All a provider can be told is
whether to start with camera and microphone on; *which* camera, which microphone, which speaker is settled inside
the provider's own UI. A self-view would promise a choice this screen cannot make, and could show a camera the
call never uses. A native provider, able to take a device per stream, is what makes a real preview honest — and
the same tile is where it will go.

### Naming the call

A group conference is named on the way in: the field is prefilled with the room's name, and confirming carries it
to `start` as the conference's title. For a call that already exists — its creator opening the preflight again —
the same field goes to `POST /v1/video-conference.rename`, which sets the title of a running **group**
conference, for the person who started it. A direct call has no title of its own — it is named after the other person, per viewer — and a title everyone
in the call could rewrite is a title nobody can rely on.

The name matters beyond the label: it is what the provider is told to call the meeting (`customCallTitle`, read
at join time — which is *after* the preflight), and what the call is listed as in the sidebar and in call history.
The field is prefilled with what the call is called today, which for a fresh conference is the room it was started
in. Renaming is not worth failing a join over: if it doesn't take, the error is surfaced and the user goes into
the call anyway, which is what they actually asked for.

## Layout

The conference renders **standalone**, without the app's navigation chrome.

`LayoutWithSidebar` (NavBar + Sidebar + `MainContent`) is applied by `MainLayout`, not by the authentication chain. This matters: `AuthenticationCheck → LoggedInArea → UsernameCheck → PasswordChangeCheck → TwoFactorAuthSetupCheck` is shared by every authenticated route, so anything it renders would also appear on the conference page. `TwoFactorAuthSetupCheck` therefore returns `children` directly.

The conference route is the only consumer of `AuthenticationCheck` outside `MainLayout`; every other route (including dynamic admin/account/room/audit groups) wraps in `MainLayout` and keeps the chrome.

`AuthenticationCheck` also had to learn the difference between "not logged in" and "not logged in *yet*": it
decided from `useUser()` alone, which is null while a stored session is still being resumed, so a window opening
with a session already in hand — a call popout above all — flashed a login form for as long as that took. It now
waits on either signal that a resume is under way (`isLoggingIn`, or a stored login token for the instant before
that); a stale token is cleared when the resume fails, landing as an ordinary logged-out visitor, and a forced
login still goes straight to the form.

The chain's *loading placeholder* needed the same treatment. `UsernameCheck` shows `HomeSkeleton` — a whole fake
app shell — while it resolves the user, so `AuthenticationCheck` and `UsernameCheck` take an optional `loading`
node, defaulting to `HomeSkeleton` so no existing route changes. The conference route passes `PageLoading`, which
is also what the conference shows while joining, making startup one continuous state rather than two.

Because it has no `MainContent` ancestor to inherit height from, `ConferenceRoute` establishes the `100dvh`/`100%` box the conference fills. The route is also wrapped with `appLayout.wrap(..., { embedded: true })`, which drops the global banner and cloud-announcement regions.

### Call chrome

The conference is a column: a row holding the call and the chat panel, then `CallBar` beneath it.

`CallBar` is the in-call control bar pinned along the bottom — the position third-party providers put their own toolbar in, so an embedded provider and the future native conference read the same. Its actions sit at the inline end, away from wherever the provider puts its own. Today that is the members and chat toggles (the chat one carrying an unread badge while its panel is closed). When the native conference brings mic, camera and hang-up of its own they will want the centre of the bar, which is the point at which what the centre needs will be known rather than guessed at.

`CallPanel` is the product's own `Contextualbar`, so a panel beside a call has the same edges and elevation as one beside a room; it is a **sibling of the call area, not a child of the bar**. That is what makes toggling the chat animate its own width without ever reflowing the bar — the bar stays full width and fixed in place by construction, not by careful sizing. Its inner box keeps full width while the outer collapses, so content slides instead of reflowing mid-animation. On viewports narrower than `md` it floats over the call instead of taking width from it.

The panel is docked to the inline end, so its close button sits at the far end of its header — matching every other closable surface in the product. Both panels share that header (`CallPanelHeader`, the contextual bar's own header/title/close), so two docked side by side can't disagree about where their own edges are.

The bar carries two counts: how many people are in the call, and what is unread in the chat while its panel is
closed. The unread one goes through `useUnreadDisplay`, the sidebar's own rules, so a mention reads as urgent in
both places and a muted room stays quiet in both. The members count is deliberately `secondary` — a count of who is
here is information, and a red badge would read as a problem.

Knowing what is unread needs the room's subscription, and that is the **page's** business rather than the chat
panel's: the badge exists precisely when that panel is closed, and a panel that isn't mounted can't keep anything
fresh. `useConferenceSubscription` seeds it and follows `subscriptions-changed` for the life of the page. Nothing
else would — the conference renders outside the main app, so the sidebar's own watcher never starts.

## Route Behavior (`/conference/:id`)

| Condition | Renders | Auth |
|-----------|---------|------|
| `?callUrl=` present | `ConferencePage` — hands off to the provider's external URL | `guest` allowed |
| `:id` is `new`, with `?rid=` | `ConferenceStartPage` — the preflight for a conference that doesn't exist yet | authentication required (`guest={false}`) |
| `:id` present | `ConferenceEmbeddedPage` — call + chat split view | authentication required (`guest={false}`) |
| neither | `ConferencePageError` | — |

Guests can't be members of the conference's room, so the embedded page requires a real account. A user without access to the conference's room gets `ConferenceUnauthorizedPage`, which logs out **without navigating away**, so re-login returns to the same conference. It and `ConferencePageError` are the same `ConferenceStatePage` with different words: the window is all the user has, so both keep the conference header and carry whatever way out they have.

## Chat Panel

The conference page renders one room outside the main app, so the cached stores the room UI reads from are never populated by the sidebar's subscriptions:

- `ConferenceStoresReady` marks the cached stores ready. That is all it does: the room UI waits on them being
  *ready*, not on them being full, and the one room in play is fetched by `useOpenRoomById` below. It used to
  fetch that room here as well, which meant two `rooms.info` for the same room a moment apart.
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

The ring button is offered only when there is something to ask for: not while they are in the call, and not while
their phone is *already* ringing (`canRingConferenceMember`). `ringingAt` on the entry is what makes that knowable
to everyone rather than only to whoever pressed the button — every ring records itself, including the one that
starts a direct call. A ring stops on its own with nothing to announce it, so the row wakes itself when its window
is up, through the same `useRingingExpiry` the calls list uses.

This panel is where the membership model becomes visible at all: before it, a decline was recorded and an outside
member counted in aggregate, with nowhere to see either against a name.

## Confined Navigation

The chat panel is a full room UI, so a link, channel reference or user mention would navigate the conference window away from `/conference/:id` and **tear down the call**. `useConfinedNavigation` pins the window to the conference, covering both interaction paths:

- **`<a href>` clicks** — intercepted on the *capture* phase, so it runs before React/router handlers. Left alone: modified/non-primary clicks, `target` other than self/top/parent, `download`, non-http(s) protocols, and same-path URLs (`?jump=<msgId>`, `#hash`) which the app handles in place.
- **Programmatic `router.navigate`** — mentions and room links don't go through an anchor, so the shared `navigate` is monkey-patched. The patch is idempotent (`_confined` marker) and cleanup only restores when its own wrapper is still installed, so a newer patch is never clobbered and a stale one never reinstated. Numeric deltas and same-pathname navigations pass through untouched.

Anything that would leave the conference opens in a **`noopener` new tab**, internal or external alike.

Handing internal routes to the window that launched the call would read better — the link would land in the app
the user already has open, as a client-side navigation rather than a fresh tab — but it needs a desktop bridge and
a `postMessage` handshake with the opener. That is [deferred](#deferred-to-follow-ups); a tab is the honest
one-line version until it earns its own change.

## Adding Participants

Adding someone to a conference makes them a **member of the conference**. It puts them in no room: membership is what authorizes joining the call, and being able to read the chat is a separate concern, surfaced afterwards rather than decided here. See [Chat Access](#chat-access).

`AddParticipantsModal` picks users with `UserAutoCompleteMultiple`, the same component the room's own "add users" flow uses, given an `exceptions` list. The conference's room members are excluded — they can already join, so adding them would be a no-op — and everyone else is offerable, which is the point. The exclusion list is best-effort: a member who can't read the chat has no room to enumerate, and the modal still works for them, offering everyone.

> Dial-out (typing a raw phone/SIP destination into the same field) is **not** wired up. No provider on this branch exposes a dial-out channel, so the affordance would have silently discarded the input; it was removed rather than left as dead UI. Restoring it means passing a provider-supplied `onDialOut` down to the modal.

`POST /v1/video-conference.add-participants` takes `{ callId, users }` — no `keepHistory`, no room choice — and calls `addMembers`:

- Each user who isn't already associated with the call gets a `users[]` entry with `joined: false`. Users who already have an entry are skipped, so an existing member's `joinedAt` (or `declined`) is never overwritten.
- Everyone actually added is **rung** (`notifyUser(…, 'ring', …)`). The endpoint caps a single add at `VIDEO_CONF_RINGING_LIMIT` (10) — the same constant the server rings by, which is what guarantees an add always rings, unlike starting a call in a large room where the subscriber count can exceed the cap and nobody is rung.
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
- If nobody is left in the call, the conference **ends** after `EMPTY_CALL_GRACE_MS` (10s) with nobody having come
  back — which is what settles everyone's call history. The grace period is what makes a **reload** survivable: the
  page unloading reports a leave, and for a moment the call is empty because its only participant is on their way
  back into it.

"Left in the call" is `isInVideoConference` — joined, and not left since. `joined` never goes back to false
(it records that they were there), so presence has to be that pair. A member who was added and never joined
doesn't hold a call open, so an unanswered ring can't keep one alive forever.

Ending is a consequence of the call being empty, never of one participant asking for it — the same rule
declining follows. The expiry cron remains the backstop for the cases a browser can't report: a crash, a lost
network, a killed tab.

`pagehide` rather than `beforeunload`: it fires for the bfcache case too and doesn't suppress the cache. The
request needs `keepalive`, because the document is being torn down and an ordinary `fetch` dies with it;
`sendBeacon` would be the usual tool but can't carry the auth headers the REST API needs.

### The window that opened the call watches it

A page can only report its own departure once it is running, and the user counts as being in the call before
that: `video-conference.join` is posted by the **main app**, before the call window is even opened. Accept a call
and close the window while it is still loading and nothing ever reported the leave — the user sat listed as
present in a call they never saw, holding it open.

So the opener watches the window it opened. `useLeaveCallOnWindowClose` polls `closed` once a second and posts
the leave when the window goes, which covers the whole gap: closed while loading, and closed without `pagehide`
firing at all. One call is watched at a time, since a user is in one call at a time and the window is shared —
opening the next call replaces the watch. Leaving twice is harmless, so it makes no attempt to work out whether
the page got there first, and the watch is dropped rather than fired when the main app itself goes away: that is
not the call window closing, and the call window is meant to outlive it.

Two gaps this leaves, both ending in the same place — the next join, which reconciles presence server-side (see
[One call at a time](#one-call-at-a-time)) — or the expiry cron: a popup the browser blocked outright (the user
is joined with no window at all), and the main app being closed alongside the call window.

## Being called makes you a member

Starting a direct call registers the callee with `joined: false`, exactly as being added to a group conference
does. That is what lets anything tell "still ringing" from "nobody was called", and what gives a missed 1:1 call a
`not-answered` row in the callee's history rather than no trace at all.

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

Whichever way it goes, the chat is built from `discussionRid || rid` — the room the chat is *currently* in.
Building from the room the call started in instead is how a second discussion used to drop everyone added since
the first one.

## Realtime Updates

Several things can change a conference under a participant: its chat moves to another room, the same room becomes
readable by members who couldn't read it, or its membership shifts — someone joins, declines, leaves or is added.

All of them are answered the same way: read the conference again, which carries the room, who can see it, and who
is in it. So there is **one** signal, `video-conference.updated` on the `<callId>/updated` stream key, and one
subscription that invalidates one query. It started as three events with a payload on one of them; the subscriber
registered the same callback for all three and never read the payload.

`assignDiscussionToConference` also broadcasts `notify-room/…/videoconf`, so the in-room conference message block
refreshes its "Join discussion" button. The participant who *asked* for a change invalidates locally rather than
waiting on the round trip.

The stream's `allowRead` accepts **conference membership or access to the chat's room**, the same pair `video-conference.info` accepts. Both halves matter: members may have no access to the room the call originated in, and membership alone would refuse a room member who opens the conference before their join lands — a refused subscription is never retried.

## Access Control

Every conference endpoint authorizes through one `canAccessConference` check, which accepts, in order:

1. **Conference membership** — a `users[]` entry. This is the point of the membership model: it authorizes joining the call without granting any room access.
2. Access to `call.rid`, the room the call was started in.
3. Access to `call.discussionRid`, the room the chat moved to. Someone who belongs only to the discussion has no access to the parent room, so checking only `rid` would lock them out of the call.

Because all of them share that check, `add-participants` no longer disagrees with `join` and `info` about who is allowed in. `loadAccessibleConference` is the shared prologue: it reads the call, applies the check, and answers both failures the same way — `invalid-params`, deliberately vague about which of the two it was, so a stranger can't use an endpoint to learn that a call id is real.

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

*When* items are written is [A call is in the history from the moment it starts](#a-call-is-in-the-history-from-the-moment-it-starts): from the conference's creation onward, not once at the end. `isLoggableConference` decides what belongs in a personal log at all — a group or **direct** conference does; a livechat call is the visitor's, and a VoIP conference is already logged as a media call.

`buildConferenceCallHistoryItems` (`apps/meteor/lib/videoConference/callHistory.ts`) builds one item per entry in the conference's `users[]` membership list — a room subscriber who was rung at start but never joined, was never added, and never declined has no membership entry, so gets no history item. Per member:
- `direction` is `outbound` for the conference's creator, `inbound` for everyone else.
- `state` is `ongoing` while the call runs. Ending settles it: `ended` for a member who joined, `not-answered` for one who did not. Only members get an item, and a member either joined or was rung and didn't — so not joining *is* not answering, whether they declined explicitly or ignored it. Reporting an ignored ring as a normal ended call would hide a missed conference.

All call-history items — media calls and conferences alike — live in the same `call_history` collection, so the existing `direction`/`state` filters on `call-history.list` already apply to conference items with no change. The free-text `filter` search term gains one more `$or` branch matching the conference's `title` (`CallHistoryRaw.findAllByUserIdAndSearchFilters`).

The call-history page's table dispatches a conference item to `CallHistoryRowConference` (`apps/meteor/client/views/mediaCallHistory/`) instead of the three contact-shaped rows (`CallHistoryRowInternalUser`/`…External`/`…UnknownUser`), showing the room/title and joined-participant count in place of a contact. It doesn't reuse `CallHistoryTableRow` from `@rocket.chat/ui-voip` — that component's `contact`/`duration` props are contact-call-shaped and don't apply. Clicking the row opens the conference's room directly (`useGoToRoom`), the same "Call chat" action used by the room-scoped tab above, rather than the contact-shaped call-info side panel the other rows open — so `MediaCallHistoryContextualbar`/`MediaCallHistoryExternal` were only adjusted to keep compiling against the widened `CallHistoryItem` union, not to render a conference-specific detail view. Deep-linking straight to a conference item's `/call-history/details/:historyId` (bypassing the row) still falls through to the generic "Call info could not be loaded" panel — building a dedicated detail view was left out as out of scope.

## Reaching a call without a ring

Ringing is a poor only-route into a call: it is one-shot, it lasts seconds, and a conference started in a room with
more than ten subscribers rings **nobody at all**. So a call is also reachable from a list of the calls running
now — docked at the top of the sidebar, and behind a navbar button when there is no sidebar to dock it in.

### What the list shows

Every row is something to act on: **join** it, or turn it down with the ghost **×** after it so it stops asking.
The call the reader is *already in* is left out entirely — they are in it, there is nothing to reach, and a row
reading "in call" left them with something they could do nothing about. Rows are newest first, three of them, with
a *Show all N calls* toggle for the rest and a `40vh` scroll region with that toggle outside it: this is a route to
a call, not a place to read a list.

Each row says how many people are in the call. Faces would answer the question better — whether this is a call
worth walking into — and the payload was built to carry a few participants for exactly that, but a count is what
the first release ships; see [Deferred to follow-ups](#deferred-to-follow-ups).

### A ringing call is listed, not popped

An incoming call used to take over the screen with a popup that had to be answered before anything else could
happen. It is now the first item of that same list, under an *Incoming calls* heading of its own: bigger than the
rest, with **accept** then **decline** *below* it rather than beside it — the same order as the join and dismiss on
the calls underneath. The ring still sounds. When it stops, the item settles into an ordinary row with a join
button: the call is still there, it just isn't asking any more.

**Silencing** is not answering. The bell button stops this client's ring and leaves the call exactly where it is,
so the user can decide in their own time. It only appears while there is a sound to stop — a ring this client never
heard, because the page was reloaded, has nothing to silence — and once used becomes a plain bell-off icon, which
is what says why the room went quiet. Silenced ids are remembered by `useOngoingCalls`, because the manager forgets
a dismissed call entirely and "silenced" would otherwise be indistinguishable from "never heard".

Whether a ring is still ringing is the reader's own judgement (`isRingingVideoConferenceMember` over the `ringingAt`
the joinable list carries), with `useRingingExpiry` waking the list when the earliest one is due to stop — nothing
announces that a ring *ended*, so nothing can be waited for. The list also refreshes on the ring itself rather than
on the poll: a ring *is* announced to the person being rung, and waiting up to twenty seconds to show a call that is
ringing right now would miss it entirely.

### Where the list lives

`components/OngoingCalls` is the list; both places that show it render the same component, unchanged.
`sidebar/sections/OngoingCallsSection` docks it at the top of the sidebar, asking `useOngoingCallsList` only
whether there is anything to make room for — the decline and silence wiring belongs to whoever renders the rows.

A collapsed sidebar therefore hides the only place these calls appear, including one ringing right now. Standing in
for it in the navbar is [deferred](#deferred-to-follow-ups).

### What the server answers with

`GET /v1/video-conference.joinable`, via `listJoinableCalls`. Nothing new is stored to support it: the conference
records already hold membership (`users[]`), liveness (`endedAt`) and the room. The scan is over *running*
conferences rather than over the user's rooms, so its cost follows how many calls are in progress — few — rather
than how many rooms the user is in. A sparse index on `{endedAt, createdAt}` keeps it to the calls that are live,
since a conference carries `endedAt` only once it has stopped.

A call is offered when the user is a **member** of it, or is **in the room** it belongs to. Room membership rather
than room *access*: a public channel is readable by anyone, and a call in a channel the user never joined has no
business in their sidebar. That is narrower than `canAccessConference` on purpose — the endpoints still authorize
with the broader rule, so nobody is refused a call they can reach.

Calls nobody is in are left out. A conference only stops when someone ends it or the expiry cron reaches it, so
without that filter an abandoned call would be advertised as joinable for a day.

The name comes from the conference's title, or — for a direct message, which has no name of its own — from the
reader's **own subscription**, since a DM is named after the other person and that name is per-viewer. Both fall
back to the room. One subscription query answers this and the room-membership question together. The payload
carries nothing else: a list needs enough to decide whether to walk in, and joining goes by `callId`.

### A call is in the history from the moment it starts

The history is the one list of calls, so a call in progress is a row in it rather than a section above it. That
means writing it when it starts, not when it finishes: `recordConferenceInHistory` upserts an item per member as
the conference is created, again whenever membership moves (someone joins, is added, declines), and once more when
it ends.

While it runs, every member's row says the same thing — `ongoing` — because a member's own outcome doesn't exist
yet. Ending is what settles it into `ended` or `not-answered` per member, along with the count of who was actually
there. `{ uid, callId }` is unique in `call_history`, which is what makes writing repeatedly harmless: an app can
resend `ENDED`, the expiry cron runs every three hours, and membership can move a dozen times.

Two things fall out of this. Someone who was rung and never answered has a row while the call is still running, so
turning a call down is not the end of it — the row is the way back in. And the client needs no second source: the
table's rows, its filters and its states all come from `call-history.list`, with `ongoing` a state like any other.

The sidebar keeps using `video-conference.joinable`, which answers a different question — *may I join this, right
now* — and carries a live count.

### One call at a time

Joining a call while in another leaves the first, and says so before it does. `useJoinCall` is the shared entry
point for both lists: it asks for confirmation, naming the call being left, then **posts the leave explicitly**
before joining.

That explicit leave matters and is easy to miss. The call window is shared, so joining a second call already
replaces the first one's page — but replacing a page is not leaving a call. Without the leave, the abandoned
call keeps counting its participant, which keeps it listed as occupied and stops it ever emptying out. With it,
the call empties, ends after the grace period, and drops out of both lists on its own.

The server enforces the same rule rather than trusting the client to have asked: `addUserToCall` first runs
`leaveOtherCalls`, leaving every *other* running call this user is still counted as being in. A window that dies
without reporting its departure — a crash, a killed tab, a client that never sent the leave — otherwise leaves its
user counted as present forever, which both misreports them and keeps a finished call listed as occupied. Joining
anything is the moment that can be put right, and it costs one indexed read that usually finds nothing.

### Liveness is polled, and why

A call appearing does **not** reach these lists over a stream. Announcing a call to everyone who could join it
means a broadcast to every subscriber of its room, which is the same fan-out that makes ringing a large room
impossible in the first place — the problem this feature exists to work around. So `useJoinableCalls` polls,
every 20 seconds, and anything the user does themselves invalidates the query at once.

That is a deliberate trade. This list is not latency-critical: it exists precisely for the calls whose ring never
arrived, where the alternative today is no route at all. A per-user signal remains the better answer if it can be
made cheap — see [Improvement suggestions](#improvement-suggestions).

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
| GET | `/v1/video-conference.joinable` | The running calls the caller may join — the sidebar and history lists |
| POST | `/v1/video-conference.join` | Join a conference — accepts `discussionRid` members |
| POST | `/v1/video-conference.rename` | Name a running group conference; the creator only |
| POST | `/v1/video-conference.share-chat` | Give the members who can't read the chat access to it (`mode: 'invite' \| 'discussion'`) |
| GET | `/v1/video-conference.info` | Conference info — accepts `discussionRid` members; carries `chatAccess` |
| GET | `/v1/video-conference.list` | Paginated history, with discussion title / last message |

## Streams

| Stream | Event | Payload | Authorized for |
|--------|-------|---------|----------------|
| `video-conference` | `<callId>/updated` | — | conference members, or anyone who can read the chat's room |

## Why membership exists

The prose above describes the shipped behaviour. This section is the record of *why* it is shaped that way,
plus the follow-up work deliberately left out. The phase-by-phase plan it was built from lives in the git
history and is not repeated here.

Before it, adding someone to a conference *put them in a room* — the conference's own, or a fresh discussion —
and authorization to join was derived from room membership. That conflated two separate things: being in the call,
and being able to read the chat. What replaced it is described under [Adding Participants](#adding-participants)
and [Access Control](#access-control).

### Decisions on record

| # | Decision |
|---|---|
| 1 | Conference membership lives on the existing `users[]`, with a per-entry `joined` flag — not a second array. Keeps one list of "who is associated with this call" and leaves room for future participant kinds. |
| 2 | `ts` keeps its current meaning (added to the conference). A separate `joinedAt` records when they actually joined. |
| 3 | Ringing is decided **per call event** against the list being rung, capped at 10. At start the list is the room's subscribers (so a >10-person room still rings nobody). On add, the list is the added users, capped at 10 per action — so an add always rings. |
| 4 | A decline is recorded as a flag on the member's `users[]` entry. It must never end the call for anyone else. |
| 5 | Membership never expires, and is additive-only. Leaving, declining and rejoining all annotate the entry rather than removing it, which is what makes the call log and the members list possible after the fact. |
| 6 | `assignDiscussionToConference` subscribes the **union of the original room's members and the conference's members**, so a newly created discussion contains everyone involved rather than only those who joined the call. |
| 7 | "External" (a member with no access to the chat) is **derived**, not stored, so it stays true as access changes. It is surfaced per member in the members panel and in aggregate by the chat-access notice. |
| 8 | An incoming call is an item in the list of calls, not a popup over the screen. Answering it, turning it down and leaving it ringing are all things the user can do without the rest of the app being blocked — see [A ringing call is listed, not popped](#a-ringing-call-is-listed-not-popped). |

### Future work (not in scope)

- **Non-user participants.** Members are registered Rocket.Chat users only, for now. Representing SIP
  extensions, phone numbers, external email addresses, or participants derived from a calendar event is
  wanted later. `IVideoConferenceUser extends Pick<Required<IUser>, '_id' | 'username' | 'name'>` — required
  `username` *and* `name` — so that constraint has to relax when it happens. Adding a nullable `source`
  discriminator to the entry while Phase 1 is being written costs nothing and avoids a migration later.

## Implementation notes

Things worth knowing that aren't visible from the code alone.

### Group ringing was dead code before this work

The server had long broadcast an `action: 'ring'` to each room member of a group conference, and **no client ever
handled it** — 1:1 ringing is driven entirely client-side, by the caller's own `VideoConfManager` republishing
`'call'` while it waits. `VideoConfManager` now handles `'ring'`, which is what makes ringing-on-add work; the side
effect is that group conferences which had been silently not ringing **will now ring**, which the EE code always
intended but is a visible change beyond "ring on add".

A server-originated ring is one-shot: nothing refreshes the 10s abort timeout a 1:1 caller keeps alive, so it rings
once and gives up. That suits an already-running conference, where there is no caller waiting.

### Declining makes you a member

There is nowhere to record a decline except on a `users[]` entry, so declining creates one for someone who
was rung as a room member. Since membership authorizes joining, a member who declines can still join
afterwards — which is intended, but is a consequence of where the flag is stored rather than a separate
decision.

### Resolving chat access is the user's call

Both ways out give something away, in different directions — see the mode table under
[Chat Access](#chat-access) — so the choice is the user's, and `ChatAccessModal` spells out each consequence next
to its button, naming the room in bold. That name is the context the decision turns on.

Which one *leads* is a privacy judgement: opening a private room's history is the bigger step, so private rooms
and DMs lead with the discussion, and public rooms — whose history is already open — lead with the invite.
`chatAccessLeadsWithDiscussion` is shared with the server's own default so the two can't disagree.

The notice itself is `AnnouncementBanner` — the same banner rooms use for announcements — so it inherits
readable contrast instead of hand-rolled colours. It is passed no `onClick`: the Review button is the only
control, which keeps one interactive element rather than nesting a button inside a `role='button'` bar.

### A member who can't read the chat is told so, not shown an error

The server already works out who can't read the chat, so `ConferenceChat` asks `hasConferenceChatAccess` about the
current user and renders the not-shared state rather than attempting a fetch that is known to fail — which
would land on *"The page does not exist or you may not have access permission"* and read as something being broken.

`ChatAccessNotice` hides itself from those same members for the same reason: it offers to share the chat, and
they are the ones it would be shared with — `share-chat` would fail for them anyway, since they can't add
anyone to a room they can't see.

### The incoming-call popup assumed the callee was in the room

Ringing on add is the first case where a call rings someone with no access to the room it belongs to, and the popup
was built entirely around that room: it read it with `useUserRoom(rid)` and returned `null` when it wasn't there,
while still calling `focusManager.focusFirst()` — which then crashed looking for the parent of a node the focus
scope never got. Incoming popups therefore render **without** a room, describing the call from the conference's own
record (`VideoConfPopupCallerInfo`). The popups that act *on* a room — starting or placing a call — still need one.

### Accepting a server ring joins; it doesn't negotiate

1:1 accept is a handshake: the callee publishes `accepted` and waits for the caller's client to reply
`confirmed` with the go-ahead, giving up after 5s. A server-originated ring has no caller waiting, so running
that handshake left the added user staring at *"No response from remote user after notifying the call was
accepted"*. Incoming calls now carry a `handshake` flag; without it, accepting joins the conference outright —
membership is what authorizes joining — and declining records the decline without publishing `rejected` to
whoever added them, which their client would read as their own call being turned down.

### Test coverage and where it lives

The cheap runners were used deliberately: mocha under `apps/meteor/tests/unit/**` (~2s for the whole config) and
package-level jest. The specs sit beside what they test, so the file names say where to look; enumerating them
here only produced a list that went stale on its own.

Two things about the arrangement are worth knowing. `apps/meteor/tests/unit/server/services/video-conference/testHarness.ts`
is what makes the service testable at all: `createService` proxyquires it with ~25 inert module stubs (one of
which would otherwise open a Mongo driver at import time) and a models map each spec narrows to the collections
it exercises. And the decisions worth pinning down were deliberately moved *out* of the service into pure
functions — `resolveChatAccessMode`, `chatAccessLeadsWithDiscussion`
(`apps/meteor/lib/videoConference/chatAccess.ts`), `buildConferenceCallHistoryItems`, the member predicates in
`memberStatus.ts` — each shared by the server and the client that has to agree with it, so a rule is tested once
and the two can't drift.

`packages/models/src/models/VideoConference.spec.ts` stubs `BaseRaw`, which participates in a circular import
that leaves it uninitialized when the module is loaded directly by jest.

An end-to-end REST suite covering these endpoints against a real server and real Mongo — membership without room
access, authorization by membership, decline, leave, ring, `chatAccess`, and both `share-chat` modes — is written
and held back for a PR of its own; see [Deferred to follow-ups](#deferred-to-follow-ups). It follows the
provider-app harness in `apps/meteor/tests/end-to-end/apps/video-conferences.ts` and is EE-gated, since a private
app is never enabled outside EE.

### Nothing else "ends" a Jitsi conference

`endCall` runs when something tells Rocket.Chat the call is over. For a third-party provider, nothing does:
the Jitsi app never reports an end, so before closing the window became a signal, conferences sat at `STARTED`
until `videoConferencesCron` expired them a day later — and the expire path wrote no history at all. Both gaps
are closed: leaving ends the call when nobody is left, and expiry writes history as a backstop.

Conferences expired *before* this landed have `endedAt` set already, so they are permanently invisible to
history — the duplicate guard can't distinguish them from ones already written. Only conferences that stop from
now on appear.

### Verified against live data

The premise — membership without room access — was confirmed by reading a development workspace's Mongo directly,
not only by test:

- A conference on a **DM** between two users carried a third, `alice`, as a `users[]` entry with `joined: false`
  and **no subscription to that DM**. She is authorized to join the call and cannot read its chat, which is
  exactly the state the model exists to represent.
- Entries mixed both shapes as designed: joined members carry `joined: true` and a `joinedAt`; added members carry
  `joined: false` and no `joinedAt`. Every entry carries `ts`. Declining from the sidebar wrote `declined` and
  `declinedAt` on the decliner's entry alone, leaving the conference's own status untouched.

Two flows were also walked end to end against that workspace. Placing a DM call opened the call window at
`/conference/:id` immediately, with the callee a member at `joined: false` while still ringing and the room showing
no outgoing popup; after the ring window the call window reported "Nobody answered", naming the callee, and ringing
again restarted the wait. Closing the window then ended the call and settled both history rows — `ended`/`outbound`
for the caller, `not-answered`/`inbound` for the callee — while leaving a call someone else was still in only set
`leftAt`.

## Deferred to follow-ups

Six things were built, reviewed and then held back from the first release to keep it reviewable. Each is a
complete improvement on its own, which is what makes it a good follow-up rather than a gap. All of them are in
git — `git show 5ab58858d7d:<path>` restores any of them intact.

| Deferred | Why it can wait | What ships instead |
|---|---|---|
| **Telling the caller nobody picked up** (`CallOutcomeModal`, `useCallOutcome`) | the caller is in the call either way; this only names what already happened | the members panel shows each member still ringing, waiting, or declined |
| **The provider → parent bridge** (`useProviderCallBridge`) | **no provider implements it** — not the bundled Jitsi app, which declares only `{ mic, cam, title }` | our own bar owns the panels; a provider showing its own toolbar shows two |
| **Faces in the calls list** (`CallParticipants`, `participants` on the joinable payload) | polish over a number that answers the same question less well | `__count__people_in_the_call` |
| **The navbar stand-in** (`NavBarItemOngoingCalls`) | only reachable with the sidebar collapsed | nothing there; the sidebar card covers the rest |
| **Handing internal links to the opener** (the desktop bridge and the `postMessage` handshake) | needs a bridge on both sides for a nicer landing | a `noopener` new tab — see [Confined Navigation](#confined-navigation) |
| **Regrouping the room's call list** into Ongoing/Past, named after the discussion | a redesign of a list that already works, and one every workspace sees | the existing flat list, with the fix that it no longer counts members who never joined |

The end-to-end REST suite (`tests/end-to-end/apps/video-conference-membership.ts`) is held back for a different
reason: it has never been run locally — the API suite authenticates as a fixture admin a dev workspace does not
have — so its first CI run is its real first run, and that belongs in a PR of its own rather than reddening a
feature PR. Until it lands, the endpoints are covered by unit tests only.

### The design worth keeping for the provider bridge

If a provider ever asks for it: an embedded provider posts to the parent window to hide our bar and drive our chat
panel, rather than showing two competing sets of controls.

```js
parent.postMessage({ type: 'rocketchat:conference', command: 'set-call-bar-visible', visible: false }, '*');
parent.postMessage({ type: 'rocketchat:conference', command: 'set-chat-visible', visible: true }, '*');
parent.postMessage({ type: 'rocketchat:conference', command: 'toggle-chat' }, '*');
```

The trust model is the part worth preserving: the iframe is cross-origin, so `event.origin` cannot be allow-listed
against our own. Every message must instead have come from `iframeRef.current.contentWindow` — the exact window we
embedded, which no other frame or tab can forge.

## Improvement suggestions

What is still thinner than it looks. Everything previously listed here that has since been built — the members
panel, ringing a member again, reporting what an add actually did, the reload grace period, cheaper chat-access
reads — is described in the sections above instead.

### The ring can still be missed entirely

A server ring fires once and gives up after 10s, and the caller's own repeats stop at 30s. Being added is also a
desktop notification, which covers a backgrounded tab, but someone with notifications denied and no client on
screen still has no signal in the moment.

The docked list closes most of this — the call stays reachable long after its ring stopped, which is the point of
it. What remains is the case where nothing was on screen *at all* while it rang: the call is then found in the
list or the history afterwards, rather than being announced. Repeating the server ring for a bounded window is the
cheap answer if that is not enough.

### `share-chat`'s invite path is all-or-nothing

`addUsersToConferenceRoom` hands every missing member to `addUsersToRoomMethod` in one call. If it throws for
one of them, the caller gets an error toast; the others may or may not have gone through. It is not silent — the
notice re-reads and shows whoever is still missing — but the toast says less than it could. Per-user results
would make a partial outcome legible at the moment it happens.

### Joinable calls are polled rather than pushed

The sidebar's list refreshes on a 20-second timer, because announcing a new call to every subscriber of its room
is the fan-out this feature exists to avoid. A cheaper push would be better: a signal per *room* that the client
already subscribes to would reach exactly the people who need it, without the server enumerating them.

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
`ConferenceRoom`'s not-found fallback until the next read. Rare, and self-correcting.

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
| Chat panel | `apps/meteor/client/views/conference/ConferenceChat.tsx`, `ConferenceRoom.tsx`, `ConferenceStoresReady.tsx`, `CallPanelHeader.tsx`, `ConferenceChatNotShared.tsx` |
| Nothing to show | `apps/meteor/client/views/conference/ConferenceStatePage.tsx`, `ConferencePageError.tsx`, `ConferenceUnauthorizedPage.tsx` |
| Conference data | `apps/meteor/client/views/conference/hooks/useConferenceEmbedded.tsx` |
| Confined navigation | `apps/meteor/client/views/conference/hooks/useConfinedNavigation.ts` (+ `.spec.ts`) |
| Add participants | `apps/meteor/client/views/conference/AddParticipantsModal.tsx` |
| Chat access | `apps/meteor/client/views/conference/ChatAccessNotice.tsx`, `ChatAccessModal.tsx` |
| Preflight | `apps/meteor/client/views/conference/ConferencePreflight.tsx`, `ConferenceStartPage.tsx`, `hooks/useStartConference.ts`, `hooks/useCallPreferences.ts` |
| Members panel | `apps/meteor/client/views/conference/CallMembersPanel.tsx`, `CallMemberItem.tsx`, `client/hooks/useRingingExpiry.ts` |
| Membership rules (shared) | `apps/meteor/lib/videoConference/memberStatus.ts`, `callHistory.ts`, `chatAccess.ts`, `constants.ts` |
| Reaching a call | `apps/meteor/client/components/OngoingCalls/` (the list, its rows and `useOngoingCalls`), `client/sidebar/sections/OngoingCallsSection.tsx`, `client/views/conference/hooks/useJoinableCalls.ts`, `hooks/useJoinCall.tsx` |
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
