---
"@rocket.chat/meteor": patch
---

Fixes error `audio.pause() is not a function` and makes the newRoomSound respect the volume set in user preferences. Also moves the code to a hook instead of meteor.startup
