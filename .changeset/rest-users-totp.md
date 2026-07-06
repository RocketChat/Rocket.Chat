---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Adds five new REST endpoints covering the TOTP 2FA flows that previously only existed as DDP methods:

- `POST /v1/users.enableTotp` → `{ secret, url }` (replaces `2fa:enable`)
- `POST /v1/users.disableTotp` body `{ code }` → `{ disabled }` (replaces `2fa:disable`)
- `POST /v1/users.validateTotp` body `{ code }` → `{ codes }` (replaces `2fa:validateTempToken`; also rotates non-PAT login tokens server-side)
- `POST /v1/users.regenerateTotpCodes` body `{ code }` → `{ codes }` (replaces `2fa:regenerateCodes`)
- `GET /v1/users.totpCodesRemaining` → `{ remaining }` (replaces `2fa:checkCodesRemaining`)

The legacy DDP methods stay registered with deprecation logs pointing at the new routes until 9.0.0 removes them.
