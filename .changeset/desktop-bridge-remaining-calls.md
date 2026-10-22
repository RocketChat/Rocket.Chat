---
'@rocket.chat/meteor': patch
---

Fixes a crash of the web client in Rocket.Chat Desktop when the desktop app fails to set up the idle detection for the user presence or to give the size limit for encrypted PDF previews. The web client now logs the error and uses its default behavior: its own idle detection, and the default size limit
