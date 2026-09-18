# Local mutation testing

StrykerJS introduces small changes to production code and runs the existing Jest
tests to check whether they detect each change. Use it to investigate missing
assertions and boundary cases when working on a package's tests.

## Run

Install dependencies with `yarn install` and build the shared Jest presets if
needed:

```sh
yarn workspace @rocket.chat/jest-presets build
```

Run the package's ordinary unit tests first. Then, from the repository root,
select a package directory and optionally a production file:

```sh
yarn test:mutation packages/tools --mutate src/censorUrl.ts
```

The package and file above are examples; no package is enabled by default. The
command requires a package path inside the repository with a `package.json` and
`jest.config.ts` defining a single Jest project. It uses that package's existing
Jest configuration, and any workspace dependencies needed by those tests must
already be built. The shared configuration resolves the Jest environment and
module aliases before creating the sandbox: client presets retain `jsdom`,
external aliases retain their repository paths, and local aliases point to the
mutated copies.

Without `--mutate`, Stryker uses its default source patterns under the selected
package's `src` and `lib` directories, excluding test files. Start with a single
file to assess runtime. Mutation patterns are relative to the package, not the
repository root. Quote globs to prevent shell expansion:

```sh
yarn test:mutation packages/tools --mutate 'src/censorUrl.ts,src/getLoginExpiration.ts'
yarn test:mutation --help
```

Arguments after the package path are forwarded to Stryker, except `--min-score`; use
`yarn test:mutation packages/tools --help` for its available options. An explicit
`--mutate` overrides the default patterns, so select production files only.
An empty selection fails instead of reporting a successful run with no mutation
targets. This check uses Stryker's selected files, including exclusions and line
ranges. The wrapper retains the JSON and `mutation-targets` reporters when
overriding `--reporters`, because summaries and empty-selection checks need them.

