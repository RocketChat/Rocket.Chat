---
'@rocket.chat/abac': minor
'@rocket.chat/core-services': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
---

Allows default and team default rooms to carry ABAC attributes. Assigning attributes to a default room, making an ABAC room a default and making an attributed team channel a team default no longer return `error-cannot-convert-default-room-to-abac`, `error-action-not-allowed` or `error-room-is-abac-managed`. With ABAC enabled, new users, team joins and new team defaults only add members to the attributed rooms they qualify for, and skip rooms locked by enforcement.

`/invite-all-to` and `/invite-all-from` likewise add only the members an ABAC-managed room allows and name the ones they skipped, instead of failing on the first refusal. A locked target room, or one whose access cannot be decided, is refused and nobody is added.
