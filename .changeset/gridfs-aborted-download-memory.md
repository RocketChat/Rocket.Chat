---
'@rocket.chat/meteor': patch
---

Fixes server memory growing each time a client stops a GridFS download early, such as a video player that loads only the start of a file or a user leaving a room while an image loads. The database cursor and the file chunks it had already fetched stayed in memory until the server restarted.
