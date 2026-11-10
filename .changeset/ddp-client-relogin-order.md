---
'@rocket.chat/ddp-client': patch
---

Fixes subscriptions restored after a reconnection being refused because they went out before the new login, and the session staying "logged in" with a token the server refused during that login. A refused token now logs the account out (`onLogout` fires) instead of surfacing as an unhandled rejection.
