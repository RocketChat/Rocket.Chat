---
'@rocket.chat/meteor': patch
'@rocket.chat/core-typings': patch
---

Fixes chat message REST endpoints returning fields not declared by their response types (type drift). `editedAt`/`editedBy` are now part of the `IMessage` type; `chat.search` results are typed as `IMessageSearchResult` (`IMessage` plus the full-text relevance `score`); and the transient `parseUrls` directive is no longer persisted onto messages or echoed back in responses.
