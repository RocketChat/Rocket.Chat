---
'@rocket.chat/meteor': major
---

**Breaking:** REST API status codes for authentication and authorization failures now follow their meaning:

- A request without a session answers **401**. Endpoints that used to report a missing session with `error-invalid-user` and HTTP 400 now answer `error-unauthenticated`; DDP methods report the same code. `error-invalid-user` keeps meaning "user not found".
- A request from a user without permission answers **403**. `error-not-authorized` moves from 400 to 403, and `error-unauthorized`, `error-forbidden` and `forbidden()` answer 403 with `error: 'forbidden'` instead of `'unauthorized'`. `rooms.membersOrderedByRole` (broadcast rooms), `rooms.hide` and `rooms.bannedUsers` move from 401 to 403 when the user cannot access the room.
- 401 bodies no longer carry the legacy `status` and `message` fields; the reason is in `error`. Refused logins (`POST /login`) keep `error`, `details` and `message` so clients can drive 2FA and explain the refusal, and only lose `status`.
- Request validation failures always report `errorType: 'error-invalid-params'` (body validation used to report `invalid-params`).
- `chat.sendMessage` rejects message fields it does not support instead of ignoring them.
