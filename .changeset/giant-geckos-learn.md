---
'@rocket.chat/meteor': patch
---

Fixes createDirectRoom ignoring subscriptionExtra.open option by reordering spread operators so subscriptionExtra takes precedence over the default member count check.
