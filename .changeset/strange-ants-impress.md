---
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Makes roomsPerGuest exclude DMs when counting subscriptions, ensuring guest limits apply only to non-DM rooms as per expected behavior.
