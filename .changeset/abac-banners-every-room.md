---
'@rocket.chat/abac': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds an optional `nonAbacBanner` to the ABAC classification banners configuration, shown in rooms that are not ABAC managed, such as DMs, group DMs, discussions, federated and Omnichannel rooms. It takes one banner or a list, and each banner can be limited to some rooms by room type and by whether the room is federated, a discussion or part of a team; the first enabled banner that matches is shown. Without it those rooms show no banner, as before, and existing configurations keep working unchanged
