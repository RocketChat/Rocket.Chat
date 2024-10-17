---
'@rocket.chat/meteor': major
---

Removed deprecated methods `livechat:removeAgent`, `livechat:removeManager` and `livechat:removeDepartment`. Moving forward, use `livechat/users/agent/:_id`, and `livechat/users/manager/:_id` and `livechat/department/:_id` respectively.`
