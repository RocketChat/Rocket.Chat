---
"@rocket.chat/meteor": patch
---

Fixes `ssrf` validation for oauth endpoints, which allows internal endpoints to be used during the auth flow.
