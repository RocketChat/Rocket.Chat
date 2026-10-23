---
'@rocket.chat/meteor': major
'@rocket.chat/i18n': patch
---

Renames the `Outlook_Calendar` settings group to `Microsoft_Exchange`. A migration moves every setting of the group to the new one, so their values are kept. The admin page of the group moves from `/admin/settings/Outlook_Calendar` to `/admin/settings/Microsoft_Exchange`.
