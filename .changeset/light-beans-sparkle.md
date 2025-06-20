---
"@rocket.chat/meteor": patch
---

Fixes an issue, where multiple reconnections would subscribe multiple times to the same stream, only a frontend issue, since the stream cache prevents sending multiple times to the backend, but does not prevent running the callback multiple times
