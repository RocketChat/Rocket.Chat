---
'@rocket.chat/memo': minor
---

Ships only an ES module build. The `dist/cjs` and `dist/esm` builds are replaced by a single one in `dist`, and the package now declares an `exports` map, so deep imports into `dist` no longer resolve. CommonJS consumers need a Node.js version that can `require()` ES modules (20.19 or 22.12 and later).
