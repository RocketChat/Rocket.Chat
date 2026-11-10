---
'@rocket.chat/ddp-client': patch
---

Fixes stream callbacks firing once per listener for each event when the same stream key is listened to more than once: `sdk.stream` now shares one server subscription per stream key and unsubscribes when its last listener stops
