---
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes a condition that when a room is flagged as read and as unread at the same time by different processes, the client would stop syncing that room's read state
