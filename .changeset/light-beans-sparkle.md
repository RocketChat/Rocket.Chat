---
"@rocket.chat/meteor": patch
---

Fixes and issue, were multiple reconnections would subscribe multiple times the same stream, only frontend issue, since the stream cache prevents from sending multiple times to the backend, but not prevent from runnning the callback multiple times
