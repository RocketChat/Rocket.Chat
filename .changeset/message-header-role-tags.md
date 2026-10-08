---
'@rocket.chat/meteor': minor
'@rocket.chat/i18n': minor
---

Collapses the role tags in a message header into one tag per scope, workspace and room, named after the first role with a count of the rest (`Admin +2`); hovering a tag lists them all and clicking it opens the user card. The `@username` next to the author's name is no longer shown, and bots get their tag even without any role.
