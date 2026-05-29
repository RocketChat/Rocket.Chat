---
'@rocket.chat/meteor': patch
---

Migrated the `TwoFactorTOTP` account settings page from the five `2fa:*` DDP methods to the new `/v1/users.totp.*` REST endpoints. DDP methods stay registered for external SDK/mobile clients with deprecation logs pointing at the new routes until 9.0.0.
