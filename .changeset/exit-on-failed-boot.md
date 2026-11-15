---
'@rocket.chat/meteor': patch
---

Fixes the server staying up without ever accepting connections when a step of its startup fails; it now logs the error and exits
