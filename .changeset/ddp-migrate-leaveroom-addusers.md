---
'@rocket.chat/meteor': patch
'@rocket.chat/rest-typings': patch
---

Migrate two more client DDP callers to REST:

- `leaveRoom` → `POST /v1/channels.leave`, `/v1/groups.leave`, `/v1/im.leave` (dispatched by room type).
- `addUsersToRoom` → one `POST /v1/channels.invite` or `/v1/groups.invite` per username.

The DDP methods stay registered on the server (with deprecation log) for external SDK/mobile clients until the 9.0.0 sweep removes them.

The `GroupsBaseProps.WithUserId` type accepts the same user-identification shapes as the server (`userId`, `username`, `user`, `userIds`, `usernames`) instead of forcing `userId`.
