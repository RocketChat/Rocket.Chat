---
'@rocket.chat/ddp-client': patch
'@rocket.chat/livechat': patch
---

Fixes the Livechat client ignoring a visitor token set through `credentials.token`, `onQueuePositionChange` subscribing without the visitor token, and visitor endpoints throwing synchronously instead of rejecting when there is no token
