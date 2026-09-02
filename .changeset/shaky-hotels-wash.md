---
'@rocket.chat/meteor': minor
---

Adds the `per` option to `rateLimiterOptions`, so a REST endpoint can rate limit per user instead of per IP address, and applies it to `chat.sendMessage` — users on a shared address no longer compete for a single message allowance.
