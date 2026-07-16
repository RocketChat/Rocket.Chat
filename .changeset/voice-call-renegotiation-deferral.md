---
'@rocket.chat/media-signaling': patch
'@rocket.chat/meteor': patch
---

Fixed screen sharing silently failing to start when initiated right after the voice call was connected. The renegotiation request could be discarded while the connection was still being negotiated, leaving the presenter with a share that never reached the other participant; it is now sent once the ongoing negotiation completes.
