---
"@rocket.chat/meteor": patch
---

Fixes an issue with the forwarding chats procedure that didn't stop when forwarding to an offline department when using auto assignment routing, which could lead the chat to be left in an inconsistent state
