---
'@rocket.chat/abac': minor
'@rocket.chat/apps': minor
'@rocket.chat/apps-engine': minor
'@rocket.chat/core-services': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
'@rocket.chat/rest-typings': minor
---

Allows private rooms and teams to be created with ABAC attributes. **Create channel** and **Create team** get an **ABAC managed** option that walks the user through choosing attributes and previewing which members will be added, and `groups.create` and `teams.create` accept an `abacAttributes` map. This requires the new **Create ABAC-managed rooms** permission, granted to users by default, and every such room is recorded in the ABAC audit log.

Users can only assign values they hold, or, with Virtru, values Virtru entitles them to. Members who do not qualify are not added and are listed in `skippedMembers`. While enforcement is on, new private channels and teams must be ABAC-managed and carry the workspace's required attributes.

Adds `GET /v1/abac/attributes.listAssignable` and `POST /v1/abac/rooms.evaluateMembership`. Apps with room write access and the new `abac.write` permission can create attributed private rooms under the same rules, and the audit log names the app.
