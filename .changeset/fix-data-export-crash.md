---
"@rocket.chat/meteor": patch
---

Fix `sendViaEmail` throwing a `TypeError` and crashing the data export loop when a user context has an explicitly empty `emails` array.
