---
'@rocket.chat/message-parser': patch
'@rocket.chat/meteor': patch
---

Fixes the second of two consecutive user mentions being sent as plain text when they are separated by a non-breaking space, which the realtime message composer inserts while typing
