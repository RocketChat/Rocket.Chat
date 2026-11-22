---
'@rocket.chat/meteor': patch
'@rocket.chat/federation-matrix': patch
'@rocket.chat/core-services': patch
---

Rejects incoming federated events over the Matrix limits (more than 20 `prev_events`, more than 10 `auth_events`, or larger than 64 KiB) before validating them, so oversized events are cheap to refuse and no longer produce unbounded log lines
