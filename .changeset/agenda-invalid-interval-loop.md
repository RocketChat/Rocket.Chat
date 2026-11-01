---
'@rocket.chat/agenda': patch
'@rocket.chat/meteor': patch
---

Fixes background jobs running nonstop when their schedule can't be parsed, such as a cron expression with month `12` or a step of `0`. These jobs are now marked as failed and stop running instead of starting again as soon as each run finishes.
