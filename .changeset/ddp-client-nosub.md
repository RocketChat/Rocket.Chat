---
'@rocket.chat/ddp-client': patch
---

Fixes subscriptions stopped by the server: a `nosub` without an error no longer counts as ready, a subscription stopped after it was ready is no longer kept and resent on every reconnection, and `Subscription.onChange` now fires on every change instead of only the first
