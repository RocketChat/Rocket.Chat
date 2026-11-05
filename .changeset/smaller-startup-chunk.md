---
'@rocket.chat/meteor': patch
---

Downloads less JavaScript when the web client starts: the login background no longer ships a server renderer, the conference window and call history load with their screens, the voice call session loads only where voice calls are enabled, and a second copy of react-aria is gone.
