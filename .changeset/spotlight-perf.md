---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
---

Improved `/v1/spotlight` search performance: results return faster, and room searches now read from secondary database replicas when available, reducing load on the primary.
