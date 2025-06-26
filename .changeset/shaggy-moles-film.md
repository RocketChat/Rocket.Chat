---
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes the `channels.counters`, `groups.counters` and `im.counters` endpoint to include only active users in members count.
