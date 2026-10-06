# Sidebar Room Hover Card

## Overview

Resting the pointer on a room in the sidebar opens a card next to it describing that room, with the actions most
often taken from the list. It replaces the status tooltip DMs used to show on hover and the plain title tooltip of
other rooms. Omnichannel rooms keep the title tooltip and get no card.

Client only — every field shown comes from data the client already has or from existing endpoints, so the card
works against any server version that has those endpoints.

Only the default sidebar (`client/sidebar`, with or without the `sidebarRail` feature preview) has it. The
`secondarySidebar` feature preview (`client/views/navigation`) does not.

## Variants

| Room | Card | Header | Footer actions |
|------|------|--------|----------------|
| 1:1 direct message (and the self DM) | `DirectMessageHoverCard` | avatar, video / voice call, grouping button, presence, `@username` · status text, roles, local time, bio | Open conversation, Mark as read |
| Any other room, group DMs included | `ChannelHoverCard` | room avatar, name, kind (public/private channel, team, discussion, DM; "… in **Team**" linking to the team), grouping button, topic, member avatars and count, desktop notification level | Open channel (Open conversation for group DMs), Mark as read, Mute / Unmute |

The grouping button, top right, is the room header's own (`RoomGroupingButton`): under the custom categories
license it picks the room's category (Favorites being one of them), without it it toggles favorite. The card has no
room menu; hiding, leaving and marking unread stay in the sidebar's kebab.

Both continue with the room's last message: author, time, preview (videoconf, E2EE and attachment messages get the
same placeholders as the sidebar preview) and a badge with the room's own unread messages (red with user mentions,
orange with group mentions).

When the room has threads with unread replies (`subscription.tunread`), a section lists them below the last
message, one row per thread showing the start of its parent message: threads mentioning the user first (red border
and "@", orange for group mentions), then by last reply. At most four are listed; a last row says how many more there
are and opens the room's thread list. A row opens its thread (`/…/thread/<tmid>`). The rows come from
`GET /v1/chat.getThreadsList` (`type: 'unread'`), fetched when the card opens and refetched when `tunread` changes; once
loaded, the server's list sets the count, since `tunread` can still hold threads read elsewhere. Nothing in the card
marks anything as read except its button. The section is hidden when threads are disabled (`Threads_enabled`).

"Mark as read" only shows while the room has something unread (`alert`, `unread`, or unread threads), and reads
"Mark all as read" when there are unread threads, since it reads them too (`readThreads: true`).
"Mute" toggles `disableNotifications`, the same as the "Turn on" switch of the notification preferences.

## Hover behaviour

`RoomHoverCardProvider` wraps the room list and owns a single non-modal `Popover`, placed at the `end top` of the
hovered room, 0.75rem away. It keeps its own hover timers (500 ms to open, 300 ms to close) and uses
`useHoverCardDismissal` on the card for keep-open, Escape and open-menu handling. It does not use react-stately's
`useTooltipTriggerState`, like the user card does: that one shares a global warm-up between all its users, so once
any card had shown, the next ones opened with no delay.

- Every card waits 500 ms of the pointer resting on its room, including right after another card closed.
- Moving from a room with a card to another room keeps the current card until the new room's delay elapses, then
  swaps it, so there's no gap and no flicker.
- Reaching the card keeps it and cancels any swap still pending, so crossing other rooms on the way to the card
  (moving diagonally to its lower half) doesn't replace it.
- Sweeping across the list opens nothing: entering a room restarts the delay.
- Leaving the room and the card closes it after 300 ms.
- Pointer down on the room (navigating, or opening its kebab), a scroll of the list, Escape, and any card action
  close it at once.
- Never opens on devices without hover (`(hover: hover)`), since taps also emit mouse events.

