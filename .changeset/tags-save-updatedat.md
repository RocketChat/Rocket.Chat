---
"@rocket.chat/meteor": patch
---

Fixed saving a livechat tag failing with "Invalid response" — the model mutated its return value with `_updatedAt`, which the endpoint response schema rejects
