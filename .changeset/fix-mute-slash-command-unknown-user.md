---
'@rocket.chat/meteor': patch
---

Fixes `/mute @username` calling `muteUserInRoom` even when the given username doesn't exist. The command already sent the "user doesn't exist" feedback but was missing a `return` afterward, so it went on to invoke the mute method anyway with a non-existent username. `/ban`, `/unban`, `/kick`, and `/unmute` already returned correctly in this case.
