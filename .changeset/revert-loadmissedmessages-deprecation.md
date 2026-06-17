---
'@rocket.chat/meteor': patch
---

Reverted the `loadMissedMessages` deprecation introduced in #40711. The reconnect catch-up keeps using the `loadMissedMessages` DDP method instead of `chat.syncMessages`, since the `chat.syncMessages` query (by `_updatedAt` + trash collection) is currently too slow for this path. The deprecation notice was removed until the query is optimized.
