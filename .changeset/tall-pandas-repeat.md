---
'@rocket.chat/meteor': patch
---

Aligns the rate limits of `spotlight`, `directory`, `chat.followMessage` and `chat.unfollowMessage` with the values defined in the DDP methods they replaced. They were falling back to the generic REST default of 10 requests per 60 seconds instead.
