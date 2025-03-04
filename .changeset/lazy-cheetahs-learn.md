---
"@rocket.chat/meteor": patch
---

Fixes app event `IPostLivechatAgentAssigned` receiving a room object previous to the assignment of agent, causing `room.servedBy` to be undefined on apps
