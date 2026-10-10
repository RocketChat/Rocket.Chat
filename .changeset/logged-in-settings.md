---
'@rocket.chat/meteor': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/core-services': minor
'@rocket.chat/models': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/ddp-client': minor
'@rocket.chat/ddp-streamer': minor
---

Adds a signed-in visibility level for settings. Settings registered with `loggedIn: true` (never together with `public: true`) are served to every signed-in user through the new `GET /v1/settings.loggedIn` endpoint and the `logged-settings-changed` stream event, and are read on the client with `useSetting`
