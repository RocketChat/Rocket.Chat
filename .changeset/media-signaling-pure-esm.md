---
'@rocket.chat/media-signaling': minor
---

Declares itself an ES module. `dist` already held ES module syntax, but the package didn't say so, so Node.js could only load it by detecting the syntax. It now sets `"type": "module"` and declares an `exports` map, so deep imports into `dist` no longer resolve. CommonJS consumers need a Node.js version that can `require()` ES modules (20.19 or 22.12 and later).
