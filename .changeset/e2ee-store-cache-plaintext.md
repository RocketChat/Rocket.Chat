---
'@rocket.chat/meteor': patch
---

Keeps the decrypted last message of end-to-end encrypted rooms out of the client's persistent store cache. Also rewrites a cache that an older client left on disk
