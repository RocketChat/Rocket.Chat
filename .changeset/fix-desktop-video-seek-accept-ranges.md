---
'@rocket.chat/meteor': patch
---

Fixes uploaded video/audio files not being seekable in Rocket.Chat Desktop (Electron) while working fine in the web app. The `ufs` file server only advertised `Accept-Ranges: bytes` inside an unreachable code path (`req.headers` is always an object for real HTTP requests, so the `else` branch that set this header never ran), so the header was never sent on the initial response. `Accept-Ranges` is now always included, and `206 Partial Content` responses continue to work as before.
