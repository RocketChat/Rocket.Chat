---
'@rocket.chat/meteor': patch
---

Fixed agents' business-hour availability not being updated when they are removed from a department linked to a business hour while multiple business hours are enabled. The recomputation step always failed, leaving removed agents available (or unavailable) according to a business hour that no longer applied to them — and, on deployments running with `EXIT_UNHANDLEDPROMISEREJECTION` (or in development/test mode), the unhandled rejection crashed the server process.
