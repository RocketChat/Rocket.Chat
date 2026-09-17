---
'@rocket.chat/core-typings': patch
'@rocket.chat/meteor': patch
---

Stops the shared audio player and hides the Now Playing card when the audio is no longer the listener's to hear: when the message that owns the playing audio attachment is deleted, when the original message of a quoted audio attachment is deleted, when the listener leaves or is removed from the room the audio belongs to, and — for quotes created from now on — when the original is deleted in another room it was quoted from. Pinning a message while its audio plays no longer stops playback on a later bulk delete that excludes pinned messages. Pinning a message now also broadcasts the changed message, as unpinning already did, so clients that are not rendering it still see it become pinned
