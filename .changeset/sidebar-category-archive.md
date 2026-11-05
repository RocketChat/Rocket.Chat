---
'@rocket.chat/meteor': minor
'@rocket.chat/i18n': minor
---

Renames the room "Hide" action to "Archive" and adds an Archive submenu to the sidebar group menus on licensed workspaces: "Inactive since…" and "Older than…" each open a modal that archives the group's quiet rooms at once, by a date or by an age chosen from presets or typed in, keeping the open room and, unless asked, the unread ones. An "Archived" group listed last, collapsed and quiet, holds the archived rooms: one stays there, with no badge, whatever arrives in it, until "Unarchive" puts it back in its own group. The archived state is kept per user in the browser's local storage for now.
