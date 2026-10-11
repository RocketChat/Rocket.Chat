---
'@rocket.chat/meteor': patch
---

Deprecates the `getRoomJoinCode` real-time API method. It has had no caller since the room settings panel stopped revealing join codes, and will be removed in 9.0.0 without a replacement.
