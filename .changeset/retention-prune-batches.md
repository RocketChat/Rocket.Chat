---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
'@rocket.chat/model-typings': patch
'@rocket.chat/cron': patch
---

Fixes the retention policy failing to prune rooms with a large backlog. Messages are now removed in batches and their trash copies written in bulk, cron jobs keep their lock while they run (for up to an hour) so another instance doesn't start them in parallel, a room that fails to prune no longer stops the rest of the run, the room's message counter is decremented by the right amount, and read receipts of pruned messages are removed
