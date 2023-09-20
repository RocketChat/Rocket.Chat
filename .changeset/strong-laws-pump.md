---
'@rocket.chat/model-typings': patch
'@rocket.chat/meteor': patch
---

Change SAU aggregation to consider only sessions from few days ago instead of the whole past.

This is particularly important for large workspaces in case the cron job did not run for some time, in that case the amount of sessions would accumulate and the aggregation would take a long time to run.
