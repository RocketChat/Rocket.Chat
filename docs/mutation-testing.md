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

Arguments after the package path are forwarded to Stryker; use
`yarn test:mutation packages/tools --help` for its available options. An explicit
`--mutate` overrides the default patterns, so select production files only.
An empty selection fails instead of reporting a successful run with no mutation
targets. This check uses Stryker's selected files, including exclusions and line
ranges. Keep the `mutation-targets` reporter enabled if overriding `--reporters`.

This shared setup targets single-project Jest suites. Multi-project configurations
(such as Meteor's client/server Jest projects) require a dedicated setup and are
rejected. It does not run Mocha or Playwright suites.

## Review results

Reports are written inside the selected package:

- `reports/mutation/mutation.html`: open in a browser to inspect mutations.
- `reports/mutation/mutation.json`: results for programmatic analysis.

Each run replaces the reports for that package with results for its selected
scope. Generated reports and temporary Stryker sandboxes are ignored by Git.

- **Killed:** a test detected the change.
- **Survived:** the covering tests passed despite the change; review whether a
  meaningful assertion or test case is missing.
- **No coverage:** no test exercised the mutation.

Compare each survivor with the intended behavior before adding a test. Some
mutations preserve behavior and cannot be killed. After improving a test, rerun
the same scope to check whether it catches the mutation.

The shared configuration uses two workers, per-test coverage, and local HTML and
JSON reports. The score threshold is non-blocking (`break: 0`); execution or
baseline test failures still cause an unsuccessful run. Mutation testing is
opt-in and separate from `testunit` and CI.

See the [StrykerJS documentation](https://stryker-mutator.io/docs/stryker-js/)
for configuration and runner details.

## Validate changes to the tooling

After dependencies and the shared Jest presets are built, run
`yarn test:mutation:tooling`. These integration checks create and remove temporary
fixtures to verify preset environments, external and local module aliases, empty
mutation selections, and the multi-project restriction. They do not change any
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
