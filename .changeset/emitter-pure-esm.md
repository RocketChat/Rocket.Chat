---
'@rocket.chat/emitter': minor
---

Ships only an ES module build. The CommonJS build and `dist/index.module.js` are gone, and the package now declares an `exports` map, so deep imports into `dist` no longer resolve. CommonJS consumers need a Node.js version that can `require()` ES modules (20.19 or 22.12 and later).
