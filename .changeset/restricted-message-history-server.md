---
'@rocket.chat/meteor': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/message-types': minor
'@rocket.chat/streamer': minor
'@rocket.chat/i18n': minor
---

Adds restricted message history (Enterprise): with `Restricted_Message_History_Enabled` on, rooms can hide earlier messages from members who join later (`hideHistoryForNewMembers` in `rooms.saveRoomSettings`), and `rooms.setMemberHistoryAccess` hides or restores one member's history. Every API that returns room messages, live updates included, leaves out what the member can't see.
