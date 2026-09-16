---
'@rocket.chat/meteor': patch
---

Stops the shared audio player closing on a bulk delete that excludes pinned messages or ignores discussions, in the case where the message was pinned or moved into a discussion after playback started
