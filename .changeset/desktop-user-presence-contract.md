---
'@rocket.chat/desktop-api': minor
'@rocket.chat/meteor': minor
---

Adds a presence contract for the desktop app. The web client sends the status, custom status text, expiration, connection and login state of the user through `setUserPresenceState`. It also sends the custom statuses of the workspace. A status change from the desktop tray uses the same flow as the user menu.
