---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
---

Return deletion placeholders for hidden messages during message synchronization. Clients can delete stale copies of messages deleted while they were offline. The response excludes hidden message content and history copies.
