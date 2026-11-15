---
'@rocket.chat/desktop-api': minor
'@rocket.chat/meteor': minor
---

Adds a presence contract for the desktop app. Through `setUserPresenceState`, the web client sends the status, custom status text, expiration, connection and login state of the user. It also sends the statuses that the user can select and the custom statuses of the workspace. Through `setUserStatusChangeHandler`, the desktop tray changes the status with the same flow as the user menu.