This shared setup targets single-project Jest suites. Multi-project configurations
(such as Meteor's client/server Jest projects) require a dedicated setup and are
rejected. It does not run Mocha or Playwright suites.

## Test changed lines

Preview the selection, then run it:

```sh
yarn test:mutation --diff --base origin/develop --plan
yarn test:mutation --diff --base origin/develop
```

`--base` defaults to `origin/develop`. For a stacked branch, select its parent
branch instead. The command resolves the merge base with `HEAD` and compares
that baseline with the current working tree. This includes committed branch
changes, staged and unstaged edits, and non-ignored untracked source files.
It does not fetch the base automatically; missing refs fail with an explanation.

The planner discovers packages using the root `package.json` workspace patterns
and groups all changed ranges into one Stryker invocation per package. Packages
run sequentially, with the existing two-worker setting inside each run. Normal
Stryker options, such as `--concurrency 1`, can follow `--diff`. `--mutate` cannot
be combined with `--diff`, because the planner owns the mutation selection.

`--plan` prints JSON containing the base, merge base, jobs, and skipped paths
without running Jest or writing mutation reports. It checks file eligibility,
not whether the selected Jest configuration or its dependencies can run.

Selection rules:

- Added and modified lines in JavaScript/TypeScript files are selected. New
  untracked files are selected in full. Renames are treated as deletion plus
  addition, checking the complete destination file in its new package context.
- Deleted files and deletion-only hunks have no new lines to mutate and are
  reported as skipped. This mode does not assess whether tests detect deletions.
- The exclusion list covers type declarations, `*.test.*`, `*.spec.*`,
  `*.stories.*`, `*.config.*`, and directories
  named `__tests__`, `__mocks__`, `test`, `tests`, `dist`, `node_modules`, `coverage`,
  or `migrations`. Generic production names such as `setup.ts`, `config.ts`, and
  `reports/` remain eligible.
- Files outside root workspaces and packages without `jest.config.ts` are
  skipped with a reason. Symlinks are skipped. Filenames that cannot be safely
  represented as mutation patterns fail explicitly.
- A selected multi-project Jest package still fails explicitly, including
  Meteor; it is not silently reported as tested. Other selected packages can
  finish and retain their summaries.

A run with no eligible changes prints that no mutation score was measured.
Test-only changes do not select production code automatically; use the manual
package/file command to assess the affected behavior in that case.

## Review results

Reports are written inside the selected package:

- `reports/mutation/mutation.html`: open in a browser to inspect mutations.
- `reports/mutation/mutation.json`: the full Stryker report.
- `reports/mutation/summary.json`: compact counts, score, run status, selected
  targets (or `null` for default selection), survivors and covering test names,
  and ignored mutants with their supplied reasons.

Each run replaces the reports for that package with results for its selected
scope. Old reports are removed before starting, so failed runs cannot reuse a
previous successful result. Run only one mutation command per package at a time.
Generated reports and temporary Stryker sandboxes are ignored by Git. Mutations
stay in Stryker's sandbox; `--inPlace` is not supported.

- **Killed:** a test detected the change.
- **Survived:** the covering tests passed despite the change; review whether a
  meaningful assertion or test case is missing.
- **No coverage:** no test exercised the mutation.

Compare each survivor with the intended behavior before adding a test. Some
mutations preserve behavior and cannot be killed. After improving a test, rerun
the same scope to check whether it catches the mutation.

The shared configuration uses two workers, per-test coverage, and local HTML and
JSON reports. The score threshold is non-blocking by default. To enforce a minimum per selected
package for an individual run:

```sh
yarn test:mutation --diff --min-score 80
yarn test:mutation packages/tools --mutate src/censorUrl.ts --min-score 80
```

The threshold is optional, not a repository-wide policy. Survivors do not fail a
report-only run. A threshold run compares the unrounded score; it does not require
zero survivors. Ignored and invalid mutants are excluded from the score. A run
with no scorable mutants reports `score: null` and cannot satisfy an enabled gate.

The summary distinguishes `complete`, `no-mutants`, `dry-run`, `incomplete`, and
`failed`. Partial results can be inspected but never satisfy a gate. Pending or
runtime-error mutants make the assessment incomplete. `--dryRunOnly` checks the
baseline only, produces no mutation score, and cannot be combined with
`--min-score`.

Exit codes:

- `0`: completed report-only run, passed optional threshold, successful dry run,
  or no eligible changes (check the printed status).
- `1`: a completed mutation assessment did not satisfy the optional threshold.
- `2`: invalid wrapper arguments, package path, or comparison base.
- `3`: Stryker/configuration/baseline failure or incomplete assessment.
- `130` / `143`: interrupted with SIGINT / SIGTERM.

Mutation testing remains opt-in and separate from `testunit` and CI.

See the [StrykerJS documentation](https://stryker-mutator.io/docs/stryker-js/)
for configuration and runner details.

## Validate changes to the tooling

After dependencies and the shared Jest presets are built, run
`yarn test:mutation:tooling`. These integration checks create and remove temporary
fixtures to verify preset environments, module aliases, target selection,
report freshness, optional gates, and the multi-project restriction. Temporary
Git repositories exercise merge-base selection, dirty/untracked files, renames,
and multiple packages, including an end-to-end Stryker run. They do not change any
package's production code or tests.

## Upgrading Jest or Stryker

Run `yarn test:mutation:tooling` whenever upgrading Jest or any
`@stryker-mutator/*` dependency, and when changing the shared Jest presets.
This focused check exercises the integration without running mutation testing
across the codebase.

The Jest compatibility logic lives in
[`scripts/mutation-jest-config.mjs`](../scripts/mutation-jest-config.mjs), keeping
`stryker.config.mjs` focused on Stryker settings. It uses Jest's `readConfigs` API
through the selected package's `jest` / `jest-cli` dependencies. That API and
dependency layout may change between Jest versions; investigate this helper
first if an upgrade breaks configuration loading.

The helper resolves presets before Stryker creates its sandbox because the
coverage environment can otherwise fall back to Node when `jsdom` is inherited
from a preset. It also preserves external module aliases while redirecting local
aliases to the mutated copies. Keep the integration checks passing when adjusting
these workarounds: loading the original source instead of the sandbox copy can
produce misleading mutation results.

The CLI worker uses Stryker's command-line parser with a run callback to record
successful completion after reporters finish. Keep its callback integration
covered when upgrading Stryker; process success alone cannot prove that a
mutation report was produced.
