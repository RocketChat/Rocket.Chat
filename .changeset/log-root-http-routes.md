---
'@rocket.chat/meteor': patch
'@rocket.chat/tools': patch
---

Fixes requests to the federation, Apps-Engine endpoint, UiKit interaction, OAuth login, `.well-known` metadata, health probe, `/_timesync` and `/theme.css` routes not appearing in the HTTP request log, and redacts OAuth authorization codes from logged URLs
