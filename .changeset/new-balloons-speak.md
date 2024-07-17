---
'@rocket.chat/meteor': patch
---

Fixed web client crashing on firefox private window. We use serviceWorkers for end to end encrypted file messages, this service worker is not available for firefox private window, so handled that.
