---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Added two new REST endpoints completing the Custom OAuth admin surface:

- `POST /v1/settings.removeCustomOAuth` body `{ name }` → removes all `Accounts_OAuth_Custom-<Name>-*` setting documents (replaces the deprecated `removeOAuthService` DDP method).
- `POST /v1/settings.refreshOAuthServices` (no body) → re-reads ServiceConfiguration entries from settings (replaces the deprecated `refreshOAuthService` DDP method).

Both endpoints reuse the `add-oauth-service` permission and `twoFactorRequired` gates that the DDP methods already enforced. `addOAuthService` was already covered by the existing `POST /v1/settings.addCustomOAuth` — its DDP method now also logs a deprecation. The three legacy DDP methods remain registered until 9.0.0.
