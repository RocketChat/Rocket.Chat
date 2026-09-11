# AI Search hybrid retrieval: offline benchmark

Measurements behind the hybrid search defaults. Re-run these before changing
`INTELLIGENT_SEARCH_CANDIDATE_MULTIPLIER`, `MIN_INTELLIGENT_SEARCH_CANDIDATES`,
`INTELLIGENT_SEARCH_RRF_CONSTANT`, or the shipped setting defaults.

## Method

- **Corpus**: 547 synthetic Rocket.Chat messages ingested into a QA Intelligent Search pipeline —
  22 judged messages plus 525 topically adjacent distractors, so that top-k retrieval is actually
  selective. Messages carry `room_id`, `username` and `timestamp` metadata exactly as production does.
- **Queries**: 20 judged queries in four families:
  - `lexical` — exact identifiers (`CVE-2025-1337`, `SUP-4471`, `normalizeMessagesForUser`)
  - `conceptual` — paraphrases with minimal lexical overlap with their targets
  - `mixed` — an identifier plus a concept
  - `recency` — two near-duplicate messages where only the newer one is correct
- **Grades**: 0-3 per (query, message). Metrics are nDCG@10, MRR@10 (first hit graded ≥ 2), recall@10.
- **Harness**: replicates `packages/ai-search/src/fusion.ts` exactly, including the `w = 0` / `w = 100`
  short-circuits, and reuses one retrieval per branch across the whole sweep.

Absolute numbers are only meaningful relative to each other: the corpus is synthetic and small.

## Semantic weight sweep (candidate pool 50)

| w | nDCG@10 | MRR@10 | R@10 | conceptual | lexical | mixed | recency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 (keyword only) | 0.3455 | 0.3000 | 0.450 | 0.0000 | 0.7891 | 0.2774 | 0.0000 |
| 10-40 | 0.6814 | 0.5892 | 0.933 | 0.6303 | 0.7891 | 0.6412 | 0.5582 |
| 50 | 0.7112 | 0.6392 | 0.933 | 0.6303 | 0.8418 | 0.6865 | 0.5582 |
| **60** | **0.7152** | 0.6392 | 0.933 | 0.6303 | 0.8418 | 0.7026 | 0.5582 |
| 70-90 | 0.7091 | 0.6392 | 0.933 | 0.6303 | 0.8418 | 0.6780 | 0.5582 |
| 100 (semantic only) | 0.7091 | 0.6392 | 0.933 | 0.6303 | 0.8418 | 0.6780 | 0.5582 |

- Keyword-only is not a viable default: it scores **0.0** on conceptual and recency queries.
- Hybrid beats semantic-only, and the entire gain sits in `mixed` queries (0.7026 vs 0.6780, +3.6%
  relative) — exactly the family hybrid exists for. Other families are unchanged.
- The curve is a step function rather than a smooth slope, because the keyword branch returns very few
  rows (see the limitation below). The plateau from 50-90 means the setting is forgiving.

**Shipped default: 50.** 60 measured marginally higher (+0.6% relative), which is well inside the noise
of a 20-query synthetic set. 50 is the neutral, defensible midpoint; revisit with judged production
queries rather than promoting 60 on this evidence.

## Candidate pool sweep (w = 60)

| candidate pool | best nDCG@10 | conceptual |
| --- | --- | --- |
| 20 | 0.6881 | 0.6014 |
| **50** | **0.7152** | 0.6303 |
| 100 | 0.6987 | 0.5677 |

50 per branch is the peak. 20 starves fusion; 100 dilutes conceptual queries with weak neighbours.
Hence `MIN_INTELLIGENT_SEARCH_CANDIDATES = 50` — the default page size of 5 lands exactly on the
optimum, and larger pages scale by ×3 up to the cap of 100.

## Temporal boost sweep (w = 60, candidate pool 50)

nDCG@10, by recency weight and half-life:

| recency weight | half-life 7d | half-life 30d | half-life 90d |
| --- | --- | --- | --- |
| 0 (off) | 0.7152 | 0.7152 | 0.7152 |
| 10 | 0.7422 | 0.7471 | 0.7296 |
| 25 | 0.7272 | **0.7507** | 0.7510 |
| 50 | 0.7012 | 0.7398 | 0.7495 |
| 75 | 0.6677 | 0.7339 | **0.7524** |
| 100 | 0.6581 | 0.7215 | 0.7505 |

At weight 25 / half-life 30: overall nDCG@10 **0.7152 → 0.7507 (+5.0%)**, recency queries
**0.5582 → 0.7685 (+37.7%)**, and lexical queries are **completely unaffected** (0.8418 throughout) —
the boost never displaces an exact-identifier match.

Aggressive settings are actively harmful: weight 100 with a 7-day half-life drops conceptual queries
from 0.6303 to 0.4695. Short half-lives are sharp and unforgiving; 30-90 days are stable.

**Shipped default: weight 0 (disabled), half-life 30.** Hybrid relevance ships first and ranking stays
unchanged unless an admin opts in. Recommended starting point when enabling: **weight 25, half-life 30**.

## Backend limitations found while benchmarking

Both are pipeline-side and worth raising with the Intelligent Search team; neither is fixable in
Rocket.Chat.

1. **Full-text search is strict AND.** `kubectl ramen` and `kubectl zzzznotaword` both return zero rows.
   Any conversational multi-word query therefore returns nothing from the keyword branch, which is why
   the keyword branch contributes to so few queries above. Keyword retrieval is a precision aid for
   identifier-style queries, not a recall workhorse.
2. **Full-text recall is incomplete.** Probing every content token of every document against the index,
   only **83%** (191/230) retrieved their own document. Misses include ordinary content words —
   `webhook`, `stale`, `rate`, `connection`, `cluster`, `nodes`, `login`, `mobile`, `Safari` — and are
   reproducible across re-ingestion of the same text, so they are not a one-off indexing glitch.

If full-text recall improves, re-run the weight sweep: the keyword branch would carry far more weight
and the optimum would likely move.

## Reproducing

The harness is not checked in — it depends on live pipeline credentials. It ingests a generated corpus
via `POST /pipelines/{id}/documents`, queries `POST /pipelines/{id}/search` once per branch per query,
then replays `fusion.ts` locally across the parameter grid. Point it at a disposable pipeline; it writes
several hundred documents.
