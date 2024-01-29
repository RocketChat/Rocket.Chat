---
'@rocket.chat/meteor': patch
---

Fixed an issue where the webclient didn't properly clear the message caches from memory when a room is deleted. When this happened to basic DMs and the user started a new DM with the same target user, the client would show the old messages in the room history even though they no longer existed in the server.
