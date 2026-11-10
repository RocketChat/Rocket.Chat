---
'@rocket.chat/abac': minor
'@rocket.chat/core-services': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/rest-typings': minor
---

Adds workspace-wide ABAC enforcement. Turning on **Enforce ABAC across all workspace rooms** locks every public channel and discussion, and every private channel and team that has no ABAC attributes or is missing one listed in **Attributes required in all ABAC rooms**. Nobody can post in a locked room or be added to one, and a callout in place of the composer explains why. Direct messages, Omnichannel conversations and federated rooms are never locked.

While enforcement is on, new non-federated public channels, discussions, and private rooms without the required attributes cannot be created, and **Discussion > Enable** is switched off, then restored to its earlier value when enforcement ends. Removing the ABAC license turns enforcement off, and switching the attribute store clears the required attributes. `GET /v1/abac/attributes.listKeys` lists the keys available for the required attributes, and `GET /v1/rooms.info` returns `abacRequiredAttributes` while enforcement is on.
