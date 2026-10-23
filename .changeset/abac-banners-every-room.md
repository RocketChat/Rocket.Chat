---
'@rocket.chat/abac': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds an optional `nonAbacBanner` list to the ABAC classification banners configuration, so rooms that are not ABAC managed, such as DMs, discussions and federated rooms, can show a configured banner. The list must include an enabled default entry that applies to any room. Omnichannel rooms never show a banner.
