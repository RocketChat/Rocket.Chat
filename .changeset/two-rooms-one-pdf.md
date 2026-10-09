---
'@rocket.chat/omnichannel-services': patch
---

Fixes a livechat transcript PDF that could be uploaded empty or truncated to one of the two rooms it is sent to, when the uploads started reading the rendered PDF at different times.
