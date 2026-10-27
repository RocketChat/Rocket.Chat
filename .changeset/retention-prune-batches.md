---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
'@rocket.chat/model-typings': patch
---

Fixes the retention policy failing to prune rooms with a large backlog. Messages are now removed in batches and their trash copies written in bulk, a room that fails to prune no longer stops the rest of the run, the room's message counter is decremented by the right amount, read receipts of pruned messages are removed, and deleting a room with a very large history no longer fails
