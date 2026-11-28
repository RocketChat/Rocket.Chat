---
'@rocket.chat/core-typings': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/meteor': minor
---

Keeps the UiKit modals, contextual bars and banners an app opens for a logged-in user on the server, so when the user submits or closes one the app receives the view as it sent it, with the values the user filled in.
A submit with no record of the view (expired, or never recorded) is refused, and a close with no record never reaches the app. Views opened for a Livechat visitor are not recorded: the app receives the visitor's copy.
For a view opened for a logged-in user, `private_metadata` stays on the server and never reaches the browser. A visitor's view keeps it.
