---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Adds a new `POST /v1/chat.getMessages` endpoint to fetch several messages at once by id, including messages from different rooms. The request fails if any of the messages belongs to a room the caller cannot read.
