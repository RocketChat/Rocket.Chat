---
'@rocket.chat/meteor': patch
'@rocket.chat/rest-typings': patch
---

Fixes a new encrypted room that gets a room key id but no room key for any member. The client that makes the first room key set the key id and saved its own copy of the key in two requests. A page that unloaded or lost its connection between them left a key id that no member could use. Then every member waited for the key. `e2e.setRoomKeyID` now takes an optional `key`, the room key encrypted for the caller. The server saves it in the same request. The client sends both together, and does not set a key id when it cannot encrypt the key for the current user.
