---
'@rocket.chat/meteor': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/core-services': minor
'@rocket.chat/ddp-client': minor
'@rocket.chat/streamer': minor
'@rocket.chat/i18n': minor
'@rocket.chat/ui-client': minor
'@rocket.chat/ui-contexts': minor
'@rocket.chat/rest-typings': minor
---

Adds experimental message scheduling, off by default. A user selects a time in the composer, and the server sends the message at that time as the user. The user can see, edit, reschedule, send now, or delete pending messages in a room panel. In an end-to-end encrypted room, the client encrypts the text when it schedules the message, and the server stores only the ciphertext. Files in encrypted rooms are not supported yet. The REST endpoints are under `/api/experimental/scheduledMessages.*` and any release can change or drop them.
