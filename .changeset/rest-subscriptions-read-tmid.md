---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

`POST /v1/subscriptions.read` now accepts an optional `tmid` field. When provided the server marks the specific thread as read via `readThread({ user, room, tmid })` instead of marking the whole room.
