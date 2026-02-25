---
'@rocket.chat/meteor': patch
---

Replaces `forEach(async ...)` with `await Promise.allSettled([...subscriptions].map(async ...))` in `Streamer.sendToManySubscriptions` to prevent unhandled promise rejections when permission checks or socket sends fail for individual subscriptions.
