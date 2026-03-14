---
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes an issue where messages appeared as unread even when all active users had read them. Read receipts now correctly ignore deactivated users.
