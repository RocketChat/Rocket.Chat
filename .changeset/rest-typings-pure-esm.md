---
'@rocket.chat/rest-typings': patch
---

Fixes `require()` and `import` of the package in Node.js. `dist` held ES module syntax with relative imports that had no file extension, so Node.js could not resolve them. The package now sets `"type": "module"`, declares an `exports` map, and uses explicit `.js` paths, so deep imports into `dist` no longer resolve. CommonJS consumers need a Node.js version that can `require()` ES modules (20.19 or 22.12 and later).
