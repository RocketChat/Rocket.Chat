---
'@rocket.chat/abac': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/meteor': minor
'@rocket.chat/i18n': minor
---

Adds the ABAC enforcement foundation. A new workspace setting locks every room that does not carry the required attributes; a companion setting defines the attribute set every ABAC room must have; a third restricts users to assigning only attributes they possess.

A locked room accepts no new messages and no new members, enforced server-side at the single message-send and member-addition funnels — so the REST API, the Apps-Engine, invite links and the bulk-invite slash commands are all covered. In the room, the composer is replaced by a callout offering an entitled member the way out via a new `edit-room-abac-attributes` permission, and the members list disables Add and Invite Link. Public channel and discussion creation are blocked while enforcement is on.

Discussions are disabled workspace-wide while enforcement is on: `Discussion_enabled` is held at `false`, its previous value is captured, and it is restored automatically when enforcement is switched off or the ABAC license module is removed. Attempts to re-enable it while enforcement is active are refused rather than silently reverted.

1-on-1 DMs, Group DMs, federated rooms and Omnichannel/Livechat rooms are unaffected.

Also adds a `multiLookup` setting type, the multi-value counterpart of `lookup`, for settings whose options come from workspace data rather than a fixed list.
