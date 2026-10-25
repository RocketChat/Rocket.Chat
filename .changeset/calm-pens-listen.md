---
'@rocket.chat/meteor': patch
'@rocket.chat/rest-typings': patch
'@rocket.chat/fuselage-ui-kit': patch
'@rocket.chat/i18n': patch
---

Fixes `chat.sendMessage` accepting message fields that only the server may set, and malformed message blocks that made a room unreadable
