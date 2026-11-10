---
'@rocket.chat/fuselage-toastbar': patch
---

The CommonJS build no longer ships a duplicate copy of the type declarations, leaving `dist/esm` as the single source of types, where `types` already pointed. The package also no longer publishes `testing.js`, an internal test helper that re-exported a devDependency.
