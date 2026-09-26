---
'@rocket.chat/abac': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds a callout to rooms locked by ABAC enforcement explaining why the room cannot be used. It replaces the message composer, and in the members list it sits above the **Add** and **Invite Link** buttons, which are both disabled.

`GET /v1/abac/config` now also returns the attribute keys every ABAC room is required to carry, which the client uses to decide whether a room is locked.
