---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
'@rocket.chat/web-ui-registration': patch
---

Migrates the `web-ui-registration` DDP callers to REST:

- `checkRegistrationSecretURL` → new `GET /v1/misc.registrationSecretCheck` query `{ hash }` → `{ valid }`. The DDP method stays registered with a deprecation log pointing at the new route until 9.0.0.
- `resetPassword` → new `POST /v1/users.resetPassword` body `{ token, newPassword }` → `{ token }` (a resume login token). Reimplemented server-side against `Accounts` (the core method issues its login token through the DDP connection, which a REST handler doesn't have). `resetPassword` is a Meteor core method and keeps its registration.
