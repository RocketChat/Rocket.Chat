---
'@rocket.chat/meteor': patch
---

Fixed the room header asking for encryption setup in workspaces where E2E encryption is turned off. An encrypted room whose workspace had `E2E_Enable` off rendered its messages normally while the header still showed the encryption setup screen, because the two applied different rules.
