---
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds workspace-wide ABAC enforcement. **Enforce ABAC across all workspace rooms** locks every channel, group, team and pre-existing discussion that does not carry the attributes listed in **Attributes required in all ABAC rooms**: a locked room accepts no new messages and no new members, and while enforcement is on neither discussions nor public channels can be created. Direct messages, Omnichannel rooms and federated rooms are never locked.

Both settings read as off without an ABAC license, so losing the license can never leave rooms locked.
