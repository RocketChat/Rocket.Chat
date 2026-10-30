---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
'@rocket.chat/model-typings': patch
---

Fixes slow message sending in large channels when a message counts as unread for every member (`@all`, `@here` or the "All messages" unread count setting), by sending the subscription update only to members who are connected