**Why the leave handling looks unusual.** Rooms sit edge to edge. React synthesizes `onMouseEnter` of the next room
while handling the previous room's `mouseout`, so it runs *before* the previous room's native `mouseleave` (and before
the card's, when coming back from the card). A naive "close on leave" therefore hands the card to the next room and
then schedules its close. The provider ignores a leave from any room other than the one the pointer is on, and a
card leave while the pointer is on a room. `RoomHoverCardProvider.spec.tsx` reproduces the browser's event order.

The card is not keyboard-reachable; everything in it is also available from the room menu or the room itself.

## Data

| Field | Source |
|-------|--------|
| Subscription | `useUserSubscription(rid)` (reactive, so the card updates after its own actions) |
| Room | `useUserRoom(rid)`; when the client's room cache doesn't have it, `GET /v1/rooms.info` (mapped with `mapRoomFromApi`, cached 60 s, not live) |
| User profile (DM) | `GET /v1/users.info` via `useUserInfoQuery` |
| Team name | `GET /v1/teams.info` via `useTeamInfoQuery`, only for rooms in a team that aren't its main room |
| Member avatars | `GET /v1/rooms.membersOrderedByRole` (`count: 3`), fetched when the card opens, cached 60 s |
| Unread threads | `GET /v1/chat.getThreadsList` (`type: 'unread'`, `count: 50`), keyed by `subscription.tunread` |
| Calls | `useVideoCallAction`, `useUserMediaCallAction` from the user info actions; the provider supplies a `UserCardContext` whose `closeUserCard` closes the hover card |

## Endpoints used by actions

| Action | Endpoint |
|--------|----------|
| Mark as read | `POST /v1/subscriptions.read` (`readThreads: true`) |
| Open a thread, or the thread list | client routing (`roomCoordinator.openRouteLink` with `tab: 'thread'`) |
| Mute / Unmute | `POST /v1/rooms.saveNotification` (`useToggleNotificationAction`) |
| Open / team link | client routing (`roomCoordinator.openRouteLink`) |

## Known gaps

- The client's `Rooms` cache can miss rooms the user is subscribed to (seen in a dev workspace: 90 of 163 sidebar
  rooms), and those rooms then also lack `lastMessage`, `topic` and the other room fields merged into their
  subscription. The card falls back to `rooms.info` for them, but that copy doesn't update while the card is open.

- Desktop notification level reads the subscription's `desktopNotifications`; when unset it shows "Default" rather
  than resolving the user's global preference.
- The DM avatar is drawn at 76 px with a plain image, since Fuselage avatars have no size between 48 and 124.
- Hot-reloading files under `client/sidebar/RoomHoverCard` in the dev server can re-evaluate `roomCoordinator` and
  leave it without room types ("Application Error" on opening a room). A page reload fixes it; it's a dev-only
  artifact.

## Key Files

| Layer | File |
|-------|------|
| Provider, hover state, popover | `apps/meteor/client/sidebar/RoomHoverCard/RoomHoverCardProvider.tsx` |
| Context | `apps/meteor/client/sidebar/RoomHoverCard/RoomHoverCardContext.ts` |
| DM vs room selection | `apps/meteor/client/sidebar/RoomHoverCard/RoomHoverCardWithData.tsx` |
| DM card | `apps/meteor/client/sidebar/RoomHoverCard/DirectMessageHoverCard.tsx` |
| Room card | `apps/meteor/client/sidebar/RoomHoverCard/ChannelHoverCard.tsx`, `RoomHoverCardKind.tsx` |
| Grouping button | `apps/meteor/client/views/room/Header/icons/RoomGroupingButton.tsx`, shared with the room header (`RoomGroupingMenu.tsx` adds the subscribed check) |
| Unread threads | `apps/meteor/client/sidebar/RoomHoverCard/RoomHoverCardThreads.tsx` |
| Shared pieces | `RoomHoverCardDialog.tsx`, `RoomHoverCardLastMessage.tsx`, `RoomHoverCardSectionLabel.tsx`, `RoomHoverCardFooter.tsx`, `RoomHoverCardQuickAction.tsx`, `getHoverCardMessagePreview.ts` |
| Actions | `apps/meteor/client/sidebar/RoomHoverCard/useRoomHoverCardActions.ts` |
| Trigger | `apps/meteor/client/sidebar/RoomList/SidebarItemTemplateWithData.tsx` |
| Mount point | `apps/meteor/client/sidebar/RoomList/RoomList.tsx` |
| Tests | `RoomHoverCardProvider.spec.tsx` (hover delays and hand-over), `RoomHoverCardWithData.spec.tsx` (room cache fallback, empty room), `RoomHoverCardThreads.spec.tsx` (order, limit, navigation) |
| Stories | `RoomHoverCard.stories.tsx` (made-up data; reads the source locale) |
| Strings | `packages/i18n/src/locales/en.i18n.json` (`Open_conversation`, `Open_channel`, `Members_count`, `Notifications_off`, `Mute_room_notifications`, `Unmute_room_notifications`, `Public_channel_in_team`, `Private_channel_in_team`, `Unread_threads_count`, `More_unread_threads`, `Mark_messages_and_threads_as_read`) |
