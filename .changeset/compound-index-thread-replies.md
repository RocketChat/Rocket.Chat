---
'@rocket.chat/meteor': patch
---

Speed up paginated thread reply loads on large workspaces by adding a compound index `{ tmid: 1, ts: -1 }` on the messages collection. Without it, the query planner can fall back to scanning the `ts_1` index in time order and filtering by `tmid` in memory, which becomes very expensive on collections with millions of messages.
