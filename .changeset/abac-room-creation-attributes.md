---
'@rocket.chat/abac': minor
'@rocket.chat/core-services': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
'@rocket.chat/rest-typings': minor
---

Allows private rooms and teams to be created with ABAC attributes in one step, so users no longer need an administrator to restrict a room they create. `groups.create` and `teams.create` accept an `abacAttributes` map; creating a room with attributes requires the new **Create ABAC-managed rooms** permission, granted to users by default.

Users can only assign attribute values they hold themselves, or, with Virtru, values Virtru entitles them to. Without Virtru, administrators can lift this with the new **Restrict room creators to attributes they hold** setting. Members who do not meet the room's attributes are not added, and the response lists them in `skippedMembers`. Every room created with attributes is recorded in the ABAC audit log.

While ABAC enforcement is on, new private rooms and teams must carry every attribute the workspace requires.
