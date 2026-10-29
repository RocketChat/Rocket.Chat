---
'@rocket.chat/meteor': patch
'@rocket.chat/core-services': patch
'@rocket.chat/ddp-client': patch
'@rocket.chat/streamer': patch
---

Fixes encrypted room members who wait for a room key and never get it. A member without the room key now adds itself to the room's key queue, so members that hold the key send it. The unused key request events are removed.
