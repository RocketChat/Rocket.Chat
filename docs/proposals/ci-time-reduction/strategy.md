# CI Time Reduction Strategy — Change-Aware Test Selection

Status: Proposal
Owner: Platform / DevEx
Scope: `.github/workflows/ci.yml`, `ci-test-e2e.yml`, `ci-test-unit.yml`, `ci-code-check.yml`

## 1. Goal

Cut wall-clock and compute cost of PR CI by **not running work that a PR cannot
possibly affect**. Concretely: eliminate execution of `📦 Meteor Build`,
`🔨 Test API` and `🔨 Test UI` (and their EE/livechat variants) for PRs whose
changes fall outside those jobs' blast radius.

Reference case: [PR #41376](https://github.com/RocketChat/Rocket.Chat/pull/41376)
adds a design doc plus refactors inside `packages/apps/base-runtime/` (Apps
base‑runtime accessors) and its co‑located unit tests. The blast radius is the
**Apps domain**. There is no reason to run Omnichannel, admin, messaging,
federation, or the bulk of the API suite for it.

## 2. Current pipeline anatomy

The PR pipeline is a single dependency chain. Everything expensive hangs off
the Meteor build:

```
release-versions (⚙️ variables, computes hashes + diff)
  └─ packages-build (📦 yarn build of all workspaces)
        ├─ checks (🔎 ts + lint)                    ← gates e2e
        ├─ test-unit (🔨 turbo run testunit)
        ├─ test-storybook
        └─ build  (📦 Meteor Build: production + coverage)   ◀── CULPRIT #1
              └─ build-gh-docker (🚢 6 service images × 2 arch)
                    └─ build-gh-docker-publish (multi-arch manifests)
                          ├─ test-api        (🔨 Test API CE)          ◀── CULPRIT #2
                          ├─ test-api-ee     (🔨 Test API EE)
                          ├─ test-api-livechat / -ee
                          ├─ test-api-apps-node-ee
                          ├─ test-ui         (🔨 Test UI CE, 4 shards) ◀── CULPRIT #3
                          ├─ test-ui-ee      (🔨 Test UI EE, 5 shards)
                          └─ test-federation-matrix
  (all of the above feed) tests-done  ✅  ← the aggregation gate
```

Key structural facts (verified in the workflows):

- **E2E is holistic, not per‑package.** `test-api`/`test-ui` boot a full
  Rocket.Chat Docker image built from the Meteor bundle and exercise it end to
  end. So the tests depend on the *build*, and the build depends on essentially
  the whole server + client tree. You cannot cheaply run "just the API tests for
  package X" — you first pay for a full build + docker.
- **Two distinct savings modes** follow from that:
  - **Mode A — skip the whole chain.** If a change provably cannot alter the
    running server/client bundle (docs only, a non‑bundled workspace, another
    app such as `apps/uikit-playground`, CI config for an unrelated job), then
    `build` → `docker` → *all* E2E can be skipped. This is the biggest lever.
  - **Mode B — narrow the E2E scope.** If a change does affect the bundle but is
    confined to an isolated leaf domain (the Apps case), you still must build +
    dockerize, but you can run only the relevant E2E suites/specs and skip the
    rest.
- **`tests-done` is the merge gate.** It `needs` every test job and, with
  `if: always()`, fails unless each result is exactly `success`. Any job we
  skip currently makes this gate fail. **This is the single most important
  thing to fix** before skipping anything (see §6).
- **Only existing path gating** is `paths-ignore: ['**.md']` on `ci.yml`. There
  is no `dorny/paths-filter`, no `tj-actions/changed-files`, and no
  `turbo --affected` / git‑range `--filter` anywhere. Turbo `--filter` is used
  only for build scoping (`build:services`, `dev`, `dsv`).
- Merge queue is in use (`merge_group` trigger) and Kodiak drives merges
  (`.kodiak.toml`, `block_on_neutral_required_check_runs = true`). Required
  status checks and merge‑queue semantics therefore constrain the design.

## 3. Core idea: one classification job → conditional fan‑out

Introduce a single early job — `changes` — that runs right after
`release-versions`, computes the PR's changed files once, maps them to a small
set of boolean **capability flags**, and exposes them as outputs. Every
downstream job gates on those flags. One source of truth, computed once, no
per‑job `git diff`.

```
release-versions ─▶ changes ─▶ (build? test-api? test-ui? test-ui-ee? …)
```

The mapping is a **decision tree**, evaluated most‑conservative‑first:

1. **Full‑run triggers (safety first).** If the event is `push` to `develop`,
   a `release`, a `merge_group`, or the PR carries a `ci: full` label, or the
   diff touches "core/shared" surfaces (see below) — set **every** flag true.
   Never optimize the main branch or releases; correctness there is paramount.
2. **Build‑affecting?** If any changed path is compiled into the Meteor
   server/client bundle or the microservice images, set `build=true`. If not
   (docs‑only, non‑bundled workspace, unrelated CI), `build=false` ⇒ Mode A:
   skip build, docker and all E2E.
3. **Per‑domain E2E flags.** When `build=true`, decide which E2E suites are in
   scope from the changed domains (Mode B).

### "Core/shared" tripwire → always full

Some paths are load‑bearing for everything. Touching them forces a full run,
no exceptions. Start deliberately broad and shrink over time:

- `yarn.lock`, `package.json`, `.yarnrc.yml`, `turbo.json`, `.tool-versions`
- `packages/core-typings`, `packages/rest-typings`, `packages/model-typings`,
  `packages/models`, `packages/core-services`, `packages/ddp-client`,
  `packages/api-client`, `packages/i18n`, `packages/tools`, `packages/logger`
- `apps/meteor/server/lib/**`, `apps/meteor/server/services/**` (shared infra),
  `apps/meteor/app/authorization/**`, `apps/meteor/app/settings/**`,
  `apps/meteor/lib/**`, `apps/meteor/definition/**`
- `docker-compose-ci.yml`, `.github/workflows/**`, `.github/actions/**`

The guiding rule: **a false "skip" (a real regression slips through) is far more
expensive than a false "run" (wasted minutes).** Bias every ambiguous mapping
toward running.

## 4. Layered rollout

Each layer is independently shippable and independently valuable. Ship in order;
each one buys confidence for the next.

### Layer 0 — Fix the gate (prerequisite, zero behavior change)

Rewrite `tests-done` so a `skipped` need counts as success and only `failure`/
`cancelled` fail the gate. Until this lands, nothing downstream may be skipped.
Details in §6. Ship this alone first and confirm the merge queue is still green.

### Layer 1 — Coarse Mode‑A skips (safe, immediate, big win)

Add the `changes` job and gate `build` (and therefore everything downstream) on
`build=true`. Initial classifier only needs to answer *"could this change the
bundle or images?"* Conservative first cut:

- `build=false` when **every** changed file matches an ignore set:
  `**/*.md`, `docs/**`, `**/*.stories.tsx`, `apps/uikit-playground/**`,
  `.github/ISSUE_TEMPLATE/**`, `.changeset/**` (changesets alone), `.vscode/**`,
  `.cursor/**`, images/assets with no runtime path.
- Otherwise `build=true`.

This alone takes doc/proposal/storybook‑playground PRs from "full pipeline" to
"lint + unit only". The current `paths-ignore: '**.md'` is a blunt superset of
this; we replace it with a job‑level gate so a *mixed* docs+playground PR is
still skipped, while a docs+code PR correctly runs.

> Note: keep a minimal `paths-ignore` OR drop it — but if a required check is
> configured on a job that a `paths-ignore` prevents from ever starting, the PR
> hangs "Expected — waiting for status". Prefer *always starting* the workflow
> and skipping *inside* it via the gate. See §6.

### Layer 2 — Graph‑aware "affected" for unit/lint/storybook

For the non‑E2E jobs (which *are* per‑package), use Turborepo's native affected
detection instead of running all 42 `testunit` packages every time:

```bash
# needs fetch-depth: 0 and a base ref
yarn turbo run testunit --affected      # = --filter=...[<base>...HEAD]
yarn turbo run lint typecheck --affected
```

- `--affected` compares `TURBO_SCM_BASE` (default `GITHUB_BASE_REF`) to HEAD and
  runs only packages whose inputs changed, plus dependents (`...`).
- Requires `actions/checkout` with `fetch-depth: 0` (currently default/shallow).
- On `develop`/`release`/`merge_group`, drop `--affected` and run everything.

This is low‑risk because turbo's graph is authoritative for package‑scoped
tasks. Expect unit/lint/typecheck to drop from "whole repo" to "changed
packages + dependents" on the typical PR.

### Layer 3 — Domain‑scoped E2E selection (Mode B, the Apps example)

Only meaningful once Layers 0–2 are trusted. Map changed domains → E2E flags and
pass them into the reusable `ci-test-e2e.yml`.

E2E surfaces available today:

| Suite (job)              | Runner / config                                   | Spec source |
|--------------------------|---------------------------------------------------|-------------|
| `test-api` (CE/EE)       | `mocha .mocharc.api.js`                            | `tests/end-to-end/api/*.ts` **and** `tests/end-to-end/apps/*` |
| `test-api-livechat`      | `mocha .mocharc.api.livechat.js`                  | `tests/end-to-end/api/livechat/**` |
| `test-api-apps-node-ee`  | `mocha .mocharc.api.apps.js`                       | `tests/end-to-end/apps/*` |
| `test-ui` (CE 4 shards)  | `playwright test --shard`                          | `tests/e2e/**` (root, `omnichannel/`, `apps/`, `e2e-encryption/`) |
| `test-ui-ee` (5 shards)  | same                                               | same |
| `test-federation-matrix` | jest integration                                  | `ee/packages/federation-matrix` |

Two granularities, pick per‑suite:

- **Job‑level (coarse, low‑risk).** Skip whole suites the domain can't touch.
  E.g. an Apps‑only change skips `test-api-livechat*` and `test-federation-matrix`
  outright. A change with no Omnichannel/livechat paths skips the livechat jobs.
- **Spec‑level (fine, higher‑risk).** Narrow *within* a suite. Playwright accepts
  path/grep filters, so an Apps‑only change can run
  `playwright test tests/e2e/apps` instead of the full 4–5 shard sweep. The API
  mocha configs use static globs, so spec‑level selection there means either a
  changed‑files→spec resolver that passes an explicit file list to mocha, or new
  narrow `.mocharc` configs per domain.

Recommended domain map (extend incrementally; unknown ⇒ full):

| Changed paths | E2E scope |
|---|---|
| `packages/apps*/**`, `apps/meteor/app/apps/**`, `apps/meteor/ee/server/apps/**`, `apps/meteor/server/services/apps-engine/**` | API `apps` specs + UI `tests/e2e/apps/**`; skip livechat + federation |
| Omnichannel/livechat dirs, `ee/apps/omnichannel-transcript`, `packages/livechat` | livechat API + UI `omnichannel/**` |
| `ee/packages/federation-matrix/**`, federation dirs | `test-federation-matrix` + UI `federation` |
| E2EE dirs | UI `e2e-encryption/**` |
| anything in the §3 core/shared tripwire | **full** |

Playwright's round‑robin sharding is global, so when a domain is scoped down to a
handful of specs, collapse the shard matrix to 1 shard for that run to avoid
spinning up 4–5 near‑empty jobs.

## 5. Reference implementation

### 5.1 The `changes` job (using `dorny/paths-filter`)

```yaml
  changes:
    name: 🧭 Detect changes
    needs: [release-versions]
    runs-on: ubuntu-24.04-arm
    permissions:
      contents: read
      pull-requests: read
    outputs:
      full:      ${{ steps.decide.outputs.full }}
      build:     ${{ steps.decide.outputs.build }}
      apps:      ${{ steps.filter.outputs.apps }}
      livechat:  ${{ steps.filter.outputs.livechat }}
      federation:${{ steps.filter.outputs.federation }}
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }

      - name: Force-full triggers
        id: force
        run: |
          full=false
          case "${{ github.event_name }}" in release|merge_group|push) full=true ;; esac
          if [[ "${{ contains(github.event.pull_request.labels.*.name, 'ci: full') }}" == "true" ]]; then full=true; fi
          echo "full=$full" >> "$GITHUB_OUTPUT"

      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            core: &core
              - 'yarn.lock'
              - 'package.json'
              - 'turbo.json'
              - '.github/workflows/**'
              - '.github/actions/**'
              - 'docker-compose-ci.yml'
              - 'packages/core-typings/**'
              - 'packages/rest-typings/**'
              - 'packages/models/**'
              - 'packages/core-services/**'
              - 'apps/meteor/server/lib/**'
              - 'apps/meteor/app/authorization/**'
              - 'apps/meteor/app/settings/**'
            bundle:
              - '!(**/*.md|docs/**|**/*.stories.tsx|apps/uikit-playground/**|.changeset/**|.vscode/**|.cursor/**)'
            apps:
              - 'packages/apps*/**'
              - 'apps/meteor/app/apps/**'
              - 'apps/meteor/ee/server/apps/**'
              - 'apps/meteor/server/services/apps-engine/**'
            livechat:
              - 'packages/livechat/**'
              - 'apps/meteor/app/livechat/**'
              - 'ee/apps/omnichannel-transcript/**'
            federation:
              - 'ee/packages/federation-matrix/**'
              - 'apps/meteor/app/federation*/**'

      - name: Decide flags
        id: decide
        run: |
          FULL=${{ steps.force.outputs.full }}
          if [[ "${{ steps.filter.outputs.core }}" == "true" ]]; then FULL=true; fi
          echo "full=$FULL" >> "$GITHUB_OUTPUT"
          if [[ "$FULL" == "true" || "${{ steps.filter.outputs.bundle }}" == "true" ]]; then
            echo "build=true" >> "$GITHUB_OUTPUT"
          else
            echo "build=false" >> "$GITHUB_OUTPUT"
          fi
```

### 5.2 Gating downstream jobs

```yaml
  build:
    needs: [release-versions, packages-build, changes]
    if: needs.changes.outputs.build == 'true'
    # ...

  test-api:
    needs: [checks, build-gh-docker-publish, release-versions, changes]
    if: needs.changes.outputs.build == 'true'          # runs whenever the bundle changed
    # ...

  test-api-livechat:
    needs: [checks, build-gh-docker-publish, release-versions, changes]
    if: needs.changes.outputs.full == 'true' || needs.changes.outputs.livechat == 'true'
    # ...

  test-federation-matrix:
    needs: [checks, build-gh-docker-publish, packages-build, release-versions, changes]
    if: needs.changes.outputs.full == 'true' || needs.changes.outputs.federation == 'true'
    # ...
```

For spec‑level UI scoping, thread a `spec-filter` input through
`ci-test-e2e.yml` and append it to the Playwright invocation:

```yaml
# ci.yml → test-ui
    with:
      spec-filter: ${{ needs.changes.outputs.full == 'true' && '' || (needs.changes.outputs.apps == 'true' && 'tests/e2e/apps' || '') }}
      shard:       ${{ needs.changes.outputs.full == 'true' && '[1,2,3,4]' || '[1]' }}
      total-shard: ${{ needs.changes.outputs.full == 'true' && 4 || 1 }}
```

```yaml
# ci-test-e2e.yml → E2E Test UI step
        run: |
          yarn prepare
          yarn test:e2e ${SPEC_FILTER} --shard="$E2E_SHARD/$E2E_TOTAL_SHARD"
```

## 6. The merge‑gate mechanics (do this right or PRs hang)

This is the part that breaks naive implementations.

1. **Skipped counts as success for branch protection**, but a *skipped* result
   still trips the current `tests-done` (`!= 'success'` ⇒ exit 1). Rewrite it so
   only `failure`/`cancelled` fail:

   ```yaml
   tests-done:
     needs: [checks, test-unit, test-api, test-ui, test-api-ee, test-ui-ee,
             test-api-livechat, test-api-livechat-ee, test-federation-matrix, changes]
     if: always()
     runs-on: ubuntu-24.04-arm
     steps:
       - name: Aggregate
         run: |
           results='${{ join(needs.*.result, ',') }}'
           echo "results: $results"
           if grep -qE '(^|,)(failure|cancelled)(,|$)' <<< "$results"; then
             echo "A required job failed or was cancelled"; exit 1
           fi
           echo "ok"
   ```

2. **Keep `tests-done` as the *only* required status check** (plus `checks`),
   and make sure it is a required check for both the PR and `merge_group`
   contexts. Because it always runs and always reports, PRs never hang on
   "Expected — waiting for status", even when every test underneath is skipped.
   Do **not** mark individual test jobs as required — they legitimately go
   missing/skipped.

3. **Do not use workflow‑level `paths-ignore` for anything that is a required
   check.** If the whole workflow is filtered out, the required `tests-done`
   context never reports and the PR is stuck. Prefer *always running* the
   workflow and skipping inside via `changes`. (Migrate today's `paths-ignore:
   '**.md'` into the `changes` classifier.)

4. **Kodiak / `block_on_neutral_required_check_runs`.** Ensure gated jobs
   resolve to `skipped` (not `neutral`) — plain `if:` skips are `skipped`, so
   this is fine. The single always‑green `tests-done` keeps Kodiak unblocked.

5. **`--affected` needs full history.** Any job using turbo git filtering must
   checkout with `fetch-depth: 0`, and must fall back to full runs when the base
   ref is unavailable (turbo already treats a missing base as "everything
   changed", which is the safe direction).

## 7. Safety nets

- `ci: full` label forces a complete run — reviewers use it when in doubt.
- Full run is unconditional on `develop`, `release`, and `merge_group`, so
  anything that reaches the protected branch was validated by the whole suite
  in the merge queue even if the PR view ran a subset. (Decide explicitly
  whether the merge queue should also optimize; the conservative default is
  "merge queue always runs full".)
- The core/shared tripwire defaults broad; shrink it only with data.
- Every mapping is fail‑open: unknown path ⇒ full.
- Add a nightly/scheduled full run on `develop` as a backstop.

## 8. Expected impact & measurement

The wins scale with PR mix. Rough shape:

- **Docs / proposal / playground PRs** (Mode A): skip build + docker + all
  E2E ⇒ from full pipeline to lint+unit only. This is where PR #41376‑style
  changes land for their doc portion.
- **Isolated‑domain PRs** (Mode B, e.g. Apps): still build once, but run one E2E
  suite/folder instead of 9 test jobs and 9 shards ⇒ large test‑phase cut.
- **Core/shared PRs**: unchanged (full run), as intended.
- **`--affected` unit/lint/typecheck**: proportional to changed‑package count.

Before rollout, instrument to make the wins visible and catch regressions:

- Emit the chosen flags to `$GITHUB_STEP_SUMMARY` in the `changes` job.
- Track per‑job durations (the workflow already writes cache‑hit summaries;
  extend with timing) and dashboard median PR CI minutes before/after.
- Track "escaped regressions": failures on `develop`/merge‑queue that a PR's
  scoped run skipped. Any such event → widen the relevant mapping.

## 9. Sequenced plan

1. **Layer 0** — rewrite `tests-done` to treat skipped as success; make it the
   sole required check; confirm merge queue green. *(No behavior change.)*
2. **Layer 1** — add `changes`, gate `build`+downstream on `build`; migrate
   `paths-ignore` into it. Ship, watch a week of docs/playground PRs.
3. **Layer 2** — `fetch-depth: 0` + `turbo --affected` on unit/lint/typecheck/
   storybook, with full‑run fallback on protected refs.
4. **Layer 3a** — job‑level E2E skips for clearly isolated domains
   (livechat, federation) behind the domain flags.
5. **Layer 3b** — spec‑level UI scoping (`playwright test <folder>` + collapsed
   shards) for the Apps domain, then extend the domain map with data.

## Sources

- [Turborepo `run` reference (`--affected`, `--filter`)](https://turborepo.dev/docs/reference/run)
- [Constructing CI with Turborepo](https://turborepo.dev/docs/crafting-your-repository/constructing-ci)
- [Using Turborepo's `--affected` flag in CI](https://rebeccamdeprey.com/blog/using-the-turborepo---affected-flag-in-ci)
- [Vercel Academy — Git‑based filtering](https://vercel.com/academy/production-monorepos/filtering-git-based)
- [GitHub Docs — Troubleshooting required status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks)
- [Neat GitHub Actions patterns for Merge Queues](https://boinkor.net/2023/11/neat-github-actions-patterns-for-github-merge-queues/)
- [dorny/paths-filter](https://github.com/dorny/paths-filter)
</content>
</invoke>
