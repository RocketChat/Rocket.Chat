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

Run `yarn && yarn build` from the repo root and try again. `yarn testmutation` does not type-check and is
unaffected.

### When the report is empty

`# errors` equal to the total mutant count means a project-wide diagnostic reached every mutant. The run exits
0 and prints a score of `n/a`. That is an empty report, not an untestable file — find the diagnostic before you
read anything into it.

## What it costs

The suite reruns once per covered mutant, so the run is the suite's runtime multiplied by the mutant count.
Keep `mutate` narrow. `coverageAnalysis: 'perTest'` already limits each mutant to the tests that reach it, and
reports an unreached mutant without running anything.
