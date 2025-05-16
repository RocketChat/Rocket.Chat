---
"@rocket.chat/meteor": patch
---

Fixes an issue that caused the auto transfer process due to agent inactivity to fail with error `Missing property userType` when the target of the transfer was the queue.
