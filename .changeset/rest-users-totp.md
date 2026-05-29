---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Added five new REST endpoints under `/v1/users.totp.*` covering the TOTP 2FA flows that previously only existed as DDP methods:

- `POST /v1/users.totp.enable` → `{ secret, url }` (replaces `2fa:enable`)
- `POST /v1/users.totp.disable` body `{ code }` → `{ disabled }` (replaces `2fa:disable`)
- `POST /v1/users.totp.validate` body `{ code }` → `{ codes }` (replaces `2fa:validateTempToken`; also rotates non-PAT login tokens server-side)
- `POST /v1/users.totp.regenerateCodes` body `{ code }` → `{ codes }` (replaces `2fa:regenerateCodes`)
- `GET /v1/users.totp.codesRemaining` → `{ remaining }` (replaces `2fa:checkCodesRemaining`)

The legacy DDP methods stay registered with deprecation logs pointing at the new routes until 9.0.0 removes them.
