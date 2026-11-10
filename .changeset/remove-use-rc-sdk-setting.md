---
'@rocket.chat/meteor': major
'@rocket.chat/i18n': major
---

Removes the `Use_RC_SDK` setting (General → Use Rocket.Chat SDK) and the `rc-sdk-transport-enabled` meta tag it controlled. The web client always talks to the server through the DDP SDK now, so the setting no longer had any effect. On upgrade the setting is deleted from the database.
