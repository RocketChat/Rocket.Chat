---
"@rocket.chat/cron": patch
"@rocket.chat/meteor": patch
---

Increase cron job check delay to 1 min from 5s.

This reduces MongoDB requests introduced on 6.3.
