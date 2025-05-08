---
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes an issue when sending a message on an omnichannel room would cause the web client to fetch the room data again.
