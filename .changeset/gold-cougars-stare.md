---
"@rocket.chat/meteor": patch
---

Fixes issue that allowed agents to join a closed livechat conversation if they don't have the `preview-c-room` permission, this creates a livechat room that cannot be closed or removed from the sidebar
