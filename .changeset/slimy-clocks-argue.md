---
"@rocket.chat/meteor": patch
"@rocket.chat/core-services": patch
---

`stopped` lifecycle method was unexpectedly synchronous when using microservices, causing our code to create race conditions.
