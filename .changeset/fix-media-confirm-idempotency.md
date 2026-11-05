---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
'@rocket.chat/model-typings': patch
---

Fixed `rooms.mediaConfirm` creating duplicate messages when the same fileId was confirmed more than once, such as a client retrying after a dropped response or two near-simultaneous confirm requests. The endpoint now atomically claims the confirmation on the upload record (`Uploads.confirmTemporaryFile` only matches once per upload) before creating the message; a request that loses the race waits briefly for the winning request's message and returns that instead of creating a duplicate.
