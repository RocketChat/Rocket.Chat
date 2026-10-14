---
'@rocket.chat/streamer': patch
---

Validate video-conference events and caller authorization via `VideoConf.validateAction` before relaying on `notify-room-users` stream.
