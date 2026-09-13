---
'@rocket.chat/meteor': patch
---

Fix `/v1/chat.getMessages` returning 404 when no messages match and prevent cascading failures in `useParentMessage`
