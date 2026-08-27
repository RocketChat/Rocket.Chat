---
'@rocket.chat/models': major
'@rocket.chat/meteor': major
---

Removes unused indexes: `activity` on `rocketchat_livechat_visitor`, `ip`, `loginAt` on `rocketchat_sessions` and `desktopNotifications`, `mobilePushNotifications`, `emailNotifications` on `rocketchat_subscription`. No query relies on them; removing them avoids unnecessary index maintenance on writes. On upgrade the indexes are dropped from the database.
