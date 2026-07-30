---
'@rocket.chat/meteor': minor
'@rocket.chat/gazzodown': minor
'@rocket.chat/i18n': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/rest-typings': minor
---

Redesigns the user card and how user information is presented across the room UI. The card opens on hover (Enter/Space from the keyboard) instead of click and shows a workspace roles band with a "Workspace roles" tooltip, the presence status, an inline lightweight nickname, custom status, username, job title, room role tags (outline shield icon), local time with the UTC offset and a "See member profile" link — with tooltips on the info icons and labeled action buttons (Message, Mute) plus a reorganized overflow menu ("Manage room roles" section, moderation actions and an admin section with the moderation console shortcut). Message headers show the author name underlined on hover without the appended @username and with one collapsed role tag per scope ("admin +2" pattern) listing that scope's roles in its tooltip. The user info contextual bar leads with the username, splits "Workspace roles" and "Room roles" fields, and reveals a copy-to-clipboard button on hover over every text info. Adds three optional profile fields — title, nationality and languages — editable in Account > Profile, exposed through users.info and displayed in the contextual bar (title also in the card). Also fixes live role updates, which never reached the UI without a reload: room role removals were dropped by an inverted guard, and the roles-change handlers mutated the react-query cache in place, defeating structural sharing.
