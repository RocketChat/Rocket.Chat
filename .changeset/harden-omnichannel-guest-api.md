---
'@rocket.chat/meteor': patch
'@rocket.chat/rest-typings': patch
---

Hardens Omnichannel guest REST APIs against DoS and token enumeration with rate limiting, and migrates `livechat/upload/:rid`, `livechat/visitor`, `livechat/transfer.history`, `livechat/transcript`, and `livechat/triggers` to typed `API.v1.get/post/delete` endpoints with strict AJV request and response validation.