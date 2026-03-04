---
"@rocket.chat/apps-engine": patch
---

Fixed `areRequiredSettingsSet` comparing setting values against the string literal `"undefined"` instead of using `typeof` to check for actual `undefined` values, which caused required app settings to never be properly validated.
