---
'@rocket.chat/core-typings': patch
'@rocket.chat/meteor': patch
---

Stops the shared audio player and hides the Now Playing card when the audio is no longer the listener's to hear: when the original message of a quoted audio attachment is deleted, when the listener leaves or is removed from the room the audio belongs to, and — for quotes created from now on — when the original is deleted in another room it was quoted from. Pinning a message while its audio plays no longer stops playback on a later bulk delete that excludes pinned messages, for as long as that message stays rendered
