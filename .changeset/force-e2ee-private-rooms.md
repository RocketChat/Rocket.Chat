---
'@rocket.chat/meteor': minor
'@rocket.chat/i18n': minor
---

Added a workspace setting **Force end-to-end encryption on private rooms** (`E2E_Force_Encryption_For_Private_Rooms`) under **Admin → Settings → End-to-End Encryption**. When enabled, every newly created private room is encrypted by default and users can no longer opt out: the encryption toggle in the create-room modal is locked on for private rooms, and the server rejects any attempt to create a private room with `encrypted: false` (e.g. via `groups.create`) with the error `error-encrypted-private-rooms-enforced`. Public rooms are unaffected.
