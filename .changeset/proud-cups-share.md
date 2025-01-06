---
"@rocket.chat/meteor": patch
---

Fixes `im.counters` endpoint returning `null` on `unread` messages property for users that have never opened the queried DM
