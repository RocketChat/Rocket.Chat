---
'@rocket.chat/logo': patch
---

The CommonJS build no longer ships a duplicate copy of the type declarations, leaving `dist/esm` as the single source of types, where `types` already pointed.
