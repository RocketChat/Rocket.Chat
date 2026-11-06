---
'@rocket.chat/meteor': patch
---

Fix memory leak in VideoMessageRecorder and AudioMessageRecorder by clearing recording interval properly on unmount
