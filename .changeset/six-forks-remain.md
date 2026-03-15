---
'@rocket.chat/meteor': patch
---

Fixed Custom OAuth login flow to return a proper 401/400 error instead of a 500 Internal Server Error when the handshake fails.
