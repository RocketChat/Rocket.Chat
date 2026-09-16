---
'@rocket.chat/meteor': patch
---

Stops the shared audio player closing on a bulk delete that excludes pinned messages, in the case where the message was pinned after playback started
