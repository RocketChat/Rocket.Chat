---
'@rocket.chat/core-typings': patch
'@rocket.chat/meteor': patch
---

Stops the shared audio player and hides the Now Playing card when the audio is no longer the listener's to hear: when the message that owns the playing audio attachment is deleted, when the original message of a quoted audio attachment is deleted, when the listener leaves or is removed from the room the audio belongs to, and — for quotes created from now on — when the original is deleted in another room it was quoted from. Pinning a message while its audio plays no longer stops playback on a later bulk delete that excludes pinned messages. Pinning a message now also broadcasts the changed message, as unpinning already did, so clients that are not rendering it still see it become pinned. Pinning a message that carries a file attachment now succeeds instead of answering a validation error: the pin was stored either way, but the response failed its own schema, so the client reported a failure and put the message back to unpinned until the next reload. Pinning the room's last message now also tells the room its stored copy changed, as unpinning already did, so a sidebar preview no longer keeps the pre-pin version
