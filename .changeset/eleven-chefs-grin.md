---
'@rocket.chat/meteor': major
---

Remove support of filtering by agent's username on the following endpoint:

- `/v1/livechat/rooms`

The performance of the endpoint was improved when filtering by:

- Agent
- Deparment
- Open chats
