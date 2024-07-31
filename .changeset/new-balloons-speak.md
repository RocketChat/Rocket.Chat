---
'@rocket.chat/meteor': patch
---

Fixed a crash on web client due to service works not being available, this can happen in multiple scenarios like on Firefox's private window or if the connection is not secure (non-HTTPS), [see more details](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts).

Rocket.Chat needs service workers to process E2EE encrypted files on rooms. These types of files won't be available inside private windows, but the rest of E2EE encrypted features should work normally
