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

`POST /v1/video-conference.add-participants` with `keepHistory`:

- **`true`** → `addUsersToConferenceRoom` adds the users to the conference's active room (`discussionRid || rid`), so they get its history.
- **`false`** → `createConferenceDiscussionWithParticipants` creates a discussion off the conference's room carrying over the current members plus the new ones, leaves a `discussion-created` pointer in the parent room, and repoints `discussionRid`.

Existing members are carried over from the room doc for DMs (`usernames`) and from subscriptions for channels/groups. The conference's own `users` list is **not** used — it only holds people who already joined the call.

Both paths notify each added user with a desktop notification (`requireInteraction`, plus a "Join call" action on desktop that joins directly via `conferenceId`).

The modal does not refetch the conference afterwards — `assignDiscussionToConference` broadcasts `discussionUpdated`, and every participant's panel (including the one that triggered the add) follows that single signal.

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
