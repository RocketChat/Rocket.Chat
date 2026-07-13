---
'@rocket.chat/meteor': patch
'@rocket.chat/cron': minor
---

Unifies the omnichannel job schedulers (auto-close on-hold chats, auto-transfer unanswered chats and queue inactivity monitor) under the cron system, reducing database polling by removing three dedicated scheduler instances
