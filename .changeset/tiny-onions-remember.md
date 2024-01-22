---
"@rocket.chat/meteor": patch
"@rocket.chat/core-typings": patch
"@rocket.chat/model-typings": patch
---

Fixed an issue caused by the `Fallback Forward Department` feature. Feature could be configured by admins in a way that mimis a loop, causing a chat to be forwarded "infinitely" between those departments. System will now prevent Self & 1-level deep circular references from being saved, and a new setting is added to control the maximum number of hops that the system will do between fallback departments before considering a transfer failure.
