---
"@rocket.chat/meteor": patch
"@rocket.chat/model-typings": patch
---

Fixes an issue causing server to not notify users via websocket of new E2EE keys suggested by other users to them when running in development environments.
