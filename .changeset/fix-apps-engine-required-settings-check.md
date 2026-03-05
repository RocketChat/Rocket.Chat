---
"@rocket.chat/apps-engine": patch
---

Fixed `areRequiredSettingsSet` to correctly identify unset required app settings. Previously, the check compared values against the string literal `"undefined"` instead of using `typeof`, and also incorrectly treated `null` and empty string (`""`) as valid configured values. The method now uses a strict `isValueSet` guard so that `null`, `""`, and `undefined` are all treated as unset, preventing apps with empty required settings from being enabled.
