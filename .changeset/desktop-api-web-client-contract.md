---
'@rocket.chat/desktop-api': minor
---

Adds the web client's side of the desktop bridge contract: `setWebClientBridgeVersion(1)`, which a web client calls to announce that it pushes the server info, URL resolver, title, favicon, user roles, badge, login state, unread alert preference, git commit hash and Outlook credentials itself (presence is not part of version 1), `setUnreadAlertEnabled`, and the `DesktopWindowEvent` names the web client fires on `window`
