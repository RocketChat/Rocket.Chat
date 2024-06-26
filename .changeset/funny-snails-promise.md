---
"@rocket.chat/meteor": patch
"@rocket.chat/livechat": patch
---

livechat `setDepartment` livechat api fixes: 
- Changing department didn't reflect on the registration form in real time
- Changing the department mid conversation didn't transfer the chat
- Depending on the state of the department, it couldn't be set as default

