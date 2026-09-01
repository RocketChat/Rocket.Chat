---
'@rocket.chat/federation-matrix': patch
---

Keep incoming Matrix messages staged when processing fails so transient media download errors can be retried.
