---
'@rocket.chat/meteor': major
---

Removed deprecated methods `livechat:saveTrigger` and `livechat:removeTrigger`. Moving forward use the endpoints `livechat/triggers (POST)` and  `livechat/triggers/:_id (DELETE)` respectively.
