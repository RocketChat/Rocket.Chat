---
'@rocket.chat/meteor': patch
---

Deprecates the `getMessages` real-time API method in favor of the new `POST /v1/chat.getMessages` endpoint. The method keeps working until it is removed in 9.0.0.
