---
'@rocket.chat/ai-search': minor
'@rocket.chat/core-services': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds hybrid retrieval to AI Search. A single search balance setting decides how much semantic retrieval contributes relative to keyword search, so a workspace can find messages by meaning without losing exact matches on error codes, ticket ids or function names. An optional recency boost, disabled by default, promotes newer messages after relevance ranking.
