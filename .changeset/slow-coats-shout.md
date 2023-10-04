---
"@rocket.chat/meteor": patch
"@rocket.chat/core-services": patch
"@rocket.chat/core-typings": patch
"@rocket.chat/model-typings": patch
"@rocket.chat/rest-typings": patch
"@rocket.chat/presence": patch
---

Count daily and monthly peaks of concurrent connections
 - Added `dailyPeakConnections` statistic for monitoring the daily peak of concurrent connections in a workspace;
 - Added `presence.getMonthlyPeakConnections` endpoint to enable workspaces to retrieve their monthly peak of concurrent connections.
