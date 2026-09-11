# AI Search: hybrid retrieval and temporal reranking

## Overview

AI Search retrieves messages from an external Intelligent Search pipeline. Both retrievers are the *same*
pipeline endpoint (`POST /pipelines/{id}/search`), distinguished only by the request body:

| Retriever | Pipeline request | Threshold sent |
| --- | --- | --- |
| semantic | `type: "similarity"`, `classification.search_type: 2` | yes |
| keyword | `type: "search"`, `classification.search_type: 1` | no |

Which of them runs is decided by a single setting, `AI_Intelligent_Search_Semantic_Weight` (0-100):

| Balance | Behaviour |
| --- | --- |
| `0` | keyword only - the semantic retriever is never called |
| `1`-`99` | both in parallel, fused with weighted RRF |
| `100` | semantic only - the keyword retriever is never called |

There is deliberately **no separate "search mode" setting**: the balance already expresses every mode,
and a second control would only let the two disagree.

A caller can pin an endpoint of that range per request with the `searchType` query parameter on
`GET /v1/ai.search` (`keyword` maps to 0, `semantic` to 100, `hybrid` to whatever the setting says),
which is useful for evaluation without changing workspace configuration.

## Pipeline retrieval

```
                         QUERY
                           │
                 Apply hard filters
          room scope / username / date range
                           │
               ┌───────────┴───────────┐
               ▼                       ▼
          Full-text search        Semantic search
          k = candidate pool      k = candidate pool
               │                       │
               │                 similarity guardrail
               │                       │
               └──────────┬────────────┘
                          ▼
                    Weighted RRF
                          │
                     relevance
                          ▼
                    Temporal boost
                          ▼
                 visibility filtering
                          ▼
                       Top N
```

Room scoping, username and date filters are applied by the pipeline itself
(`buildIntelligentSearchPipelineFilters`), so they constrain both branches identically.

## Why fusion happens in Rocket.Chat, not in the pipeline

The pipeline advertises a native `type: "hybrid"` placeholder, but it returns
`501 Hybrid placeholder is not implemented yet`, and its parameter schema exposes only `k` — there is no
weight. Client-side fusion is therefore both necessary today and the only way to offer an admin-tunable
balance.

## Score conventions

The two retrievers report scores on incompatible scales, verified empirically against a live pipeline:

- Semantic `score` is a **cosine distance**: *lower is better*. The best hit for a well-matched query
  scored `0.44`, an unrelated message `0.81`.
- Full-text `score` is a **rank**: *higher is better*.

`normalizeIntelligentSearchCandidates` converts distance to similarity (`similarity = 1 - distance`) for
display and for the similarity guardrail, and does so **only for semantic candidates**. Both retrievers
report their number in the same `score` field, so reading a keyword hit's rank as a distance would invert
it and fabricate a confident similarity — the best lexical hit would display the lowest score. Keyword
candidates therefore carry no `score` at all, and the results UI renders a match percentage only where one
genuinely exists. In a fused list that means the badge appears on semantically-found hits and is absent on
keyword-only hits — an honest gap rather than a fabricated number.

Fusion deliberately never compares the two raw scores — it works on **rank positions only**, which is
what makes the incompatible scales a non-problem.

## Weighted RRF

For a document `d`, with `w = AI_Intelligent_Search_Semantic_Weight / 100` and `C = 60`:

```
score(d) = (1 - w) / (C + rank_fulltext(d)) + w / (C + rank_semantic(d))
```

A branch that did not return `d` contributes nothing. `w = 0` and `w = 100` short-circuit to a single
retriever, so the other branch is never even requested.

The two branches are issued with `Promise.allSettled`, not `Promise.all`: if one retriever throws
(network failure, or the pipeline's 10s timeout) the search degrades to the surviving retriever rather
than returning nothing. Only a double failure propagates.

`C` and the candidate pool size are implementation parameters and are intentionally **not** admin
settings.

## The similarity guardrail

`AI_Intelligent_Search_Min_Similarity_Percent` applies **only to semantic candidates**, and only after
retrieval. A keyword hit is never discarded for being semantically unremarkable — that is precisely the
case hybrid search exists to serve (exact error codes, ticket ids, function names).

It defaults to `0` (disabled) and should stay that way for most workspaces: a fixed embedding threshold
is brittle across embedding models, query length, language and corpus, whereas ranking is stable. Treat
it as a garbage-result guardrail, not a quality control.

## Temporal reranking

Applied after fusion, so relevance selects the candidates and freshness only reorders them:

```
final(d) = score(d) × (1 + recencyWeight × 2^(-ageInDays / halfLifeDays))
```

`AI_Intelligent_Search_Recency_Weight` (0-100, default **0** = disabled) is the only control. The
half-life is fixed at 30 days (`DEFAULT_INTELLIGENT_SEARCH_RECENCY_HALF_LIFE_DAYS`): offline sweeps found
the 30-90 day range essentially flat, so exposing it would add a setting without adding reachable
quality.

Timestamps come from the pipeline fragment metadata, so the boost costs no extra database work.
Candidates without a usable timestamp keep their relevance score rather than being penalised.

Because the boost is multiplicative and bounded by `1 + recencyWeight`, it can reorder near-ties but
cannot overturn a large relevance gap.

## Candidate pool

Each branch is asked for more candidates than the caller requested
(`limit × 3`, floored at 50, capped at 100). This exists for two reasons:

1. fusion needs overlap to work with;
2. results are filtered for visibility and room subscription **after** retrieval, so a pool the size of
   the page would return short pages.

Neither the fusion nor the normalization step truncates before that filtering runs.

## Benchmark

See [ai-search-hybrid-benchmark.md](./ai-search-hybrid-benchmark.md) for the offline relevance
measurements behind the defaults.
