---
'@rocket.chat/meteor': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/i18n': minor
---

Adds message scheduling: users can compose a message and have it delivered at a chosen date and time. Scheduled messages are listed in a new "Scheduled messages" contextual bar per room, where they can be edited or cancelled before delivery. Delivery runs on a per-minute job that claims due messages atomically, so it is safe across multiple instances, and re-checks posting permissions at send time. Two new admin settings control the feature: `Message_AllowScheduling` and `Message_MaxScheduledMessagesPerUser`.
