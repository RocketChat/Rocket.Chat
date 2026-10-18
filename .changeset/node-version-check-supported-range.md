---
'@rocket.chat/meteor': patch
---

Fixes the server refusing to start on Node.js 22 releases that the release notes list as supported (22.22.3 and later). The startup check now validates the running Node.js version against the same supported range shown in the release notes, so Node.js 24 releases older than 24.15.0 are also reported as unsupported.
