---
'@rocket.chat/meteor': patch
---

Speeds up room opening by removing redundant work in the message history load. On the client, the prefetched first history batch no longer blocks on the message-list DOM before rendering, and the history pager no longer fires an extra `loadHistory` round trip just to reach a full page of visible messages when the latest page contains thread replies. On the server, `loadHistory` reuses the already-fetched room document instead of querying it twice, and runs message normalization and the unread (first-unread + count) queries concurrently instead of sequentially.
