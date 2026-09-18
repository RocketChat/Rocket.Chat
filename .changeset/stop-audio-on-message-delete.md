---
'@rocket.chat/core-typings': patch
'@rocket.chat/meteor': patch
---

Stops audio playback when the message you are listening to is deleted, when the message it was quoted from is deleted, or when you leave its room.

Fixes an error when pinning a message with a file attachment, which left the message looking unpinned until the page was reloaded.
