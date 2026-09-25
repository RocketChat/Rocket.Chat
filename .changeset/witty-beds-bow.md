---
'@rocket.chat/meteor': patch
---

Fixes direct messages addressed by username, such as the ones opened with **Reply in direct message**, not being found on the first lookup — which made opening a conversation cost an extra request and log an avoidable `Invalid Room` error.
