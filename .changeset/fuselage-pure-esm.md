---
'@rocket.chat/fuselage': minor
---

Ships as an ES module. The package is `"type": "module"`, and its bundles are ES modules instead of CommonJS. The `index.js` that picked a bundle from `NODE_ENV` at runtime is gone. An `exports` map picks the bundle instead: the `production` condition, which bundlers set for production builds, selects `dist/fuselage.production.js`, and anything else gets `dist/fuselage.development.js`. Besides the entry, `exports` exposes the stylesheets (`dist/*.css`), the fonts (`dist/fonts/*`) and `package.json`. Deep imports into other `dist/` files no longer resolve. The `ElementProps` type, which component props are built from, is now exported from the entry so code inferring those props can still name it. The design tokens are now bundled instead of imported from `@rocket.chat/fuselage-tokens` at runtime.
