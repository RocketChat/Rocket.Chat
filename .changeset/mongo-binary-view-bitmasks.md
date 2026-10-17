---
'@rocket.chat/mongo-adapter': patch
---

Respect binary view offsets and lengths when evaluating bitwise filters, without reading unrelated bytes from the backing buffer.
