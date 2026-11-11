---
"@rocket.chat/meteor": patch
---

Fixes an issue where `GET /api/v1/livechat/department?enabled=false` ignored the `enabled=false` filter and returned all departments, including active ones.

