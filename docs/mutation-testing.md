# Local mutation testing

Mutation testing checks whether existing tests detect small changes to production
code. Stryker makes those changes in a sandbox, leaving your source files intact.

## Run

With dependencies installed, required workspaces built, and ordinary unit tests
passing, run from the repository root:

```sh
yarn test:mutation --diff
```

For test-only changes, select the production code explicitly:

```sh
yarn test:mutation packages/password-policies --mutate src/PasswordPolicy.ts
```

Paths are package-relative. Quote globs and select production files only.
[Stryker's `--mutate` patterns](https://stryker-mutator.io/docs/stryker-js/configuration/#mutate-string)
support comma-separated files, exclusions, and line ranges. This mode needs no
Git base and uses the same runners and reports as `--diff`.

The `--diff` mode compares your working tree with the merge base of `HEAD` and
`origin/develop`. It includes committed, staged, unstaged, and non-ignored untracked
changes. If the base is unavailable, run `git fetch origin develop` first.

Added and modified JavaScript/TypeScript lines in workspace packages are selected.
Tests, declarations, configuration files, migrations, and common build output are
excluded. Deleted lines cannot be mutated. Untracked source files are selected in
full. Skipped files are printed with a reason.

Affected packages run their configured Jest and Mocha unit suites. If a package has
both, each runs separately. Meteor's Jest client and server projects retain their
jsdom and Node environments. Vitest, Playwright, and API tests against a separate
server are unsupported.

A test-only or documentation-only PR using `--diff` prints `No changed production lines to
mutation-test.` and stops without generating a report. This command does not infer
production targets from changed tests; use explicit selection to check them.

This is a local, opt-in command; you do not need to wait for CI. Each job runs a
baseline before testing mutants, so even a small diff can take time.

## Reports

Open `reports/mutation/<runner>/mutation.html` inside the affected package, where
`<runner>` is `jest` or `mocha`. The same directory contains `mutation.json`.
Each run replaces its runner's previous reports. If nothing is selected, existing
reports remain unchanged.

- **Killed**: a test detected the change.
- **Survived**: tests passed with the change; inspect assertions and boundary cases.
- **NoCoverage**: the selected suite did not exercise the changed code.
- **Timeout**: testing the mutation exceeded the time limit; investigate unexpected timeouts.

Survivors do not fail the command. Configuration errors, failing baseline tests,
and incomplete runs return a nonzero exit code. A failed run may leave a partial
report; check the terminal output before relying on it. Review surviving mutations,
improve the relevant tests, and rerun the command.

## Maintain the tooling

After changing the mutation tooling or upgrading its test runners, run:

```sh
yarn test:mutation:tooling
```

This checks diff selection, runner compatibility, reports, failures, and source
integrity. It is not a prerequisite for ordinary mutation runs. Shared settings live
in [`stryker.config.mjs`](../stryker.config.mjs).
