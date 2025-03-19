---
"@rocket.chat/meteor": patch
---

Fixes an issue that allowed agents without the `preview-c-room` permission to join a closed livechat conversation, creating a livechat room that could not be closed or removed from the sidebar.
