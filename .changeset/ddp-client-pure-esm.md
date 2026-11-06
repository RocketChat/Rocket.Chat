---
'@rocket.chat/ddp-client': minor
---

Ships only an ES module build: `dist/index.js` is now an ES module, and the package declares an `exports` map, so deep imports into `dist` no longer resolve. CommonJS consumers need a Node.js version that can `require()` ES modules (20.19 or 22.12 and later).
