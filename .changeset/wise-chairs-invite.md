---
'@rocket.chat/meteor': minor
'@rocket.chat/rest-typings': minor
---

Allows `channels.invite` to accept `userIds` and `usernames` arrays, so multiple users can be invited to a channel in a single request, like `groups.invite`. A request must identify users either by ID (`userId`, `userIds`) or by username (`username`, `user`, `usernames`), not both.
