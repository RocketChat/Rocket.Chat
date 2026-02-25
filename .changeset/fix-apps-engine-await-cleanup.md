---
'@rocket.chat/apps-engine': patch
---

Adds missing `await` in `AppSchedulerManager.cleanUp` to ensure scheduled jobs are fully cancelled before the method resolves, preventing race conditions during app uninstall/disable.
