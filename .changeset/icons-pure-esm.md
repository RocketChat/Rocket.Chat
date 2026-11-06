---
'@rocket.chat/icons': minor
---

Ships only an ES module build. The CommonJS build and `dist/index.mjs` are gone: `dist/index.js` is now the ES module, and the package declares an `exports` map that still exposes the generated stylesheet, font and SVG files under `dist`. CommonJS consumers need a Node.js version that can `require()` ES modules (20.19 or 22.12 and later), and read the character map from `require('@rocket.chat/icons').default`.
