# Local mutation testing

StrykerJS makes small changes to production code and runs existing Jest and Mocha
unit tests to check whether they detect each change. The main command is:

```sh
yarn test:mutation --diff
```

It assesses changed production lines, including uncommitted work. Mutation testing
is opt-in and separate from `testunit` and CI: you can run it before committing
or pushing, without waiting for CI.

## What mutation testing tells you

Coverage shows whether tests execute code. Mutation testing checks whether their
assertions detect changes in behavior. Each generated change is called a **mutant**.

Consider a hypothetical weak test for Rocket.Chat's `censorUrl`:

```ts
const result = censorUrl('https://example.com/?access_token=secret');
expect(typeof result).toBe('string');
```

This executes the redaction code but would pass if the secret remained in the URL.
A mutant that removes the redaction could survive. Checking the expected output
would detect that change:

```ts
expect(censorUrl('https://example.com/?access_token=secret')).toBe('https://example.com/?access_token=*Redacted*');
```

The existing [`censorUrl` tests](../packages/tools/src/censorUrl.spec.ts) already
check redacted output; this example illustrates why executing a line is not enough.

During a run, Stryker creates a sandbox and checks that the baseline tests pass.
It then activates mutations, such as changed comparisons or removed statements,
and reruns tests using per-test coverage where possible. One expression can
produce several mutants. The wrapper writes reports and optionally checks a
minimum score. Mutations stay in the sandbox; `--inPlace` is unsupported.

## Quick start

Use the Node and Yarn versions supported by the root `package.json`. From the
repository root:

```sh
yarn install
yarn workspace @rocket.chat/jest-presets build
```

Build any other workspace dependencies required by the selected package and get
its ordinary unit tests passing. Preview the selection, then run it:

```sh
yarn test:mutation --diff --plan
yarn test:mutation --diff
```

The command discovers `jest.config.ts` and `.mocharc.js` in affected workspace
packages. If both exist, it runs both suites separately against the selected lines.
Use `--testRunner jest` or `--testRunner mocha` to select one runner.

Open the package's `reports/mutation/<runner>/mutation.html` or read `summary.json`.
Review survivors, improve the relevant tests, and repeat the same selection.
For documentation-only or test-only changes, use a focused run to select production
code explicitly.

## Choose files and tests

The first argument is a package directory containing `package.json` and a supported
runner configuration. Mutation patterns and test paths are relative to that package:

```sh
# One production file.
yarn test:mutation packages/tools --mutate src/censorUrl.ts

# Only a line range, or several files in one run.
yarn test:mutation packages/tools --mutate 'src/censorUrl.ts:30-36'
yarn test:mutation packages/tools --mutate 'src/censorUrl.ts,src/getLoginExpiration.ts'

# Wrapper help and Stryker options.
yarn test:mutation --help
yarn test:mutation packages/tools --help
```

Quote globs to prevent shell expansion. Without `--mutate`, Stryker uses its default
source patterns under `src` and `lib`, excluding tests. An explicit `--mutate`
overrides those defaults, so select production files only. Empty selections fail.
Line ranges restrict mutations, not which tests may detect them.

Manual package runs also discover both runners. Jest retains the package's resolved
presets, environments, and module aliases. For a focused Meteor Mocha unit suite:

```sh
yarn test:mutation apps/meteor --testRunner mocha \
  --mutate server/lib/callbacks/callbacksBase.ts \
  --testFiles server/lib/callbacks.spec.ts
```

For Mocha, `--testFiles` accepts comma-separated paths or quoted globs and replaces
the configured test selection while preserving setup, including Meteor's `tsx`
loader and Chai plugins. Without it, Mocha uses the tests selected by `.mocharc.js`.

### Meteor's Jest projects

Meteor's client and server projects run together in the Jest job, preserving
`jsdom` for client tests and Node for server tests. Both contribute to the same
Jest report. `--diff` discovers them automatically. Use `--diff --testRunner jest`
to assess changed lines with Jest alone, or select a package and file with
`yarn test:mutation apps/meteor --testRunner jest --mutate client/providers/CustomSoundProvider/lib/formatVolume.ts`.

