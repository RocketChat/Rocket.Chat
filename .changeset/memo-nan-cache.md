---
'@rocket.chat/memo': patch
---

Fixes `memoize` recomputing on every call when the memoized function returns `NaN`
