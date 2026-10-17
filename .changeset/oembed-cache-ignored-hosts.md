---
'@rocket.chat/meteor': patch
---

Fixes cached URL embeds bypassing the `API_EmbedIgnoredHosts` domain blocklist by checking ignored hosts before querying `OEmbedCache`.
