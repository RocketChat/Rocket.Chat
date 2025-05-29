---
'@rocket.chat/core-services': patch
'@rocket.chat/ddp-client': patch
'@rocket.chat/meteor': patch
---

Fixes missing UI updates after files-only message pruning by extending the deleteMessageBulk event to also handle files-only deletions.
