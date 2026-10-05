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
| 1:1 direct message (and the self DM) | `DirectMessageHoverCard` | avatar, video / voice call, room menu (kebab), presence, `@username` · status text, roles, local time, bio | Open conversation, Mark as read |
| Any other room, group DMs included | `ChannelHoverCard` | room avatar, name, kind (public/private channel, team, discussion, DM; "… in **Team**" linking to the team), favorite toggle, topic, member avatars and count, desktop notification level | Open channel (Open conversation for group DMs), Mark as read, Mute / Unmute |

Both end with the room's last message: author, time, preview (videoconf, E2EE and attachment messages get the
same placeholders as the sidebar preview) and the room's unread summary as a badge.

"Mark as read" only shows while the room has something unread (`alert`, `unread`, or unread threads).
"Mute" toggles `disableNotifications`, the same as the "Turn on" switch of the notification preferences.

## Hover behaviour

`RoomHoverCardProvider` wraps the room list and owns a single non-modal `Popover`, placed at the `end top` of the
hovered room, 0.75rem away. It follows the user card's hover pattern (`views/room/providers/UserCardProvider.tsx`):
`useTooltipTriggerState` with a 500 ms open delay and a 300 ms close delay, and `useHoverCardDismissal` on the
card for keep-open, Escape and open-menu handling.

- Once a card is showing, moving to another room hands it over immediately.
- Sweeping across the list doesn't open anything: entering a room while an open is still pending restarts the delay.
- Leaving the card for its room, or another room, keeps a card open; leaving the list closes it.
- Pointer down on the room (navigating, or opening its kebab), a scroll of the list, Escape, and any card action
  close it at once.
- Never opens on devices without hover (`(hover: hover)`), since taps also emit mouse events.

**Why the leave handling looks unusual.** Rooms sit edge to edge. React synthesizes `onMouseEnter` of the next room
while handling the previous room's `mouseout`, so it runs *before* the previous room's native `mouseleave` (and before
the card's, when coming back from the card). A naive "close on leave" therefore hands the card to the next room and
then schedules its close. The provider ignores a leave from any room other than the current trigger, and a card
leave while the pointer is on the current trigger. `RoomHoverCardProvider.spec.tsx` reproduces the browser's event
order.

The card is not keyboard-reachable; everything in it is also available from the room menu or the room itself.

## Data

| Field | Source |
|-------|--------|
| Room, subscription | `useUserRoom(rid)`, `useUserSubscription(rid)` (reactive, so the card updates after its own actions) |
| User profile (DM) | `GET /v1/users.info` via `useUserInfoQuery` |
| Team name | `GET /v1/teams.info` via `useTeamInfoQuery`, only for rooms in a team that aren't its main room |
| Member avatars | `GET /v1/rooms.membersOrderedByRole` (`count: 3`), fetched when the card opens, cached 60 s |
| Calls | `useVideoCallAction`, `useUserMediaCallAction` from the user info actions; the provider supplies a `UserCardContext` whose `closeUserCard` closes the hover card |

## Endpoints used by actions

| Action | Endpoint |
|--------|----------|
| Mark as read | `POST /v1/subscriptions.read` (`readThreads: true`) |
| Favorite | `POST /v1/rooms.favorite` (`useToggleFavoriteAction`) |
| Mute / Unmute | `POST /v1/rooms.saveNotification` (`useToggleNotificationAction`) |
| Open / team link | client routing (`roomCoordinator.openRouteLink`) |

## Known gaps

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
| Shared pieces | `RoomHoverCardDialog.tsx`, `RoomHoverCardLastMessage.tsx`, `RoomHoverCardFooter.tsx`, `RoomHoverCardQuickAction.tsx` |
| Actions | `apps/meteor/client/sidebar/RoomHoverCard/useRoomHoverCardActions.ts` |
| Trigger | `apps/meteor/client/sidebar/RoomList/SidebarItemTemplateWithData.tsx` |
| Mount point | `apps/meteor/client/sidebar/RoomList/RoomList.tsx` |
| Hover tests | `apps/meteor/client/sidebar/RoomHoverCard/RoomHoverCardProvider.spec.tsx` |
| Strings | `packages/i18n/src/locales/en.i18n.json` (`Open_conversation`, `Open_channel`, `Members_count`, `Notifications_off`, `Mute_room_notifications`, `Unmute_room_notifications`, `Public_channel_in_team`, `Private_channel_in_team`) |
