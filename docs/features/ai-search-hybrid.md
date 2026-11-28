# AI Search: hybrid retrieval and temporal reranking

## What the feature does

Workspace search traditionally matches the words you typed. That works when you remember the exact
phrase, and fails when you don't. AI Search adds the other half: finding messages by *meaning*, so
"pods dying from insufficient RAM" can surface "the cluster ran out of memory again and the scheduler
evicted half the workloads" even though the two share almost no words.

Meaning-based search has the opposite weakness. Embeddings deliberately discard surface form, so they
are weakest exactly where the surface form *is* the question: an error code, a ticket id, a CVE, a
function name. Someone pasting `E11000 duplicate key error` into search is being as specific as a person
can be, and meaning-based search is the worst-equipped mode to honor it.

**Hybrid search runs both and merges the results.** One retriever looks for meaning, the other for exact
terms, and an admin decides how much say each one gets. Optionally, newer messages can be nudged up the
list.

## What a user sees

1. **Turn it on for the search.** The workspace search box in the top bar has an AI toggle. It only
   appears when the workspace has an AI license and an admin has enabled AI Search.
2. **Type a question, not keywords.** A phrase describing what you half-remember works as well as exact
   wording.
3. **Narrow it down, optionally.** Typing `in:`, `from:`, `after:` or `before:` turns into removable
   filter chips, so you can scope to a channel, a person or a date range. These are applied by the
   search backend, not as an afterthought on the results.
4. **See the best few inline.** The dropdown shows an *Intelligent Search* section with the strongest
   matching messages alongside the usual channel and people results. Selecting one jumps to that message
   in its room.
5. **Open the full page.** *View all results* opens the Intelligent Search page, which lists sources
   with room, author and timestamp, loads more on demand, and — when an LLM provider is configured —
   generates a written answer from the messages it found, with those messages cited as sources below it.

Results never include messages from rooms the person is not in: every result is re-checked against their
own room access before it is shown.

A match percentage appears on some results and not others, depending on how the list was ranked — see
[Score conventions](#score-conventions).

## How the ranking works

End to end, a single search looks like this:

```
                         QUERY
                           │
                 Apply hard filters
          room access / channel / person / date range
                           │
               ┌───────────┴───────────┐
               ▼                       ▼
        Exact-term search       Meaning-based search
               │                       │
               └──────────┬────────────┘
                          ▼
                Merge the two rankings
                          ▼
                Optionally favor newer
                          ▼
              Re-check the reader's access
                          ▼
                      Results
```

The interesting step is the merge, because the two retrievers cannot be compared directly. They report
confidence on scales that mean opposite things — one where lower is better, one where higher is better —
so treating the numbers as interchangeable produces nonsense.

The trick is to **ignore the scores and use the positions**. If a message came 1st for meaning and 4th
for exact terms, all we use is "1st" and "4th". Each position earns points on a sliding scale — 1st is
worth more than 2nd, and so on — the two are added up according to the admin's balance, and the totals
decide the final order. This is a standard technique called Reciprocal Rank Fusion, and its useful
property is that a message both retrievers liked beats one that only a single retriever liked.

Two consequences worth knowing:

- **The balance is not a quota.** Setting it to 70 does not mean 70% of results come from meaning-based
  search. It means meaning-based positions count for more when the two retrievers disagree.
- **At the extremes only one search runs.** At 0 or 100 the other retriever is never called, so there is
  no wasted work.

After merging, the optional recency boost multiplies each result's score by a little extra for being
recent — most for something posted today, tapering off as messages age. It is a multiplier on relevance
rather than a sort by date, so at low settings it mostly breaks ties between results that were already
close. The reach grows with the setting, though: merged scores sit close together by design, so a high
recency weight can lift a recent but weaker match above an older, stronger one. The boost is off by
default for that reason.

Finally, every surviving message is looked up in the database and checked against the reader's room
subscriptions, and the requested page is taken from what is left.

---

The remainder of this document is the implementation reference: exact request shapes, formulas, settings
and bounds.

## Retrieval

Both retrievers are the *same* pipeline endpoint (`POST /pipelines/{id}/search`), distinguished only by
the request body:

| Retriever | Pipeline request | Threshold sent |
| --- | --- | --- |
| semantic | `type: "similarity"` | yes |
| keyword | `type: "search"` | no |

The top-level `type` is the only thing that selects the retriever. Both branches send the same
`classification.search_type` (`CLASSIFICATION_SEARCH_TYPE`), which controls how the requested
classifications resolve rather than which retriever runs: the strict values reject a request carrying a
classification the pipeline does not know, and Rocket.Chat sends the user's roles alongside `user`.

Which of them runs is decided by a single setting, `AI_Intelligent_Search_Semantic_Weight` (0-100):

| Balance | Behavior |
| --- | --- |
| `0` | keyword only - the semantic retriever is never called |
| `1`-`99` | both in parallel, fused with weighted RRF |
| `100` | semantic only - the keyword retriever is never called |

The balance is the only retrieval control; there is no separate search-mode setting. A caller can pin an
endpoint of the range per request with the `searchType` query parameter on `GET /api/v1/ai.search`
(`keyword` maps to 0, `semantic` to 100, `hybrid` to whatever the setting says).

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

`C` and the candidate pool size are fixed internally and are not admin settings.

## The similarity guardrail

`AI_Intelligent_Search_Min_Similarity_Percent` applies **only to semantic candidates**, through the
pipeline request's distance threshold and again after retrieval. A keyword hit is never discarded for
being semantically unremarkable (for example, exact error codes, ticket ids, and function names).

It defaults to `0` (disabled). A fixed similarity threshold behaves inconsistently across embedding
models, query length, language and corpus, so it suits filtering out obviously poor matches rather than
tuning result quality. If the pipeline omits all similarity metadata, unscored semantic candidates are
preserved for compatibility.

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
