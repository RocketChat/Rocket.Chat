---
'@rocket.chat/peggy-loader': minor
---

Declares itself an ES module and adds an `exports` map, so deep imports into `dist` no longer resolve. Webpack and CommonJS consumers need a Node.js version that can `require()` ES modules (20.19 or 22.12 and later).
