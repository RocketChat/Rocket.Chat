---
'@rocket.chat/meteor': patch
---

This adjustment removes deprecated `livechat:addAgent` and `livechat:addManager` method. Moving forward use `livechat/users/agent` and `livechat/users/manager` endpoints to add agent and manager respectively.
