---
'@rocket.chat/meteor': major
---

**Breaking:** REST endpoints that refuse a request with the `not-authorized` error code now answer **403** instead of 400, like `error-not-authorized` already does. The 403 body carries the reason in `error` (`Not Authorized [not-authorized]`) and no longer has `errorType`. Affected endpoints, when the user lacks the permission or cannot access the room: `chat.pinMessage`, `chat.unPinMessage`, `chat.starMessage`, `chat.unStarMessage`, `chat.react`, `users.generatePersonalAccessToken`, `users.regeneratePersonalAccessToken` and `users.removePersonalAccessToken`.
