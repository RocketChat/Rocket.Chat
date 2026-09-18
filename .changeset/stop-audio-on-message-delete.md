---
'@rocket.chat/core-typings': patch
'@rocket.chat/meteor': patch
---

Stops the audio player when the message you are listening to is no longer available to you — when that message is deleted, when the message it was quoted from is deleted, or when you leave or are removed from its room. The Now Playing card is hidden at the same time.

Fixes pinning a message that has a file attachment showing an error even though the pin was saved, which left the message looking unpinned until the page was reloaded.
