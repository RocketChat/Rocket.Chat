---
'@rocket.chat/meteor': patch
---

Fixed a problem in how server was processing errors that was sending 2 ephemeral error messages when @all or @here were used while they were disabled via permissions
