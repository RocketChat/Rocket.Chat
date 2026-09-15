# Proposal: Where Mutation Testing Pays — A Scoping Experiment

## Status

Run. The result is in [docs/mutation-testing-scope-results.md](../mutation-testing-scope-results.md).

No predictor reached the bar. H0 carried: static triage is abandoned, and we scope by risk instead. The text
below is the pre-registration, and it stays as it was written before the first measurement.

## Problem

We can run mutation testing — see [docs/mutation-testing.md](../mutation-testing.md). We cannot run it
everywhere. The fast pass costs about 10 seconds per spec, but a person still has to read every survivor and
judge it. The typed pass costs about 11 minutes per target. Both budgets are attention, not CPU.

So we need a rule for choosing targets. The rule in use today is an intuition: mutation testing pays more on
side-effect-heavy code than on pure code. The intuition is plausible and it is untested. An untested intuition
becomes policy by repetition. This experiment tests it before that happens.

## What the intuition actually claims

"Side-effect heavy" is a proxy. The mechanism underneath is the gap between what the code does and what the
test checks.

A test on a pure function asserts its only observable, the return value. What the test executes and what it
checks are nearly the same set, so mutation testing has little left to report.

A test on effectful code stubs its collaborators and asserts something like this:

```ts
expect(VideoConferenceModel.addMemberById.calledWith('call1')).to.be.true;
```

That call carries a room id, a user id, a username, a name, an avatar tag and a timestamp. The assertion checks
one of them. The oracle is narrower than the behaviour, and a mutant can live in the difference.

State the claim as **oracle bandwidth below behaviour bandwidth**. Side effects are the usual cause of that gap,
not the definition of it. The experiment measures the mechanism, not the proxy.

## Prior observations

Two measurements exist. They motivate the question and they do not answer it.

| Spec | Style | Mutants | Survived | Score (covered) |
| --- | --- | --- | --- | --- |
| `server/lib/statusVisibility/effectiveStatus.spec.ts` | pure, small input domain | 44 | 0 | 100% |
| `server/services/video-conference/addUserToCall.spec.ts` | effectful, stubbed collaborators | 97 | 32 | 46% |

Two points, and the two differ in more than one way. Purity and input-domain size are confounded here.

## Hypotheses

Ranked before the run. H2 is placed above H1 on purpose: if the sharper mechanism loses to a cruder one, that
is the finding.

- **H1.** Oracle weakness (P1) correlates negatively with mutation score.
- **H2.** Branch density (P2) correlates negatively with mutation score, at least as strongly as P1.
- **H3.** Effect surface alone (P3) is a weak predictor. A spec can stub twenty modules and still assert hard on
  the two that matter.
- **H0.** No predictor explains the variance. Static triage does not work, and we scope by risk instead.

## Variables

### Outcome

**Mutation score over covered mutants**, read from `mutation.json` as `killed / (killed + survived)`.

Not the total score. The total mixes in `NoCoverage`, which measures whether the spec reaches the code at all.
That is a different question — reach, not oracle strength — and including it would let a spec with narrow reach
look like a spec with a weak oracle.

### Predictors

**P1 — oracle weakness.** Computed from the spec file:

```
weak   = count of /\.(called|calledOnce|notCalled)\b/
strong = count of /\.calledWith|\.calledWithExactly|\.args|\.getCall/
P1     = weak / (weak + strong)        # undefined when weak + strong == 0
```

A spec that mostly asserts *that* a collaborator was called scores high on P1.

**P2 — branch density.** Branch points per mutated line in the source file, counted from the mutated ranges:
`if`, `? :`, `&&`, `||`, `??`, `case`.

**P3 — effect surface.** Distinct imported collaborators the mutated code calls. Approximated by the count of
entries in the spec's `proxyquire` stub map, plus `sinon.stub` declarations.

**C1 — control, input-domain size.** Distinct literal argument values the spec passes to the unit under test.
This separates "pure but under-sampled" from "pure and exhaustively tested", which the two prior observations
confound.

**C2 — control, mutant count.** A score over 12 mutants is noise. Used for exclusion, see below.

## Population and sample

The frame is every spec in the `spec` list of `apps/meteor/.mocharc.js`. That is 27 glob patterns, which
resolve to 200 files at the time of writing:

```bash
cd apps/meteor && node -e "
const cfg = require('./.mocharc.js');
const { globSync } = require('glob');
const files = new Set();
for (const p of cfg.spec) for (const f of globSync(p, { ignore: cfg.ignore || [] })) files.add(f);
console.log(files.size);
"
```

