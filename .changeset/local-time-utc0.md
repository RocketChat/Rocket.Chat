---
'@rocket.chat/meteor': patch
'@rocket.chat/ui-client': patch
---

Fixes the local time missing for users in UTC+0 or in time zones with a fractional offset (e.g. UTC+5:30) on the user card, the user info panel and the OAuth authorization card, where the user info panel also showed a stray "0" for UTC+0
