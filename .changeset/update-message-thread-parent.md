---
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes the reply count, last reply time and followers of a thread not changing when a message update (for example an app calling `setThreadId`) moves a message into, out of or between threads