Re-run that to get the current number. Do not trust the 200 after the tree moves.

Exclusions, fixed in advance:

1. A spec with no single source file under test. The unit of analysis is a (spec, source) pair.
2. A source file covered by more than one spec, unless all its specs run together as one target.
3. A pair with fewer than 20 mutants. The score is too unstable to rank.
4. A spec that fails before mutation starts.

Record the count dropped by each rule. A sample that loses more than a third of the frame is a result in itself,
and it weakens everything below.

**Branch.** The video-conference specs live on the persistent-chat branch, not on `develop`. Run the study on a
branch that carries them, or exclude them and say so. Do not mix results from two trees.

## Procedure

1. Build the frame. For each spec, resolve its source file. Record the pairs and the exclusions.
2. Compute P1, P2, P3, C1 statically. Seconds for the whole repo.
3. For each pair, run the fast pass with `SPEC` and `MEMBERS` (or a whole-file `mutate`) pointed at that pair.
   Pilot on 10 pairs first, and measure the real per-pair time before committing to the whole frame.
4. Collect `mutation.json` per pair. Record killed, survived, no-coverage, and the mutant total.
5. Join predictors to outcomes. Analyse as below.

Use the fast pass only. The typed pass costs 11 minutes per target, and its `CompileError` status would remove
mutants unevenly across pairs — a distortion of the outcome variable, not a refinement of it.

## Analysis plan

**Spearman rank correlation** between each predictor and the outcome. The score is bounded at both ends and the
relationship may be monotone without being linear. Report ρ and n for each predictor.

Thresholds, fixed now:

| \|ρ\| | Reading |
| --- | --- |
| ≥ 0.5 | useful predictor |
| 0.3 – 0.5 | weak; a tiebreak, not a rule |
| < 0.3 | no signal |

**The decision measure matters more than ρ.** Rank the pairs by the best predictor, take the top quartile, and
report what fraction of the genuinely low-scoring pairs (score below 60%) that quartile catches. A predictor
with ρ = 0.6 that misses half the weak specs is not a triage rule. Report this number whatever ρ says.

## Threats to validity

- **Purity confounds with domain size.** A pure function over a large domain scores low because the tests sample
  few inputs, not because its oracle is narrow. C1 exists to separate these. If C1 predicts better than P1, the
  original intuition is wrong in an interesting way.
- **Equivalent mutants inflate "survived".** A mutant that cannot change behaviour is not a gap. We do not
  correct for this. It adds noise that should fall roughly evenly across pairs, and it caps how high any ρ can
  go.
- **P1 is a keyword count.** It cannot see an assertion on a captured argument, or a custom chai matcher. Spot
  check the five highest and five lowest P1 specs by hand before trusting the column.
- **Researcher degrees of freedom.** Predictors, exclusions and thresholds are fixed in this document. Changing
  them after seeing the scores invalidates the result. Record any change and the reason.
- **Scope.** Server specs on mocha only. Client specs run on jest with different conventions, and their scores
  are not comparable to these.

## Decision rule

Written in advance, so the experiment settles something.

- **A predictor reaches ρ ≥ 0.5 and catches most weak specs.** Adopt it as triage. Add a script that ranks specs
  by it, and document the rule in [docs/mutation-testing.md](../mutation-testing.md).
- **A predictor is weak (0.3 – 0.5).** Use it to break ties when choosing between candidate targets. Do not gate
  on it.
- **No predictor reaches 0.3 (H0).** Abandon static triage. Scope by risk instead — churn multiplied by blast
  radius — and record that the intuition did not survive.

## Cost

| Step | Cost |
| --- | --- |
| Static predictors, whole repo | seconds |
| Fast pass, 200 pairs at ~10 s | ~35 minutes, estimated |
| Join and analysis | minutes |

The per-pair figure is an estimate from single runs of two specs, not a measurement over the frame. The pilot in
step 3 replaces it. Exclusions will also cut the 200 down, possibly a long way.

No repository changes. The runs write only to git-ignored report directories.

## Not in scope

- Whether mutants stand in for real faults at all. That is the literature's question; Just et al., *Are mutants
  a valid substitute for real faults in software testing?* (FSE 2014) is the usual starting point. Read it
  before turning any result here into a gate.
- The typed pass, for the reason given under Procedure.
- Client and jest specs.
