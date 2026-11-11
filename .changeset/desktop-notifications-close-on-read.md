---
'@rocket.chat/meteor': patch
---

Fixes the memory usage of the desktop app, which increased with each desktop notification. The web client now closes the notifications of a room when the room is read, closes those of a thread when the thread is read, and keeps at most 50 non-conference notifications open.
