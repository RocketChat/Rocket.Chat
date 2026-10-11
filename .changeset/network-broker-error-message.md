---
'@rocket.chat/network-broker': patch
---

Fixes the message of errors returned by a service in a microservices deployment, which repeated the error's reason and code instead of keeping the original message.
