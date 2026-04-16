# Code Coverage

This document explains how code coverage instrumentation works in Rocket.Chat's build and CI pipeline.

## Overview

Coverage is collected during E2E test runs (API, UI, Livechat) to measure how much of the server-side code is exercised by tests. The instrumentation uses [Istanbul](https://istanbul.js.org/)-compatible tooling, which injects counters (`__coverage__`) into the compiled code at build time.

## Architecture

The coverage pipeline has three components:

1. **Build-time instrumentation** - injects coverage counters into the code during Meteor build
2. **Runtime collection** - the `rocketchat:coverage` Meteor package collects `__coverage__` data on process exit
3. **CI reporting** - test workflows merge coverage data and upload reports

```
Build (SWC + plugin)  -->  Run tests  -->  Process exit triggers report  -->  Merge & upload
```

## Build-time instrumentation

### Modern build stack (SWC)

Rocket.Chat uses Meteor's modern build stack with [SWC](https://swc.rs/) as the transpiler. For coverage builds, the [`swc-plugin-coverage-instrument`](https://github.com/kwonoj/swc-plugin-coverage-instrument) plugin is injected into `.swcrc` at build time.

This is configured in `.github/actions/meteor-build/action.yml`:

```yaml
env:
  BABEL_ENV: ${{ inputs.type }}  # "production" or "coverage"
```

When `BABEL_ENV=coverage`, the build script:

1. Adds `rocketchat:coverage` to `.meteor/packages`
2. Injects `swc-plugin-coverage-instrument` into `.swcrc` via a node script:

```js
const swcrc = JSON.parse(fs.readFileSync('./apps/meteor/.swcrc', 'utf8'));
swcrc.jsc.experimental = swcrc.jsc.experimental || {};
swcrc.jsc.experimental.plugins = swcrc.jsc.experimental.plugins || [];
swcrc.jsc.experimental.plugins.push(['swc-plugin-coverage-instrument', {}]);
fs.writeFileSync('./apps/meteor/.swcrc', JSON.stringify(swcrc, null, 2) + '\n');
```

This approach ensures the same build pipeline (SWC) is used for both regular and coverage builds, avoiding behavioral differences between build modes.

### Legacy build stack (Babel)

Before the modern build stack, coverage was handled via `babel-plugin-istanbul` configured in `.babelrc`:

```json
{
  "env": {
    "coverage": {
      "plugins": [
        ["istanbul", { "exclude": ["**/*.spec.js", "**/*.test.js"] }]
      ]
    }
  }
}
```

This section is still present in `.babelrc` as a fallback for files that fall back to Babel compilation (e.g., SWC-incompatible code).

## Runtime collection: `rocketchat:coverage`

The `rocketchat:coverage` Meteor package (`apps/meteor/packages/rocketchat-coverage/`) is only added to the build during coverage runs. It:

1. Registers a `process.on('exit')` handler
2. Reads `globalThis['__coverage__']` (populated by the instrumentation)
3. Generates a coverage report using `istanbul-lib-coverage` and `istanbul-reports`

Configuration via environment variables:

| Variable | Description | Example |
|---|---|---|
| `COVERAGE_DIR` | Output directory for reports | `/tmp/coverage/api` |
| `COVERAGE_FILE_NAME` | Report filename | `api-1.json` |
| `COVERAGE_REPORTER` | Istanbul reporter format | `json`, `lcov` |

## CI workflow

Coverage is collected in the `ci-test-e2e.yml` workflow:

1. **Build**: `meteor-build` action runs with `type: coverage`, producing a Docker image with instrumented code
2. **Test**: E2E tests run against the instrumented server. On each test shard:
   - `COVERAGE_DIR`, `COVERAGE_FILE_NAME`, and `COVERAGE_REPORTER` are set
   - When the Rocket.Chat process exits after tests, the coverage plugin writes a JSON report
3. **Merge**: `nyc merge` combines per-shard JSON reports into a single coverage file
4. **Upload**: Coverage data is uploaded to Codecov

## Local development

To build with coverage locally:

```bash
cd apps/meteor

# Inject the SWC coverage plugin into .swcrc
node -e "
  const fs = require('fs');
  const swcrc = JSON.parse(fs.readFileSync('.swcrc', 'utf8'));
  swcrc.jsc.experimental = { plugins: [['swc-plugin-coverage-instrument', {}]] };
  fs.writeFileSync('.swcrc', JSON.stringify(swcrc, null, 2));
"

# Add the coverage package
echo -e "rocketchat:coverage\n" >> .meteor/packages

# Set env vars and run
COVERAGE_DIR=/tmp/coverage COVERAGE_FILE_NAME=local.json COVERAGE_REPORTER=lcov yarn dev
```

Remember to restore `.swcrc` and `.meteor/packages` after testing.

## Dependencies

| Package | Purpose |
|---|---|
| `swc-plugin-coverage-instrument` | SWC plugin for Istanbul-compatible instrumentation |
| `istanbul-lib-coverage` | Coverage map creation (used by `rocketchat:coverage`) |
| `istanbul-lib-report` | Report context creation |
| `istanbul-reports` | Report formatters (json, lcov, etc.) |
