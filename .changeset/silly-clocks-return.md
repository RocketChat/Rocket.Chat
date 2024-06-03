---
'@rocket.chat/omnichannel-services': patch
'@rocket.chat/core-services': patch
'@rocket.chat/meteor': patch
---

Fixed error handling for files bigger than NATS max allowed payload. This should prevent PDFs from erroring out when generating from rooms that contain heavy images. 
