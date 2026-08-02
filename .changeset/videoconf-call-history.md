---
'@rocket.chat/core-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Group video conferences now show up in the personal Call History page alongside VoIP calls. Ending a conference writes a `video-conference` call-history item (room, title and joined-participant count) for every member, with `outbound`/`inbound` direction from the creator's perspective and `not-answered` for a member who declined without ever joining. The call-history list's free-text search now also matches on the conference's title.
