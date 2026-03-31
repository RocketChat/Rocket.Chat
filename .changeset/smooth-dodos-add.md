---
'@rocket.chat/core-services': patch
'@rocket.chat/meteor': patch
---

Fixes delete message permission check in read-only rooms to validate the deleting user's unmuted status instead of the message sender's
