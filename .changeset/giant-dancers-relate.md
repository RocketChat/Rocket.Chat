---
"@rocket.chat/meteor": patch
---

Fixed an `UnhandledPromiseRejection` error on `PUT livechat/departments/:_id` endpoint when `agents` array failed validation
