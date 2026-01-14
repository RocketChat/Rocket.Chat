---
"@rocket.chat/meteor": patch
"@rocket.chat/core-services": patch
"@rocket.chat/i18n": patch
---

Changes OEmbed URL processing. Now, the processing is done asynchronously and has a configurable timeout for each request. Additionally, the `API_EmbedIgnoredHosts` setting now accepts wildcard domains.
