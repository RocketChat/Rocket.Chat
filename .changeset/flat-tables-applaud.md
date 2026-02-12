---
'@rocket.chat/core-typings': patch
'@rocket.chat/meteor': patch
---

Fixes association of encrypted messages and encrypted files, so that if one of them is removed, the other gets removed as well.
