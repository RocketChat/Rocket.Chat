---
"@rocket.chat/apps-engine": patch
---

Added missing `await` in `AppSchedulerManager.cleanUp()` to ensure scheduled jobs are actually cancelled before the method resolves, preventing ghost job execution after app removal.
