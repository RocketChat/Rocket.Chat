---
'@rocket.chat/tools': patch
'@rocket.chat/meteor': patch
---

Fixes `convertSubObjectsIntoPaths` silently dropping properties whose value is an empty object
