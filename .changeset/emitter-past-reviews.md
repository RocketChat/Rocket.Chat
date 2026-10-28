---
'@rocket.chat/emitter': patch
---

Fixes `once` handlers that could run more than once (when re-emitting their own event, after throwing, or during a nested emission) or stay registered forever (when the same handler was also added with `on` to a different event).

The function returned by `on`/`once` now removes only the registration it created. Previously it removed the first registration of the same handler for that event, which differs when a handler is registered more than once on the same event.
