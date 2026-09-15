# Where Mutation Testing Pays — Results

The experiment in [docs/proposals/mutation-testing-scope-experiment.md](proposals/mutation-testing-scope-experiment.md)
asked one question. Can a static predictor tell us which specs are worth the attention of a mutation run?

The answer is no. No predictor reached the pre-registered bar, and the one that came closest measures file
size, not the mechanism the intuition claimed.

## Verdict against the hypotheses

| | Claim | ρ | Verdict |
| --- | --- | --- | --- |
| **H1** | Oracle weakness (P1) correlates negatively with the score | −0.101 | Not supported |
| **H2** | Branch density (P2) correlates negatively, at least as strongly as P1 | **+0.194** | Not supported. The sign is wrong |
| **H3** | Effect surface (P3) alone is a weak predictor | −0.385 | Supported, and P3 still beat P1 and P2 |
| **H0** | No predictor explains the variance | — | **The operative outcome** |

H2 sat above H1 in the pre-registration, because a sharper mechanism losing to a cruder one would be the
finding. Both lost to the crudest of the three. That is the finding.

## The numbers

Spearman rank correlation against the mutation score over covered mutants.

| Predictor | n | ρ | p | Reading |
| --- | --- | --- | --- | --- |
| P1 oracle weakness | 75 | −0.101 | 0.39 | no signal |
| P1′ widened (secondary) | 77 | −0.051 | 0.66 | no signal |
| P2 branch density | 133 | +0.194 | 0.025 | no signal, and the sign is inverted |
| P3 effect surface | 133 | **−0.385** | 4.6e−6 | weak |
| C1 input-domain size | 133 | +0.064 | 0.47 | no signal |
| C2 mutant count | 133 | −0.351 | 3.4e−5 | weak |

The pre-registered thresholds put ≥ 0.5 at "useful predictor", 0.3 to 0.5 at "a tiebreak, not a rule", and
below 0.3 at "no signal". Nothing reached 0.5.

**The decision measure agrees.** Rank the targets by a predictor, take the top quartile, and count the weak
specs it catches. A weak spec scores below 60%; 35 of the 133 targets do.

| Predictor | Caught | Recall | Precision |
| --- | --- | --- | --- |
| P1 oracle weakness | 5 / 27 | 19% | 26% |
| P2 branch density | 6 / 35 | 17% | 18% |
| P3 effect surface | 15 / 35 | **43%** | 45% |
| C1 input-domain size | 6 / 35 | 17% | 18% |
| C2 mutant count | 16 / 35 | 46% | 48% |

The best predictor misses more than half the weak specs. The pre-registration is explicit about this case: a
predictor that misses half the weak specs is not a triage rule, whatever ρ says.

## P3 measures size, not effects

This part is post-hoc. It is not pre-registered, and it explains the one non-zero column.

| Pair | ρ |
| --- | --- |
| source lines vs score | −0.383 |
| P3 vs source lines | 0.493 |
| C2 mutant count vs source lines | 0.933 |

A plain line count predicts the score as well as P3 does, and it catches the same 15 of 35 weak specs. The
mutant count is almost a restatement of file size.

Hold size constant and the predictors collapse.

| Predictor | ρ | Partial ρ, size held constant |
| --- | --- | --- |
| P1 | −0.101 | −0.130 |
| P2 | +0.194 | +0.114 |
| P3 | −0.385 | **−0.245** |
| C1 | +0.064 | +0.043 |

P3 falls below the 0.3 floor. So the effect surface carries no signal of its own. Big files score low, and a
spec that stubs many modules is usually a spec for a big file.

## What the sample looks like

The outcome spreads widely, so the predictors had variance to explain and did not explain it.

| min | p25 | median | p75 | max |
| --- | --- | --- | --- | --- |
| 14% | 59% | 74% | 83% | 100% |

The extremes are a size ladder, not an effect ladder.

| Score | Lines | P3 | Source |
| --- | --- | --- | --- |
| 14% | 144 | 2 | `server/lib/notifications/push/apn.ts` |
| 19% | 398 | 1 | `app/apps/server/converters/codecs/rooms.ts` |
| 22% | 273 | 3 | `server/modules/streamer/streamer.module.ts` |
| … | | | |
| 96% | 19 | 0 | `server/lib/ldap/operations/replace.ts` |
| 100% | 23 | 0 | `server/lib/shared/getModifiedHttpHeaders.ts` |
| 100% | 85 | 5 | `server/lib/rooms/getRoomByNameOrIdWithOptionToJoin.ts` |

## Sample and exclusions

The frame is the `spec` list of `apps/meteor/.mocharc.js`, which resolves to 200 files.

