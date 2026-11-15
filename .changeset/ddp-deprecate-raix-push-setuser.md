---
'@rocket.chat/meteor': patch
---

Deprecates the `raix:push-setuser` real-time API method. It was inherited from the `raix:push` package for Cordova clients and has never been called by Rocket.Chat clients, which bind push tokens to users through `POST /v1/push.token`. It will be removed in 9.0.0 without a replacement.
