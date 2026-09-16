---
'@rocket.chat/core-typings': patch
'@rocket.chat/meteor': patch
---

Stops the shared audio player and hides the Now Playing card when the original message of a quoted audio attachment is deleted, including when it was quoted from a different room, and keeps the player's copy of the playing message current so pinning it mid-playback no longer stops playback on a later bulk delete
