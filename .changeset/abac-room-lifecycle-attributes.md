---
'@rocket.chat/abac': minor
'@rocket.chat/core-services': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Removes a room's ABAC attributes when it is converted to a team, when a team is converted to a channel (the team's own room only), and when it is moved into a team; moving a room out of a team keeps them. The removal applies whether ABAC is enabled or not, is recorded in the audit log, and leaves the room locked while ABAC enforcement is on. The UI warns before each of these actions, and before making an ABAC-managed room or team public while ABAC is disabled.

While ABAC is enabled, `POST /v1/teams.update` now refuses to make an ABAC-managed team public with `error-action-not-allowed`, as **Edit team** does, and the **Private** toggle is disabled for ABAC-managed rooms.
