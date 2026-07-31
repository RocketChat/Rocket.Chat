---
'@rocket.chat/meteor': patch
---

Fixes importers storing attributes with no value as `null` instead of omitting them, which could lead to invalid values (like `utcOffset: null`) being saved on the imported records
