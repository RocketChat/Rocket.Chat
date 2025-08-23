---
'@rocket.chat/meteor': patch
---

Fixes an issue where audio and video messages would stop playing if left idle past their link expiration. Now the player automatically refreshes expired links so users can continue listening or watching without reloading the chat.
