---
"@rocket.chat/meteor": patch
---

fix: Trigger `IPostLivechatRoomStarted` app event after inquiry is created. Previously, this event was fired after a room was created. This allowed to do some actions on rooms, but more elevated actions like transfering a room were not possible as at this point, an inquiry didn't exist.
