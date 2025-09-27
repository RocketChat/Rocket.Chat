---
'@rocket.chat/i18n': patch
'@rocket.chat/meteor': patch
---

Fixes an issue where the encryption toggle was incorrectly reset/disabled/enabled in the Teams creation modal when Broadcast or Private was toggled, or when the user lacked unrelated permissions.
