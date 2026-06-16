---
"@rocket.chat/core-services": patch
"@rocket.chat/meteor": patch
---

Fix: Implement batching for presence status updates to prevent broadcast storms during mass user reconnections.
