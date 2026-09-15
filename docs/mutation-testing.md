# Mutation testing

Coverage says a line ran. It does not say a test would notice the line change.

Stryker edits the source — one small change at a time — and reruns the suite against each edit. A change is a
*mutant*. A mutant the suite rejects is *killed*. A mutant the suite accepts *survived*, and it names a line the
suite executes but does not check.

## Run it

```bash
cd apps/meteor && yarn testmutation
```

The config is [apps/meteor/stryker.conf.js](../apps/meteor/stryker.conf.js). The run writes an HTML report to
`apps/meteor/reports/mutation/index.html` and the same data as JSON next to it. Both are git-ignored.

## Point it at your code

The config is scoped to one spec and to the code that spec owns. Two constants at the top move together:

- `SPEC` — the spec file to grade.
- `MEMBERS` — the names of the class members that spec is responsible for.

A whole-file `mutate` on a 2000-line service reports mostly "no coverage", which says nothing about the spec.

Stryker takes ranges as `file.ts:START-END`. Do not write those numbers by hand. They go stale the moment the
file moves — one rebase is enough — and a stale range does not fail. It grades whatever now sits at those line
numbers and reports a score for it. The config reads the ranges out of the source by member name instead, and
throws when a name no longer resolves, so the run stops rather than lies.

Leave out a helper that a sibling spec owns. A spec that asserts *that* a join calls `leaveOtherCalls` is not
responsible for what `leaveOtherCalls` does inside, and mutating it reports another spec's gaps against this one.

## Read the result

Three statuses matter.

- **Survived** — the finding. Open the HTML report, read the mutant, and decide whether the behaviour it changed
  is behaviour anyone depends on. If it is, the spec is missing an assertion.
- **No coverage** — the spec never reaches the line. Either another spec owns it, or nothing tests it.
- **Killed** — a test rejected the change.

Not every survivor is a missing test. A mutant that rewrites a Mongo projection, a log message or a
translation key changes nothing a unit test should assert. Judge each one; do not chase the score.

## What it costs

The suite reruns once per covered mutant, so the run is the suite's runtime multiplied by the mutant count.
Keep `mutate` narrow. `coverageAnalysis: 'perTest'` already limits each mutant to the tests that reach it, and
reports an unreached mutant without running anything.
