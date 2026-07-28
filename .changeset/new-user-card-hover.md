---
'@rocket.chat/meteor': minor
'@rocket.chat/gazzodown': minor
'@rocket.chat/i18n': minor
---

Redesigns the user card and how user roles are presented across the room UI. The card opens on hover (Enter/Space from the keyboard) instead of click and shows a workspace roles band, the presence status, custom status, room role tags, local time, username and a "See member profile" link, plus labeled action buttons (Message, Mute user) with a reorganized overflow menu ("Manage room roles" section followed by moderation actions). Message headers show the author name underlined on hover with one collapsed role tag per scope — "Admin (+ 2 roles)" for workspace roles and "Owner (+ 1 role)" for room roles, each listing the scope's roles in its tooltip — and the user info contextual bar splits "Workspace roles" and "Room roles" fields with a copy-to-clipboard button on the email. Also fixes live role updates, which never reached the UI without a reload: room role removals were dropped by an inverted guard, and the roles-change handlers mutated the react-query cache in place, defeating structural sharing.
