---
'@rocket.chat/ddp-client': patch
---

Fixes `RocketchatSdkLegacyImpl` never restoring subscriptions after a reconnection and `unsubscribeAll()` unsubscribing from nothing
