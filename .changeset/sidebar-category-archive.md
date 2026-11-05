---
'@rocket.chat/meteor': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/i18n': minor
'@rocket.chat/mock-providers': patch
'@rocket.chat/core-services': patch
'@rocket.chat/ddp-client': patch
---

Renames the room "Hide" action to "Archive" and adds "Archive rooms…" to the sidebar group menus on licensed workspaces: it opens a modal that archives the group's quiet rooms at once, inactive for a preset spell or since a date typed in, keeping the open room and, unless asked, the unread ones. An "Archived" group listed last, collapsed and quiet, holds the archived rooms: one stays there, with no badge, whatever arrives in it, until "Unarchive" puts it back in its own group. The group's own menu turns notifications off for every archived room at once, and on again. The new `subscriptions.setUserArchived` endpoint takes up to two hundred rooms per call, and `rooms.saveNotification` allows 120 calls a minute.
