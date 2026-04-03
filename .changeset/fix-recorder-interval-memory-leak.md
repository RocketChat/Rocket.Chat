---
'@rocket.chat/meteor': patch
---

Fixes memory leak in `VideoMessageRecorder` and `AudioMessageRecorder` caused by `setInterval` not being cleared on component unmount.
