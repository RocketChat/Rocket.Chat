---
'@rocket.chat/core-typings': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/meteor': minor
---

Keeps the UiKit modals and contextual bars an app opens for a user on the server, so when the user submits or closes one the app receives the view as it sent it, with the values the user filled in. When the server has no record of the view (opened before this release, expired, or opened for a Livechat visitor), the app still receives the client copy.
