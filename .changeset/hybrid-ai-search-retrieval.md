---
'@rocket.chat/ai-search': minor
'@rocket.chat/core-services': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds hybrid retrieval and optional temporal reranking to AI Search.

A single **Search balance** setting (0-100) now controls retrieval: 0 searches by keyword only, 100 by
meaning only, and anything in between runs both retrievers in parallel and fuses them with weighted
Reciprocal Rank Fusion. Fusion works on rank positions, so the retrievers' incompatible score scales are
never compared directly.

The minimum semantic similarity guardrail now applies only to semantic candidates, so an exact match on
an error code or ticket id is no longer discarded for being semantically unremarkable.

An optional **Recency boost** reranks results by age after relevance ranking, using an exponential decay
with a 30-day half-life. It is disabled by default and leaves ranking unchanged until an admin opts in.
