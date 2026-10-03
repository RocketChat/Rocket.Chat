---
'@rocket.chat/meteor': patch
'@rocket.chat/i18n': patch
'@rocket.chat/tools': patch
---

Fix regression where Traditional Chinese (zh-TW, zh-HK) locales resolve to Simplified Chinese (zh) resources and browser language detection collapses Traditional Chinese variants into Simplified Chinese.
