---
'@rocket.chat/tools': patch
---

Fixes `convertPathsIntoSubObjects` silently dropping falsy values (`0`, `""`, and `null`)
