---
'@rocket.chat/core-services': patch
---

Fixes a startup crash (`TypeError: i[method].bind is not a function`) in `LocalBroker` when a registered service exposes an accessor (getter/setter) property on its prototype. The broker now only registers actual function methods as callable RPCs, skipping accessors and non-function properties.
