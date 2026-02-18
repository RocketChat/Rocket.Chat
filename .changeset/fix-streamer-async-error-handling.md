---
"@rocket.chat/meteor": patch
---

fix: await async operations in Streamer.sendToManySubscriptions to prevent message delivery failures and race conditions
