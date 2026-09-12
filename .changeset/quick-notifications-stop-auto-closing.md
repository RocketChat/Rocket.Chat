---
'@rocket.chat/meteor': patch
---

Fixes desktop notifications being force-closed 10 seconds after being shown, even though the server never requests a duration for them. The forced close only told the app the notification was finished while the OS could still display and interact with it (for example, quick-replying from a Windows Action Center card), which could cause late replies to be silently dropped. Desktop notifications now only auto-close when the server explicitly provides a duration.
