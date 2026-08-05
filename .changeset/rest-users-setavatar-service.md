---
'@rocket.chat/meteor': minor
---

Extended `POST /v1/users.setAvatar` to accept an optional `service` multipart field. When provided, the value is stored as the user's `avatarOrigin`, matching what the deprecated `setAvatarFromService` DDP method did. The legacy DDP method remains registered with a deprecation log pointing at the new route.
