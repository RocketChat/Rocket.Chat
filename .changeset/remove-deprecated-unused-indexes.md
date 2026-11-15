---
'@rocket.chat/models': major
'@rocket.chat/meteor': major
---

Removes unused indexes: `activity` on `rocketchat_livechat_visitor`, `ip_1_loginAt_-1` on `rocketchat_sessions`, `desktopNotifications`, `mobilePushNotifications` and `emailNotifications` on `rocketchat_subscription`, `roomId_1_userId_1_messageId_1` on `rocketchat_read_receipts` and `ts_1_reports.ts_1`, `message.u._id_1_ts_1`, `reportedUser._id_1_ts_1`, `message.rid_1_ts_1`, `message._id_1_ts_1` and `userId_1_ts_1` on `rocketchat_moderation_reports`.
