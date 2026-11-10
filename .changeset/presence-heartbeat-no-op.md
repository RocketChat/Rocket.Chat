---
'@rocket.chat/presence': patch
'@rocket.chat/meteor': patch
---

Stops the presence service from writing and broadcasting the user's status on every connection heartbeat when the status did not change
