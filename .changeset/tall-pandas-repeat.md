---
'@rocket.chat/meteor': patch
---

Aligns the rate limits of `spotlight`, `directory`, `chat.followMessage`, `chat.unfollowMessage`, `im.create`, `dm.create`, `rooms.info` and `users.forgotPassword` with the values defined in the DDP methods they replaced. Most of them were falling back to the generic REST default of 10 requests per 60 seconds instead.
