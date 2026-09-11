# AI Search: hybrid retrieval and temporal reranking

## Overview

AI Search retrieves messages from an external Intelligent Search pipeline. It supports three retrieval
modes, selected by the `AI_Intelligent_Search_Mode` setting and overridable per request via the
`searchType` query parameter on `GET /v1/ai.search`:

| Mode | Pipeline request | Notes |
| --- | --- | --- |
| `semantic` (default) | `type: "similarity"`, `search_type: 2` | Vector retrieval. The only mode before this feature. |
| `keyword` | `type: "search"`, `search_type: 1` | Full-text retrieval. |
| `hybrid` | both, in parallel | Fused client-side with weighted RRF. |

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
display and for the similarity guardrail. Fusion deliberately never compares the two raw scores — it
works on **rank positions only**, which is what makes the incompatible scales a non-problem.

## Weighted RRF

For a document `d`, with `w = AI_Intelligent_Search_Semantic_Weight / 100` and `C = 60`:

```
score(d) = (1 - w) / (C + rank_fulltext(d)) + w / (C + rank_semantic(d))
```

A branch that did not return `d` contributes nothing. `w = 0` and `w = 100` short-circuit to a single
retriever, so the other branch is never even requested.

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

- `AI_Intelligent_Search_Recency_Weight` (0-100, default **0** = disabled).
- `AI_Intelligent_Search_Recency_Half_Life_Days` (default 30).

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
