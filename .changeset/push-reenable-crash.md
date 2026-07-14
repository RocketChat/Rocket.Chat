---
'@rocket.chat/meteor': patch
---

Fixes a server crash when re-enabling the "Enable Push" setting after it was disabled. Push notifications are now fully reconfigured on re-enable, so settings changed while push was disabled are picked up as well.
