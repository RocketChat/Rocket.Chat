---
"@rocket.chat/meteor": patch
---

Fixes push and email notifications piling up under load because the server paused for 2 seconds after every 100 notifications, even when more were waiting
