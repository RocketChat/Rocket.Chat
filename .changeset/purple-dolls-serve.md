---
'@rocket.chat/web-ui-registration': patch
'@rocket.chat/i18n': patch
'@rocket.chat/meteor': patch
---

Fixes an issue where creating a new user with an invalid username (containing special characters) resulted in an error message, but the user was still created. The user creation process now properly aborts when an invalid username is provided.
