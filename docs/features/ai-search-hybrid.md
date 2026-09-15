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
with the `searchType` query parameter on `GET /api/v1/ai.search` (`keyword` maps to 0, `semantic` to 100,
`hybrid` to whatever the setting says).

## Score conventions

The two retrievers report scores on incompatible scales:

- semantic `score` is a **cosine distance** - *lower* is better
- keyword `score` is a **full-text rank** - *higher* is better

`normalizeIntelligentSearchCandidates` converts distance to similarity (`1 - distance`) for display and
for the guardrail, and does so only for semantic candidates. Both retrievers report their number in the
same `score` field, so reading a keyword hit's rank as a distance would invert it and fabricate a
confident similarity. Keyword candidates therefore carry no `score`, and the results UI renders a match
percentage only where one genuinely exists.

Cosine similarity spans `[-1, 1]` and cosine distance spans `[0, 2]`. A distance of `1.2` means
similarity `-0.2`. Scores use unit-scale values and are clamped to their mathematical ranges.
Conversion retains full floating-point precision for filtering. The UI-facing `score` is separately
clamped to `[0, 1]`.

## Weighted RRF

For a document `d`, with `w = AI_Intelligent_Search_Semantic_Weight / 100` and `C = 60`:

```
score(d) = (1 - w) / (C + rank_fulltext(d)) + w / (C + rank_semantic(d))
```

Fusion works on **rank positions only**, which is what makes the incompatible scales a non-problem. A
branch that did not return `d` contributes nothing.

Ranks start at 1 in each deduplicated list, after semantic threshold filtering. Each message contributes
at most once per branch. Equal fused scores are ordered by semantic rank, then keyword rank. This is a
deterministic tie-break, with a semantic preference on exact ties.

For nonempty results the weighted score lies in `(0, 1/61]`. At weight 50, it is half the usual
unweighted two-list RRF sum; this constant scaling leaves both ordering and multiplicative recency
reranking unchanged. For example, semantic rank 3 plus keyword rank 1 gives
`0.5/63 + 0.5/61 = 0.0161332`, ahead of a candidate found by the semantic branch alone at rank 1
(`0.5/61 = 0.0081967`). Both figures are hybrid-mode scores; single-retriever mode is covered below.

Single-retriever modes and failure fallback use `1/(60 + rank)`. Rescaling the surviving branch to
weight 1 preserves its ordering, including after the multiplicative recency boost. RRF scores are
ranking values, not match probabilities, and the balance is not a quota for result counts.

The two branches are issued with `Promise.allSettled`, not `Promise.all`: if one retriever throws
(HTTP error, network failure, or the pipeline's 10s timeout) the search degrades to the surviving retriever rather
than returning nothing. A double failure rejects the service call. The existing REST handler logs
that error and returns an empty result list.

`C` and the candidate pool size are implementation parameters and are intentionally not admin settings.

## The similarity guardrail

`AI_Intelligent_Search_Min_Similarity_Percent` applies **only to semantic candidates**, through the
pipeline request's distance threshold and again after retrieval. A keyword hit is never discarded for
being semantically unremarkable (for example, exact error codes, ticket ids, and function names).

It defaults to `0` (disabled) and should stay that way for most workspaces: a fixed embedding threshold
is brittle across embedding models, query length, language and corpus, whereas ranking is stable. Treat
it as a garbage-result guardrail, not a quality control. If the pipeline omits all similarity metadata,
unscored semantic candidates are preserved for compatibility.

For an enabled minimum `p`, eligibility is `similarity >= p/100`, equivalently `distance <= 1-p/100`.
No candidate-score rounding occurs before that comparison. A minimum of zero skips the local guardrail;
the semantic pipeline request retains its existing distance threshold of `1`.

## Temporal reranking

Applied to the complete fused pool before the final page is selected. With
`w = AI_Intelligent_Search_Recency_Weight / 100` and age measured in elapsed 24-hour days:

```
age(d) = max(0, (now - timestamp(d)) / millisecondsPerDay)
final(d) = score(d) × (1 + w × 2^(-age(d) / 30))
```

The weight defaults to **0** (disabled). The half-life is fixed at 30 days
(`DEFAULT_INTELLIGENT_SEARCH_RECENCY_HALF_LIFE_DAYS`). The decay is 1 at age zero, 0.5 at 30 days,
and 0.25 at 60 days. It is the additional boost, not the entire ranking score, that halves.

Timestamps come from the pipeline fragment metadata, so the boost costs no extra database work.
Candidates without a usable timestamp keep their relevance score. Future timestamps have age zero,
and ties preserve the incoming fused order. The adjusted score is used for ordering only; `rrfScore`
continues to represent the pre-boost fusion score.

The boost is bounded by `1 + w`, at most doubling a candidate's RRF score. RRF compresses rank
differences, so a high recency weight can move a fresh message substantially up the candidate list.
For scores `sA > sB > 0`, B cannot overtake A if `sA/sB > 1+w`. This is a ratio bound, not an
absolute score difference or rank bound. For example, at weight 100 a fresh rank-60 result has score
`2/120`, which can exceed a sufficiently old rank-1 result at approximately `1/61`.

## Candidate pool

Each branch is asked for more candidates than the caller requested (`limit × 3`, clamped to
`[20, 100]`). Fusion needs overlap to work with, and results are filtered for visibility and room
subscription **after** retrieval, so a pool the size of the page would return short pages. The cap stays
above `MAX_INTELLIGENT_SEARCH_RESULTS` for that reason. Each branch retains its highest-ranked fragment
per message. The complete fused union (at most 200 messages) reaches temporal reranking and visibility
filtering before the requested page is selected. Over-fetching reduces short pages but cannot guarantee
a full page if too few retrieved messages remain accessible.

This is fusion over truncated retrieval lists, not the entire corpus. Changing the requested page size
can change the candidate pool, overlap, and final order; it is not a stable pagination snapshot.

## References

- [Original RRF paper](https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf)
- [Cosine distance definition](https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.distance.cosine.html)
