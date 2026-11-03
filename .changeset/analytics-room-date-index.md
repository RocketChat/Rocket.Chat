---
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes high database load on busy workspaces with the Engagement Dashboard enabled, where every sent or deleted message read all of the day's dashboard records
