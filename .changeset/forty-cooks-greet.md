---
'@rocket.chat/meteor': patch
---

Fixes the user status staying away after the user came back, with the user menu unable to change it. It affected mostly the desktop app and users whose connection had just been re-established, and it only cleared on the next idle period or by reloading the app.
