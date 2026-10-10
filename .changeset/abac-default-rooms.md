---
'@rocket.chat/abac': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Allows default and team default rooms to carry ABAC attributes, which was previously refused. Assigning attributes to a default room, marking an ABAC room as a default and marking an attributed team channel as a team default now succeed, so these requests no longer return `error-cannot-convert-default-room-to-abac`, `error-action-not-allowed` or `error-room-is-abac-managed`.

New members are only added to the attributed default channels they hold the attributes for. Marking a team channel as a team default adds the team members who hold its attributes and leaves out the ones who do not, instead of failing, and joining a team skips the default channels the new member does not qualify for.
