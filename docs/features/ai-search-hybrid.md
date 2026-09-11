# AI Search: hybrid retrieval and temporal reranking

## Retrieval

Both retrievers are the *same* pipeline endpoint (`POST /pipelines/{id}/search`), distinguished only by
the request body:

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

There is deliberately no separate "search mode" setting: the balance already expresses every mode, and a
second control would only let the two disagree. A caller can pin an endpoint of the range per request
with the `searchType` query parameter on `GET /v1/ai.search` (`keyword` maps to 0, `semantic` to 100,
`hybrid` to whatever the setting says).

Fusion happens here rather than in the pipeline because the pipeline's own `type: "hybrid"` placeholder
returns `501 Hybrid placeholder is not implemented yet`, and its parameter schema exposes no weight.

## Score conventions

The two retrievers report scores on incompatible scales:

- semantic `score` is a **cosine distance** - *lower* is better
- keyword `score` is a **full-text rank** - *higher* is better

`normalizeIntelligentSearchCandidates` converts distance to similarity (`1 - distance`) for display and
for the guardrail, and does so only for semantic candidates. Both retrievers report their number in the
same `score` field, so reading a keyword hit's rank as a distance would invert it and fabricate a
confident similarity. Keyword candidates therefore carry no `score`, and the results UI renders a match
percentage only where one genuinely exists.

## Weighted RRF

For a document `d`, with `w = AI_Intelligent_Search_Semantic_Weight / 100` and `C = 60`:

```
score(d) = (1 - w) / (C + rank_fulltext(d)) + w / (C + rank_semantic(d))
```

Fusion works on **rank positions only**, which is what makes the incompatible scales a non-problem. A
branch that did not return `d` contributes nothing.

The two branches are issued with `Promise.allSettled`, not `Promise.all`: if one retriever throws
(network failure, or the pipeline's 10s timeout) the search degrades to the surviving retriever rather
than returning nothing. Only a double failure propagates.

`C` and the candidate pool size are implementation parameters and are intentionally not admin settings.

## The similarity guardrail

`AI_Intelligent_Search_Min_Similarity_Percent` applies **only to semantic candidates**, and only after
retrieval. A keyword hit is never discarded for being semantically unremarkable - that is precisely the
case hybrid search exists to serve (exact error codes, ticket ids, function names).

It defaults to `0` (disabled) and should stay that way for most workspaces: a fixed embedding threshold
is brittle across embedding models, query length, language and corpus, whereas ranking is stable. Treat
it as a garbage-result guardrail, not a quality control.

## Temporal reranking

Applied after fusion, so relevance selects the candidates and freshness only reorders them. With
`w = AI_Intelligent_Search_Recency_Weight / 100`:

```
final(d) = score(d) × (1 + w × 2^(-ageInDays / 30))
```

The weight defaults to **0** (disabled). The half-life is fixed at 30 days
(`DEFAULT_INTELLIGENT_SEARCH_RECENCY_HALF_LIFE_DAYS`); offline sweeps found the 30-90 day range
essentially flat, so exposing it would add a setting without adding reachable quality.

Timestamps come from the pipeline fragment metadata, so the boost costs no extra database work.
Candidates without a usable timestamp keep their relevance score rather than being penalised.

Because the boost is multiplicative and bounded by `1 + w`, it can reorder near-ties but cannot overturn
a large relevance gap.

## Candidate pool

Each branch is asked for more candidates than the caller requested (`limit × 3`, clamped to
`[20, 100]`). Fusion needs overlap to work with, and results are filtered for visibility and room
subscription **after** retrieval, so a pool the size of the page would return short pages. The cap stays
above `MAX_INTELLIGENT_SEARCH_RESULTS` for that reason. Neither fusion nor normalization truncates
before that filtering runs.
