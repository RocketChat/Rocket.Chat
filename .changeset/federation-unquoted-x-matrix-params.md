---
'@rocket.chat/meteor': patch
'@rocket.chat/federation-matrix': patch
'@rocket.chat/core-services': patch
---

Fixes federated requests being rejected when the remote server sends unquoted parameters in its `X-Matrix` authorization header
