---
'@rocket.chat/abac': minor
'@rocket.chat/core-services': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
'@rocket.chat/rest-typings': minor
---

Adds ABAC attributes to room creation. `groups.create` and `teams.create` accept an `abacAttributes` map, and the room is created with its attributes in the same call, so a creator who is not an administrator no longer needs the ABAC admin endpoints to restrict their room. Setting attributes at creation requires the new **Create ABAC-managed rooms** permission, which users hold by default.

A creator can only assign what they may hold. With the local Policy Decision Point, the new **Restrict room creators to attributes they hold** setting, on by default, limits them to their own attribute values; with Virtru, they are limited to the values Virtru entitles them to. A refusal names the attribute, and when access decisions are unavailable the room is not created. `POST /v1/abac/attribute-assignability` answers the same question before creating. Holders of **Bypass ABAC store validation** skip that check, and the audit log records when they do.

Members named at creation who do not carry the room's attributes are left out, and the response lists them in `skippedMembers`.

While enforcement is on, a private channel or team can only be created carrying every attribute the workspace requires, and federated rooms cannot be created.
