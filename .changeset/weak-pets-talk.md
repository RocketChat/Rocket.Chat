---
'@rocket.chat/omnichannel-services': patch
'@rocket.chat/core-services': patch
'@rocket.chat/meteor': patch
---

Reduced time on generation of PDF transcripts. Earlier Rocket.Chat was fetching the required translations everytime a PDF transcript was requested, this process was async and was being unnecessarily being performed on every pdf transcript request. This PR improves this and now the translations are loaded at the start and kept in memory to process further pdf transcripts requests. This reduces the time of asynchronously fetching translations again and again.
