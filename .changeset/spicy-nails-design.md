---
"@rocket.chat/meteor": patch
"@rocket.chat/core-services": patch
"@rocket.chat/model-typings": patch
"@rocket.chat/models": patch
"@rocket.chat/ddp-streamer": patch
"@rocket.chat/presence": patch
---

Fixes user status inaccuracy by refreshing active connections and filtering out the stale ones.
