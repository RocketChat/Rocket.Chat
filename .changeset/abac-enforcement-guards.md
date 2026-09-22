---
'@rocket.chat/abac': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds workspace-wide ABAC enforcement. Turning on **Enforce ABAC across all workspace rooms** locks every private channel, team and existing discussion that does not carry the attributes listed in **Attributes required in all ABAC rooms**, and locks every public channel whatever attributes it carries. Nobody can post in a locked room or be added to one, and while enforcement is on new public channels and discussions cannot be created. Direct messages, Omnichannel conversations and federated rooms are never locked.

New members are only added to the default channels they are cleared for. A default channel that requires attributes is joined only by people who hold them, and a locked one is skipped, so if the only default channel is public then new members land in no channel at all.

Default channels can now require attributes, which was not previously allowed.

Removing the ABAC license turns both settings off, so a workspace is never left with rooms nobody can unlock.
