---
"@rocket.chat/meteor": patch
---

Fixed a bug where renaming a channel marked the room as unread for all members but did not update `room.lastMessage`, so the sidebar's "last message" preview gave no indication a rename happened. The rename now uses `saveSystemMessageAndNotifyUser` so `lastMessage` is updated, and the sidebar preview renders system messages with their localized label instead of the raw `msg` field.
