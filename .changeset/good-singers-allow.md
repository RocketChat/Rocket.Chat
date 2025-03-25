---
'@rocket.chat/core-typings': patch
'@rocket.chat/meteor': patch
---

Fixes an issue where recursively quoting messages multiple times (up to the configured chained quote limit) caused the inner attachment to appear empty.
