---
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Improves the performance of sending and deleting messages in discussions by updating the discussion's message counter incrementally instead of recounting hidden system messages on every message
