---
'@rocket.chat/authorization': patch
'@rocket.chat/meteor': patch
'@rocket.chat/streamer': patch
'@rocket.chat/ddp-server': patch
---

Fixes private discussions allowing users with access to the parent room to read or join them without access to the discussion itself. Also checks access when reusing an existing discussion and before delivering new messages to an existing stream subscription.
