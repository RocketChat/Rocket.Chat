---
"@rocket.chat/meteor": patch
---

Fix `Content-Length` header being omitted when avatar file size is zero, violating HTTP spec.
