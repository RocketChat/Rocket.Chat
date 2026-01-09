---
'@rocket.chat/meteor': patch
---

Fixes an issue where iframe external commands sent via `window.postMessage` were not being handled correctly when Rocket.Chat was embedded inside an iframe.