### Supported suites

- Jest and Mocha unit tests that load production code into the test process are
  supported. Jest projects must be inline configurations sharing the package root,
  using Node or jsdom with `jest-circus`; separate project roots are unsupported.
- A failed runner does not prevent other discovered jobs from running, but the
  overall command reports the failure.
- Vitest and Playwright are unsupported. API integration suites using a separate
  running server are also outside this setup: it does not run that server with
  mutated code.

## Test changed lines

`--diff` compares the current working tree with the merge base of `HEAD` and
`origin/develop`. It includes committed branch changes, staged and unstaged edits,
and non-ignored untracked files. Use `--base` to select another ref, such as the
parent branch when working on a stack:

```sh
yarn test:mutation --diff --base origin/develop --plan
yarn test:mutation --diff --base origin/develop --testRunner mocha
```

The base is not fetched automatically. `--plan` prints JSON with the base, merge
base, package/runner jobs, targets, and skipped paths. It does not run tests or
write reports, and finding a configuration does not guarantee that it can run.

Selection follows these rules:

- Added and modified JavaScript/TypeScript lines are selected. Untracked files
  are selected in full; renames are treated as deletion plus addition.
- Deleted files and deletion-only hunks are skipped because they have no new
  lines to mutate. This mode does not assess whether tests detect deletions.
- Declarations, `*.test.*`, `*.tests.*`, `*.spec.*`, `*.stories.*`, `*.config.*`,
  `.mocharc.*`, and directories named `__tests__`, `__mocks__`, `test`, `tests`,
  `dist`, `node_modules`, `coverage`, or `migrations` are excluded. Production
  names such as `setup.ts`, `config.ts`, and `reports/` remain eligible.
- Files outside root workspaces, symlinks, and packages without a matching runner
  configuration are skipped with a reason. Filenames that cannot safely become
  mutation patterns fail explicitly.

All selected ranges are batched into one job per package and runner. Jobs run
sequentially, with two Stryker workers per job by default. Batching avoids a separate
baseline run for every file, while line selection reduces the number of mutants.
The baseline suite still has to run, so a small diff can remain expensive.

Normal Stryker options, such as `--concurrency 1`, can follow `--diff`. Do not combine
`--diff` with `--mutate`. The planner discovers configurations; it does not infer
which framework covers a file. Each runner produces an independent assessment.
Test-only changes require a manual production-file selection.

## Review results

Reports live in the selected package's `reports/mutation/jest/` or
`reports/mutation/mocha/` directory:

- `mutation.html`: a browsable view of the mutations.
- `mutation.json`: the full Stryker report.
- `summary.json`: counts, score, status, runner, targets, surviving mutations,
  covering tests, and ignored mutations with their supplied reasons.

Each job clears and replaces only its own runner's reports. Failed runs cannot
reuse that runner's old result or erase the other runner's reports. Reports and
sandboxes are ignored by Git. Run only one mutation command per package at a time.

| Outcome                    | Meaning                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| `Killed`                   | A test failed with the mutation active.                                                     |
| `Survived`                 | The tests did not detect the mutation. Review assertions and boundary cases.                |
| `NoCoverage`               | No test exercised the mutation. Check the test selection and missing cases.                 |
| `Timeout`                  | The mutation exceeded the time limit; counted as detected. Investigate unexpected timeouts. |
| `Ignored` / `CompileError` | Excluded from the score. Review supplied ignore reasons.                                    |
| `RuntimeError` / `Pending` | The assessment is incomplete and cannot satisfy a score gate.                               |

Start with `summary.json`. Its `survivors` list includes both `Survived` and
`NoCoverage`, with locations, original source, replacements, and covering test
metadata when available. A test may be represented only by its ID.

