---
'@rocket.chat/rest-typings': patch
---

Re-adds the `/v1/push.token` POST and DELETE route definitions, which were removed in the pushToken management modernization (RocketChat/Rocket.Chat#39011) but are still served by the server. Restores client type-safety for push token management.
