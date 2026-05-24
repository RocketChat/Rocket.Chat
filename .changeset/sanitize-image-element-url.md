---
'@rocket.chat/gazzodown': patch
'@rocket.chat/meteor': patch
---

Sanitizes image URLs in rendered messages to block `javascript:`, `data:`, and `vbscript:` schemes — matching the protection already applied to markdown links. Defense-in-depth against XSS via crafted markdown like `![label](javascript:...)`.
