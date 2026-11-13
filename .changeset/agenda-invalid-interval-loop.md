---
'@rocket.chat/agenda': patch
'@rocket.chat/meteor': patch
---

Fixes background jobs running nonstop when their repeat interval can't be scheduled, such as a cron expression whose month is outside the `0`–`11` range used by the scheduler's cron library, a step of `0`, or an interval shorter than 1 ms. These jobs are now marked as failed and stop running instead of starting again as soon as each run finishes, and registering such a job again with a valid interval schedules it again.
