---
'@rocket.chat/meteor': minor
'@rocket.chat/ui-client': minor
'@rocket.chat/i18n': minor
---

Shows a user's roles by scope, workspace and room. In a message header, each scope collapses into one tag named after the first role with a count of the rest (`Admin +2`); hovering a tag lists them all and clicking it opens the user card. The `@username` next to the author's name is no longer shown, bots get their tag even without any role, and users created for apps are tagged `App`. The user card shows the workspace roles in a band at the top and the room roles in its list, and the full profile lists them as separate fields.
