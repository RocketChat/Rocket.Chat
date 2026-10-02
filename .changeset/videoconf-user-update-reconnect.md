---
'@rocket.chat/meteor': patch
---

Fixes the video conference notification stream being torn down and re-subscribed on every login or connection status update, even when the logged user had not changed
