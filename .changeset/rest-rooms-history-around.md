---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Adds an `aroundId` parameter to `GET /v1/rooms.history`, returning a window of messages centered on a given message instead of a page from one end of the room. This is what jumping to a quoted message, a search result or a thread message uses to load the surrounding conversation.
