---
"@rocket.chat/meteor": patch
---

Fixes React Query cache not being invalidated on DDP reconnection, causing open thread panels and infinite message lists to not refresh with missed messages after a reconnect.
