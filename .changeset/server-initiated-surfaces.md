---
'@rocket.chat/apps-engine': minor
'@rocket.chat/ui-kit': minor
'@rocket.chat/meteor': minor
---

Added a new `IPreFileMessageConfirm` app event and an `openServerInitiatedView` UI accessor.

`IPreFileMessageConfirm` fires when a file *message* is about to be posted (the send stage), unlike `IPreFileUpload` which fires at the blob-upload/attach stage. Returning `false` cancels the send.

`openServerInitiatedView(view, user)` lets an app open a UIKit modal/contextual bar in response to a server-side event, without a user-initiated `triggerId`. It is gated by a new opt-in `ui.server-initiated-view` permission; the server flags the interaction `serverInitiated` and the client renders it through a dedicated typed channel, leaving the existing triggerId validation flow untouched.
