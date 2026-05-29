---
'@rocket.chat/meteor': patch
---

Migrated the Admin → OAuth services group page from `useMethod` (DDP) to `useEndpoint` (REST):

- `addOAuthService` → existing `POST /v1/settings.addCustomOAuth`
- `removeOAuthService` → new `POST /v1/settings.removeCustomOAuth`
- `refreshOAuthService` → new `POST /v1/settings.refreshOAuthServices`

DDP methods stay registered with deprecation logs pointing at the new routes until 9.0.0.
