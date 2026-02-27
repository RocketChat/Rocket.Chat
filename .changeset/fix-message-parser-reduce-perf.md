---
'@rocket.chat/message-parser': patch
---

Replaces wasteful `filter().shift()` with `find(Boolean)` in `extractFirstResult` to avoid allocating an intermediate filtered array just to get the first truthy element.
