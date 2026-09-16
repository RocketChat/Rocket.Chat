---
'@rocket.chat/core-typings': patch
'@rocket.chat/meteor': patch
---

Stops the shared audio player and hides the Now Playing card when the audio is no longer the listener's to hear: when the original message of a quoted audio attachment is deleted, including from another room, and when the listener leaves or is removed from the room the audio belongs to. Also keeps the player's copy of the playing message current, so pinning it mid-playback no longer stops playback on a later bulk delete
