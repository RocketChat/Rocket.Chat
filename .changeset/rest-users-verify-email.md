---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Added `POST /v1/users.verifyEmail` (replaces the two-call DDP flow of `verifyEmail` + `afterVerifyEmail`). Body is `{ token }`; the server resolves the user, marks the email verified, and runs the anonymous→user role swap in a single request. The deprecated `afterVerifyEmail` DDP method keeps its registration with a deprecation log pointing at the new route.
