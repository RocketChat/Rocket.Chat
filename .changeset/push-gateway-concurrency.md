---
"@rocket.chat/meteor": patch
---

Fixes push notifications arriving minutes late under load when the push gateway is slow to answer; each server now sends many push notifications at once instead of one at a time
