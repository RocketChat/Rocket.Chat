---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

`POST /v1/chat.delete` now accepts `{ fileId, asUser? }` as an alternative to `{ msgId, roomId, asUser? }`. When `fileId` is provided the server resolves the owning message via `Messages.getMessageByFileId` before running the existing permission and deletion flow.
