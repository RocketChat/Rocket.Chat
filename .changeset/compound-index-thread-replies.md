---
'@rocket.chat/meteor': patch
---

Speed up paginated thread reply loads on large workspaces by replacing the sparse `{ tmid: 1 }` index on the messages collection with a compound `{ tmid: 1, ts: -1 }` index, partial on `tmid` existing. Without it, loading a page of a large thread fetches every reply through `tmid_1` and sorts them in memory by `ts`. The index is partial rather than sparse because a sparse compound index includes every document that has `ts`, i.e. the whole collection. A migration builds the new index and drops `tmid_1` on existing workspaces.
