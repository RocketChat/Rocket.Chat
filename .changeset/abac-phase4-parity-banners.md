---
'@rocket.chat/abac': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/core-services': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
'@rocket.chat/i18n': minor
---

Room-creation endpoints now accept ABAC attributes directly, so a room is created with its attributes rather than being briefly locked while they are assigned afterwards. While enforcement is on, a room that would be created without attributes is refused, and the acting user's authority to instantiate the attributes they chose is validated before anything is created — on every path, including the REST API, the Apps-Engine, team creation and the bulk-invite slash commands.

Converting a channel to a team, or moving a channel into one, now warns that the room's ABAC attributes will be lost and the room will be locked until someone reassigns them.

Classification banners are shown in every room rather than only in ABAC-managed ones. A room with attributes keeps its attribute-derived marking; rooms without any — direct messages, group messages, discussions and federated rooms — show a separately configured banner. That option requires classification banner configuration version 2, and an existing version 1 configuration is migrated automatically and keeps rendering exactly as before.

The bulk-invite slash commands now report why they refused, instead of showing an empty message.