| Step | Count |
| --- | --- |
| Specs in the frame | 200 |
| Rule 1 — no single source file under test | −24 specs |
| Pairs | 176 |
| Rule 2 — a source with several specs runs as one target | 172 targets |
| Rule 4 — fails before mutation starts | −7 targets |
| Rule 3 — fewer than 20 mutants | −32 targets |
| **Analysed** | **133 targets, 137 specs** |

The sample keeps 69% of the frame. The pre-registration calls a loss above one third a result in itself. This
loss sits just under that line, so the result stands, but it is close.

**P1 is undefined for 58 of the 133 targets.** Those specs assert on no stubbed call at all. Even a strong P1
could not rank half the sample, so oracle weakness fails as a general rule twice over.

## Deviations from the pre-registration

Record of every change, and why.

**The prior observations are not in the sample.** `addUserToCall.spec.ts` does not exist on this branch, and
`effectiveStatus.spec.ts` is not in the `.mocharc.js` spec list. The proposal allows this and asks us to say
so. Neither point of the original two-point motivation is in the frame.

**P1′, a secondary predictor.** The pre-registered regexes cannot see `.calledOnceWith(…)`, which is neither
"weak" nor "strong" to them. 30 specs in the frame use that form as their strongest assertion, so
`closeLivechatRoom.tests.ts` scored P1 = 1.00 while its oracle checks arguments on most calls. The
pre-registration asks for exactly this hand spot check. P1′ adds `\.calledOnceWith` to the strong set. It was
declared after the spot check and before any predictor met any score. P1 stays the primary column, and P1′
moved ρ toward zero, not away.

**A whole-file `mutate`.** The proposal allows this. It costs some precision: `stryker.conf.js` leaves out a
helper member that a sibling spec owns, and a whole-file run cannot.

**Two repository changes.** The proposal expected none. `apps/meteor/stryker.experiment.conf.js` takes the
pair from the environment, because `stryker.conf.js` names one target by hand. The scripts live in
`apps/meteor/tests/mutation-experiment/`.

## What went wrong on the way

Two environment faults produced wrong numbers before they were found. Both are recorded because they would
catch the next person too.

**An incomplete workspace build tripled the rule 4 exclusions.** `@rocket.chat/apps` failed its
`build:deno-cache` step, and turbo then skipped every package below it — 24 packages, `@rocket.chat/core-services`
among them. Specs that import those packages failed the Stryker dry run for an environment reason. That looked
like exclusion rule 4, "a spec that fails before mutation starts". The complete build cut those failures from
31 to 7. The whole frame was then re-run, because scores from two environments do not belong in one dataset.

Run `yarn && yarn build` from the repository root first, and check that every package has a `dist/`. The fast
pass needs the build as much as the typed pass does.

**Concurrent runs collided.** Stryker copies the project into a sandbox, and that copy walked a sibling run's
temp directory as the sibling deleted it. Eight targets died with `ENOENT` and reported nothing. Adding
`.stryker-tmp*` to `ignorePatterns` cut the rate but did not close the race. The remaining failures were
retried one at a time.

## Threats that remain

**Module-level mutants enter the score.** A whole-file `mutate` includes lines like `mime.types.wav =
'audio/wav'`, which run on import and count as covered. No unit test can assert them. A post-hoc recount over
mutants inside a block only removed 117 survivors and moved nothing: P3 goes from −0.385 to −0.353, source
lines from −0.391 to −0.346, and P3's recall from 43% to 42%.

**Equivalent mutants inflate "survived".** We do not correct for this, as pre-registered. It caps how high any
ρ can reach, and it should fall roughly evenly across targets.

**Scope.** Server specs on mocha only. Client specs run on jest, and their scores are not comparable.

## Cost, measured

The pre-registration estimated 10 seconds per pair. The measured figure is 6 seconds per target warm, and
about 40 seconds cold, when the filesystem cache is empty. The whole frame took about 30 minutes of wall clock
across two concurrent shards.

## Decision

The pre-registered rule for this outcome is H0: abandon static triage.

Nothing reaches ρ ≥ 0.5. P3 and C2 land in the weak band, and both dissolve into file size once size is held
constant. Size is a real signal — a big file scores low — but it is not the mechanism the intuition claimed,
and a rule that catches 43% of weak specs is not a triage rule.

**Scope mutation runs by risk instead — churn multiplied by blast radius.** Pick the target for what a missed
fault would cost, not for what a regex says about the spec.

The intuition that mutation testing pays more on side-effect-heavy code did not survive its first test.

## Reproduce it

```bash
cd apps/meteor
node tests/mutation-experiment/frame.js frame.json
node tests/mutation-experiment/predictors.js frame.json predictors.json
EXP_OUT=$PWD node tests/mutation-experiment/run.js frame.json results.jsonl
node tests/mutation-experiment/analyse.js predictors.json results.jsonl
EXP_OUT=$PWD node tests/mutation-experiment/sensitivity.js
```
