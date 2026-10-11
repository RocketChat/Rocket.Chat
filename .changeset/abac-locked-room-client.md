---
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
'@rocket.chat/rest-typings': minor
---

Adds a callout to rooms locked by ABAC enforcement explaining why the room cannot be used. It replaces the message composer, and in the members list it sits above the **Add** and **Invite link** buttons, which are both disabled.

`GET /v1/rooms.info` accepts `withAbac=true`. While ABAC enforcement is on, the response then also carries `abacRequiredAttributes`, the attribute keys every ABAC room is required to carry, which the client uses to decide whether a room is locked.
