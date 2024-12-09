---
"@rocket.chat/meteor": patch
---

Fixes `waiting queue` feature. When `Livechat_waiting_queue` setting is enabled, incoming conversations should be sent to the queue instead of being assigned directly.
