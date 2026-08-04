---
'@rocket.chat/meteor': patch
---

Fixes pagination not resetting to the first page when searching the Custom Sounds and Custom Emojis admin tables. Searching from a later page previously kept the stale offset, so the filtered request ran with an out-of-range offset and returned an empty result set.
