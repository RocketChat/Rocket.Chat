---
"@rocket.chat/meteor": patch
---

Fixes buffer as response from API

Currently, the only known case affected is Apps Engine icons. This patch ensures the API returns a buffer as the response, resolving issues with clients expecting a binary payload.
