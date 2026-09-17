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

There is a second, slower pass that type-checks each mutant — see [The typed pass](#the-typed-pass) below.

## Choose a target by risk

Do not choose by a property of the spec. We tested that, and it does not work — see
[docs/mutation-testing-scope-results.md](mutation-testing-scope-results.md).

The intuition was that mutation testing pays more on side-effect-heavy code. Across 133 specs no static
predictor reached the bar. Oracle weakness scored ρ = −0.10, branch density ran the wrong way at +0.19, and
effect surface reached −0.39 only because it tracks file size. The best of them misses more than half of the
specs that score below 60%.

Pick the target for what a missed fault would cost: churn multiplied by blast radius. Code that changes often
and that many callers depend on earns the attention. A regex over the spec does not tell you that.

## The Apps-Engine package

`packages/apps` carries its own config, because it runs `node:test` rather than mocha.

```bash
cd packages/apps && yarn testmutation          # the default target
cd packages/apps && TARGET=AppConsole yarn testmutation
```

[packages/apps/stryker.conf.js](../packages/apps/stryker.conf.js) names the targets, and each target pairs a
test file with the code that test file owns. Two things read differently there.

- **There is no `NoCoverage`.** `node:test` has no Stryker runner, so the run goes through the generic command
  runner. Stryker cannot ask a command which test reached which line, so a mutant nothing reaches still exits
  0 and reports as `Survived`. Read a survivor in a member the test never calls as "not tested", not as "not
  checked".
- **Every mutant reruns the whole command.** `coverageAnalysis` must be `off` for the same reason. Keep the
  target's `test` pointed at one test file; the package's full suite takes nine minutes.

Two test files stay out of every target. `DenoRuntimeSubprocessController.test.ts` and
`SecureFieldsCodecCompatibility.test.ts` spawn a real Deno subprocess, take about four minutes each, and fail
without the Deno cache. A red baseline stops Stryker before it mutates anything.

## Is a shallow test worth keeping

A test that asserts a collaborator was called, and does not check what it was called with, looks weak. Do not
judge it by that. We measured the "asserts *that*" style against the mutation score over 133 specs and found
ρ = −0.10 — no signal. See [docs/mutation-testing-scope-results.md](mutation-testing-scope-results.md).

Ask the marginal question instead. **If this test went away, what would stop being caught?** A mutation score
says how much of the behaviour some test checks. It does not say which test, so a test can score well on code
another test already covers.

Run the target twice and diff the reports:

```bash
cd packages/apps
TARGET=UIActionButtonManager SCOPE=all         yarn testmutation
TARGET=UIActionButtonManager SCOPE=all-but-own yarn testmutation
node scripts/mutation-unique-kills.js UIActionButtonManager
```

A mutant killed under `all` and surviving under `all-but-own` is a **unique kill**. Unique kills are what the
test is worth. A test with none is either redundant, or the last line on code nothing else reaches.

The three managers we measured all came out the same way, and the shallow ones came out strongest:

| Target | Score, all tests | Score without its own test | Unique kills |
| --- | --- | --- | --- |
| `AppSettingsManager` | 100% | 0% | 27 of 27 |
| `UIActionButtonManager` | 92% | 2% | 36 of 37 |
| `AppApiManager` | 80% | 2% | 50 of 51 |

Nothing else in the package holds this code. A shallow test here is not a weak test; it is the only test.

**What the measure does not settle.** A unique kill says the test notices a change. It does not say the
change matters. Judge each survivor and each kill on whether anyone depends on the behaviour — a mutant that
rewrites a log message or a Mongo projection is noise either way. For a bridge call the argument is often the
whole contract, because the manager's job is to call the bridge correctly; there, an assertion on the call
alone leaves a real gap. Read the surviving mutants to find it.

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

## The typed pass

```bash
cd apps/meteor && yarn testmutation:typed
```

Stryker mutates syntax and never asks the compiler. So it writes mutants that could not ship — a `boolean`
where a `Date` belongs, an argument dropped from a call — and reports them as survivors. `stryker.typed.conf.js`
adds `@stryker-mutator/typescript-checker`, which compiles each mutant and reports the ones that do not build as
`CompileError`. The survivor list gets shorter.

Read what it removes before you trust the shorter list. In TypeScript a guard is often what narrows a type, so
deleting it stops the code below from compiling:

```ts
if (!call) {
	throw new Error('Invalid video conference');
}
// remove the guard and every `call.x` below is an error: 'call' is possibly 'null'
```

That mutant is a real finding — nothing tests the missing-call path — and the checker files it as a compile
error. On the current target the trade is close to even: three noise mutants removed, three findings lost, and
the remaining seven still reported as `NoCoverage` on the guarded body.

It costs about 11 minutes against 2 seconds, so it is a deliberate pass, not the loop to iterate in.

### It caches between runs

`incremental: true` stores each mutant's result and reuses it while the code behind it has not changed:

| | Cold | Warm |
|---|---|---|
| Fast pass | 2 s | 1 s |
| Typed pass | 627 s | 124 s |

The cache covers the per-mutant work, which is where the time goes. It does not cover the project compile, so
about 85 seconds is the floor of any typed run. `yarn testmutation:typed --force` rebuilds the cache.

A run that fails writes no cache file. Before you credit a fast run to the cache, check the log for
`No incremental result file found at …` — that line means the run was cold.

### The patch behind it

`@stryker-mutator/typescript-checker` does not run on this repo unmodified, so it carries a yarn patch:
[.yarn/patches/@stryker-mutator-typescript-checker-npm-10.0.0-e7d3599a58.patch](../.yarn/patches/@stryker-mutator-typescript-checker-npm-10.0.0-e7d3599a58.patch).

The plugin forces `allowUnreachableCode: true` and `noUnusedLocals: false` on the project, because mutants
routinely produce dead code and unused bindings. `@rocket.chat/tsconfig/base.json` sets `allowUnreachableCode:
false`, and `server/lib/i18n.ts` carries a `@ts-expect-error unreachable code` inside the `if (false)` block
that makes the Meteor bundler see the translation imports. Under the override that directive has nothing to
suppress, so TypeScript reports it as unused (TS2578) — a diagnostic the plugin's own settings created.

The patch drops that one code, in both the dry run and the per-mutant check. Do not widen the set to mute an
error the project really has; a code belongs there only when the plugin's overrides manufacture it.

Patching `allowUnreachableCode` instead would be worse. The repo sets it to `false`, and `if (false) { … }` is
one of Stryker's stock mutations, so every such mutant would become a false `CompileError`.

### It needs the workspace built

The typed pass compiles the project, so it fails on any tree that does not type-check — including a tree whose
workspace packages are merely stale after a rebase. The errors it prints then have nothing to do with mutation
testing:

```
client/sidebar/categories/hooks/useUserSidebarCategories.ts(2,10):
  '"@rocket.chat/core-typings"' has no exported member named 'isStaleSidebarCategory'
```

Run `yarn && yarn build` from the repo root and try again.

The fast pass needs the build too, for a different reason. It does not type-check, but the specs import
workspace packages, and a package without a `dist/` stops the spec from loading. Stryker then fails its dry
run and reports nothing. A partial build is the trap: if one package fails, turbo skips every package below
it, and the errors name a missing module rather than the build. Check that `yarn build` ends with every task
successful.

### When the report is empty

`# errors` equal to the total mutant count means a project-wide diagnostic reached every mutant. The run exits
0 and prints a score of `n/a`. That is an empty report, not an untestable file — find the diagnostic before you
read anything into it.

## What it costs

The suite reruns once per covered mutant, so the run is the suite's runtime multiplied by the mutant count.
Keep `mutate` narrow. `coverageAnalysis: 'perTest'` already limits each mutant to the tests that reach it, and
reports an unreached mutant without running anything.

The typed pass costs more, and file size does not predict it. A 26-line module took as long as a 2200-line one,
because each mutant re-checks everything downstream of the file it sits in. Four files import the small module;
nothing imports the large one. Choose a target by who imports it, not by how big it is.