1. Compare `original` and `replacement`. Find a supported input for which behavior
   differs; for a changed comparison, try the boundary value.
2. Inspect `coveringTests` and add or improve an assertion about the intended
   result or side effect. For `NoCoverage`, first check the selected suite.
3. Run the ordinary test, then repeat the same mutation selection and check the
   individual mutant's outcome.

A survivor is not proof of a production bug. Some mutations preserve observable
behavior; document that reasoning rather than adding an implementation-dependent
assertion just to increase the score.

### Score and optional gate

```text
score = 100 × (Killed + Timeout) / (Killed + Timeout + Survived + NoCoverage)
```

For example, 7 killed, 1 timed out, 1 survived, and 1 uncovered mutant yield 80%.
With no scorable mutants, the score is `null`, not 100%. Scores describe the selected
lines and tests, not the entire package. Small selections cause large percentage
swings, so compare runs with the same scope and inspect individual results.

Survivors do not fail a run by default. To enforce a minimum score for each job:

```sh
yarn test:mutation --diff --min-score 80
```

The gate compares the unrounded score independently for each runner; their results
are not combined. It does not require zero survivors. Only a `complete` assessment
can pass: `no-mutants`, `dry-run`, `incomplete`, and `failed` cannot satisfy a gate.
`--dryRunOnly` checks the baseline without scoring and cannot accompany `--min-score`.

| Exit code     | Meaning                                                                          |
| ------------- | -------------------------------------------------------------------------------- |
| `0`           | Completed report-only run, passed gate, successful dry run, or no eligible jobs. |
| `1`           | The optional score gate was not satisfied.                                       |
| `2`           | Invalid arguments, package path, or comparison base.                             |
| `3`           | Configuration, baseline, or Stryker failure, or an incomplete assessment.        |
| `130` / `143` | Interrupted by SIGINT / SIGTERM.                                                 |

Check the printed status as well as the exit code. A diff with no eligible jobs
exits `0` even with `--min-score`, measures no score, and leaves existing reports
untouched. Check `generatedAt`, `targets`, and `testRunner` before relying on a
saved summary. Partial results can help diagnosis but never pass the gate.

## Troubleshooting

| Symptom                                | Next step                                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Cannot find a merge base               | Run `git fetch origin develop` or select an available ref with `--base`.                                                             |
| No eligible changes or targets         | Inspect `--diff --plan` and skipped reasons. For manual targets, check package-relative paths and ranges.                            |
| Missing modules or failing baseline    | Install dependencies, build required workspaces, and get ordinary tests passing. Use `--dryRunOnly` to check the mutation setup.     |
| Mostly `NoCoverage`                    | Check that the chosen suite exercises the selected production code.                                                                  |
| A report exists but the command failed | Inspect `status`, `error`, and terminal output; the report may be incomplete.                                                        |
| The run takes too long                 | Narrow `--mutate` to a file/range or scope Mocha with `--testFiles`. `--concurrency 1` reduces parallel workers, not the total work. |

## Maintain the tooling

After changing the wrapper, shared Jest presets, or Jest/Mocha/Stryker versions, run:

```sh
yarn test:mutation:tooling
```

These checks use temporary fixtures and Git repositories to exercise selection,
runner setup, reports, score gates, and cancellation without changing package tests
or production code. Shared defaults live in [`stryker.config.mjs`](../stryker.config.mjs).

Keep the compatibility checks passing when upgrading: the
[Jest helper](../scripts/mutation-jest-config.mjs) preserves presets and aliases;
its [environment adapter](../scripts/mutation-jest-environment.cjs) keeps each
project's Node/jsdom environment under Stryker's coverage hooks. The
[worker](../scripts/mutation-worker.mjs) records completion after reporters finish
and maps Mocha `--testFiles` to `mochaOptions.spec` to avoid Stryker 10's static-mutant
filtering issue.

See the [StrykerJS documentation](https://stryker-mutator.io/docs/stryker-js/)
for additional configuration and runner details.
