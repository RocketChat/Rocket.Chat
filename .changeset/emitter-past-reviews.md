---
'@rocket.chat/emitter': patch
---

Fixes `once` handlers that could run more than once (when re-emitting their own event, after throwing, or during a nested emission) or stay registered forever (when the same handler was also added with `on` to a different event).
