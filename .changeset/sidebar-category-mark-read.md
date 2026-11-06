---
'@rocket.chat/meteor': minor
'@rocket.chat/i18n': minor
---

Adds "Mark read" to the sidebar group menus on licensed workspaces: it marks every unread room of the group as read, threads included, after saying how many rooms that is. The item is disabled while the group has nothing unread. The `subscriptions.read` endpoint allows 120 calls a minute instead of the default ten, so a group's worth of rooms gets through.
