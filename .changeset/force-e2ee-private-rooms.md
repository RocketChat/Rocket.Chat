---
'@rocket.chat/meteor': minor
'@rocket.chat/i18n': minor
---

Adds a workspace setting **Force end-to-end encryption on private rooms** (`E2E_Force_Encryption_For_Private_Rooms`) under **Admin → Settings → End-to-End Encryption**. When enabled, every newly created private room is encrypted by default and users can no longer opt out: the encryption toggle in the create-room modal is locked on for private rooms, and the server rejects any attempt to create a private room with `encrypted: false` (e.g. via `groups.create`) with the error `error-encrypted-private-rooms-enforced`. Public rooms are unaffected. Federated rooms are exempt since federation does not support E2EE. Creating a discussion under an unencrypted private parent room is rejected with a dedicated error instructing the user to make the parent public or enable encryption on it, and the create-discussion dialog now surfaces creation errors as toasts.
