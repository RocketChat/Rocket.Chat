# Ban User

## Overview

Banning prevents a user from participating in a specific room. Unlike kicking (which deletes the subscription), banning **keeps the subscription record** with `status: 'BANNED'`, creating a persistent access barrier.

## Ban Flow

1. A user with `ban-user` permission (roles: `admin`, `owner`, `moderator`) triggers the ban via UI, API (`POST /v1/rooms.banUser`), or slash command (`/ban @username`).
2. **Validations** (`banUserFromRoomMethod` in `server/lib/banUserFromRoom.ts`):
   - Checks `ban-user` permission scoped to the room.
   - Checks if the room type allows the action (via `roomDirectives.allowMemberAction`).
   - Checks if the banning user has access to the room.
   - Checks if the target user exists and is in the room.
   - Rejects ban if the target is already banned.
   - Rejects ban if the target is the last owner.
3. **Execution** (`performUserBan` in `app/lib/server/functions/banUserFromRoom.ts`):
   - Updates the subscription to `status: 'BANNED'` (does not delete the record).
   - Removes the room from the user's `__rooms` array.
   - Decrements the room's `usersCount`.
   - Removes room-scoped roles (`moderator`, `owner`, `leader`) in channels and groups.
   - If the room is a team's main room, removes the member from the team.
   - Saves a `user-banned` system message.
   - Notifies the client with a `removed` event on the subscription (so the client drops the stream).
4. **Callback** `afterBanFromRoom` fires (used by Matrix federation to propagate the ban).

## Unban Flow

1. Triggered via UI (contextual bar "Banned Users"), API (`POST /v1/rooms.unbanUser`), or slash command (`/unban @username`).
2. Finds the subscription via `findOneBannedSubscription`.
3. **Removes the subscription entirely** (`Subscriptions.removeById`) — does not restore it to active status.
4. Saves a `user-unbanned` system message.
5. **Callback** `afterUnbanFromRoom` fires (federation).

**Important:** after unban the user **does not become a member** of the room again. The banned subscription is deleted. The user must be invited or join again.

## Re-entry After Unban

In `addUserToRoom`, if the user being added has a subscription with `status: 'BANNED'`:
- Removes the banned subscription.
- Saves a `user-unbanned` system message.
- Creates a new subscription normally.

This means inviting/adding a banned user automatically unbans them.

## Access Control

The `canAccessRoom` validators check for bans in two public room scenarios:
- **Public rooms inside teams** — if banned, access is denied.
- **Regular public rooms** — if banned, access is denied.

For private rooms, access is already controlled by the subscription (which is marked as `BANNED`).

## UI

- **Ban action:** appears in the user info panel (inside a room), gated by `ban-user` permission + `roomCanBan` + federation rules.
- **Banned users list:** "Banned Users" tab in the room toolbox (icon: `ban`, order: 13, requires `ban-user`), with virtualized scroll and infinite pagination via `GET /v1/rooms.bannedUsers`.
- **Unban action:** context menu on each item in the banned users list.
- **Confirmation:** both actions show a `GenericModal` with `danger` variant.

## System Messages

| Key | When |
|-----|------|
| `user-banned` | A user is banned from the room |
| `user-unbanned` | A user is unbanned (including via re-addition) |

## REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/rooms.banUser` | Ban a user (accepts `userId` or `username` + `roomId`) |
| POST | `/v1/rooms.unbanUser` | Unban a user |
| GET | `/v1/rooms.bannedUsers` | List banned users (paginated) |

## Key Files

| Layer | File |
|-------|------|
| API routes | `app/api/server/v1/rooms.ts` |
| Validation & permissions | `server/lib/banUserFromRoom.ts` |
| Core ban logic | `app/lib/server/functions/banUserFromRoom.ts` |
| Core unban logic | `app/lib/server/functions/executeUnbanUserFromRoom.ts` |
| Slash commands | `app/slashcommands-ban/server/ban.ts`, `unban.ts` |
| Client ban hook | `client/views/room/hooks/useBanUser.tsx` |
| Client unban hook | `client/views/room/hooks/useUnbanUser.tsx` |
| Ban action (user info) | `client/views/room/hooks/useUserInfoActions/actions/useBanUserAction.tsx` |
| Banned users UI | `client/views/room/contextualBar/BannedUsers/` |
| Subscription types | `packages/core-typings/src/ISubscription.ts` |
| REST typings | `packages/rest-typings/src/v1/rooms.ts` |
| Model typings | `packages/model-typings/src/models/ISubscriptionsModel.ts` |
