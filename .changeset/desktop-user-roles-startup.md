---
'@rocket.chat/meteor': patch
---

Stops sending an empty role list to Rocket.Chat Desktop while the user still loads at startup. The desktop app uses these roles to select the version expiration messages that it shows
