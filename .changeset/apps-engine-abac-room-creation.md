---
'@rocket.chat/meteor': minor
'@rocket.chat/apps-engine': minor
'@rocket.chat/apps': minor
'@rocket.chat/i18n': minor
---

Allows apps with the new `abac.write` permission to create a private room carrying ABAC attributes. The attributes are checked against the room's creator, the same way as for `groups.create`, so the creator needs the **Create ABAC-managed rooms** permission and may only assign attributes they are allowed to. An app that supplies attributes without `abac.write`, or while ABAC is disabled, is refused, and attributes on a public channel or a direct message are refused with `error-abac-attributes-private-rooms-only`.
