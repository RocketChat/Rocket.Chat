---
"@rocket.chat/meteor": minor
"@rocket.chat/livechat": minor
---

Makes the triggers fired by the condition `after-guest-registration` persist on the livechat client, it will persist through reloads and pagination, only reseting when a conversation is closed (no changes were done on the agent side of the conversation)
