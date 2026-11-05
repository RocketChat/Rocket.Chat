---
'@rocket.chat/meteor': patch
---

Fixes the memory usage of the web client and the desktop app, which increased for as long as the app stayed open. Each new message that moved a room in the sidebar added an event listener to the room avatar.
