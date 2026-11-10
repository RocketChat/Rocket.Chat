---
'@rocket.chat/streamer': patch
'@rocket.chat/meteor': patch
---

Fixes bot notifications sent back to back (for example, the result of `/invite-all-to` or `/invite`) occasionally replacing each other, so only the last one was shown
