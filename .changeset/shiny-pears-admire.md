---
'@rocket.chat/meteor': patch
---

Fix: Limit outgoing webhook response size to 10MB to prevent memory exhaustion

Added a 10MB size limit to outgoing webhook responses to prevent the server from crashing when integrations return unexpectedly large responses.
