---
'@rocket.chat/meteor': patch
'@rocket.chat/server-fetch': patch
---

Fixes cached URL embeds bypassing the `API_EmbedIgnoredHosts` domain blocklist by checking ignored hosts before querying `OEmbedCache` and validating redirect targets.
