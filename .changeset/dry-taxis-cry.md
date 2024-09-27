---
'@rocket.chat/meteor': patch
---

Adjusts the findOneAndDelete method to insert into the trash collection before deletion to prevent a race condition that causes livechat users to get stuck in the agent's sidebar panel after being forwarded.
