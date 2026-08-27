---
'@rocket.chat/rest-typings': major
'@rocket.chat/meteor': major
---

Removes the deprecated `DELETE /v1/canned-responses` endpoint, which received the canned response id in the request body. Use `DELETE /v1/canned-responses/:_id` instead.
