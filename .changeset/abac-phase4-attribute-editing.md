---
'@rocket.chat/abac': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/core-services': minor
'@rocket.chat/message-types': minor
'@rocket.chat/apps-engine': minor
'@rocket.chat/meteor': minor
'@rocket.chat/i18n': minor
---

Changing a room's ABAC attributes now shows who it would remove before anything is committed. An entitled room member can edit attributes from the room's own Edit channel panel, and an administrator from Admin > ABAC > Rooms; in both places the primary action is Next rather than Save, leading to a preview of who loses and who retains access with counts and role tags, then a confirmation.

The confirmation has three forms: a plain one when nobody is removed, "Update ABAC room" stating the exact impact when some are, and a destructive "Empty ABAC room" when the change would remove everyone — that last one warns that re-populating an empty ABAC room may require technical expertise. An editor whose own access would be removed is told so in both the preview and the confirmation, and is not blocked.

A mass eviction now writes one summarised system message rather than one per member, so a single attribute change on a large room no longer buries its history under hundreds of identical lines. Below a small threshold, and on the LDAP- and cron-driven paths where there is no acting user to attribute a summary to, the per-member messages are unchanged.
