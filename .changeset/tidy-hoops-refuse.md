---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
'@rocket.chat/model-typings': patch
---

Fixes Omnichannel rooms failing to register agent responses (and showing send errors on messages and file uploads that were actually delivered) when the room carried corrupted visitor activity data created by older app integrations
