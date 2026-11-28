---
'@rocket.chat/fuselage-tokens': patch
---

Declares the JSON token files with `export =` and ships `dist/package.json` as `{"type": "commonjs"}`, so TypeScript types a default import of them correctly from ES module packages too.
