---
'@rocket.chat/apps': patch
'@rocket.chat/meteor': patch
---

Fixes the video conference info modal failing with `[object Object]` instead of the actual reason when the app that provides the call is no longer registered.
