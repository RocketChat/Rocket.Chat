---
'@rocket.chat/ai-search': minor
'@rocket.chat/core-services': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds hybrid retrieval and optional temporal reranking to AI Search.

A new **Search method** setting selects semantic, keyword, or hybrid retrieval. In hybrid mode the
semantic and full-text retrievers run in parallel and are fused with weighted Reciprocal Rank Fusion,
balanced by a **Hybrid search balance** setting (0 is keyword only, 100 is semantic only). Fusion works
on rank positions, so the retrievers' incompatible score scales are never compared directly.

The minimum semantic similarity guardrail now applies only to semantic candidates, so an exact match on
an error code or ticket id is no longer discarded for being semantically unremarkable.

An optional **Recency boost** reranks results by age after relevance ranking, using an exponential
half-life decay. It is disabled by default and leaves ranking unchanged until an admin opts in.
