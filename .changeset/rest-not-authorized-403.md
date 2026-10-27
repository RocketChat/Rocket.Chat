---
'@rocket.chat/meteor': major
---

**Breaking:** REST endpoints that refuse a request with the `not-authorized` error code now answer **403** instead of 400, like `error-not-authorized` already does. Affected endpoints, when the user lacks the permission or cannot access the room: `chat.pinMessage`, `chat.unPinMessage`, `chat.starMessage`, `chat.unStarMessage`, `chat.react`, `users.generatePersonalAccessToken`, `users.regeneratePersonalAccessToken` and `users.removePersonalAccessToken`. The 403 body keeps `errorType` but no longer carries `details` or `stack`.

403 responses produced from a thrown error now include its code in `errorType`, so `error-not-authorized`, `error-unauthorized` and `error-forbidden` refusals keep reporting it as they did when they answered 400.
