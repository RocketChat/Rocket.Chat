---
'@rocket.chat/meteor': patch
'@rocket.chat/ui-registration': patch
'@rocket.chat/i18n': patch
---

Shows why an OAuth login failed on the login page, instead of an "Internal Server Error" page or a popup that never closes. Popup OAuth login now also completes with providers that send `Cross-Origin-Opener-Policy`.
