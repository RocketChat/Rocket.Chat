# E2E performance migration

Rollout plan for applying the two performance patterns landed in PR #39691 across the rest of the Playwright E2E suite. The patterns themselves (benefits, anti-patterns, template, helper catalog, per-file recipe) live in [`apps/meteor/tests/e2e/README.md`](../../apps/meteor/tests/e2e/README.md#performance-patterns). This document is only about *how we roll them out*.

Intended audience: contributors and AI agents who pick up migration work. Each phase is written to be actionable without additional context.

## Current state (baseline)

Measured on `develop` at the time of writing:

- 152 spec files under `apps/meteor/tests/e2e/`.
- 43 files already use `test.describe.serial` — primary candidates for Pattern 2 (shared browser context).
- At least 23 files invoke `poHomeChannel.content.sendMessage` inside setup blocks — primary candidates for Pattern 1 (API-driven seeding).
- Reference data point: `quote-messages.spec.ts` went from ~80s to ~10s in CI after both patterns were applied (PR #39691).

## Success criteria

A migrated suite is considered done when:

1. All setup that does not verify behavior goes through REST helpers.
2. If the suite is `.serial`, the browser context is created once in `beforeAll` and torn down in `afterAll`.
3. Median per-test time in CI drops by at least 30% relative to the pre-migration baseline, or the PR body explains why it did not.
4. No coverage regression: every behavior asserted before the migration is still asserted after (explicitly listed when tests are consolidated).

The project-level target is **p50 < 3s per test** per file. Files above that after migration need a justification in their PR.

## Phase 0 — consolidate helpers

Must land before Phase 2 starts. Blocks nothing else.

Current helpers live in `apps/meteor/tests/e2e/utils/create-target-channel.ts` (mixed responsibilities) and `apps/meteor/tests/e2e/utils/sendMessage.ts` (one function, not re-exported). The new helpers from PR #39691 (`sendMessage`, `createDiscussion`, `createDirectMessageRoom`) sit in `create-target-channel.ts` for historical reasons — they should be moved out.

Deliverables:

1. Split `create-target-channel.ts` into one file per concern:
   - `channels.ts` (public channels)
   - `groups.ts` (private channels and groups)
   - `teams.ts`
   - `direct-messages.ts` (`createDirectMessage`, `createDirectMessageRoom`)
   - `discussions.ts` (`createTargetDiscussion`, `createDiscussion`)
   - `messages.ts` (`sendMessage`, `sendTargetChannelMessage`, `sendMessageFromUser`)
   - `rooms.ts` (`deleteRoom`, `deleteChannel`, `deleteTeam`)
2. Unify `sendMessage` and `sendMessageFromUser` into a single function with an options bag: `sendMessage(api, roomId, msg, { threadId?, asUser? })`. Remove the duplicated code path.
3. Re-export everything from `utils/index.ts` so specs never need deeper imports.
4. Add helpers the migration is known to need but that are missing today:
   - `createThreadReply(api, roomId, parentMsgId, msg)`
   - `inviteUsersToRoom(api, roomId, usernames)`
   - `setRoomTopic(api, roomId, topic)` (used in ~6 specs via UI today)
5. Update the helper table in `apps/meteor/tests/e2e/README.md` to reflect the new import surface.

Definition of done: no existing spec broken, no new spec needs to reach past `from './utils'` to seed state.

## Phase 1 — triage

One-shot audit that produces the ordered worklist for Phase 2.

Deliverable: [`docs/proposals/e2e-migration-triage.md`](./e2e-migration-triage.md) — markdown table with one row per spec file, columns:

- `path`
- `is_serial` (boolean)
- `ui_setup_hits` — count of `content.sendMessage`, `openLastMessageMenu`, `btnCreateDiscussionModal`, `btnCreateChannel`, `btnCreateDirectMessage` occurrences inside `beforeAll` / `beforeEach` and within setup-only `test.step`s
- `ci_median_ms` — last known median from the Playwright report
- `priority_score` — `ci_median_ms * (is_serial + ui_setup_hits)`
- `opt_out_reason` — non-empty if the spec is one of the "do not migrate" cases (see below)

Do-not-migrate list (mark `opt_out_reason`):

- Suites whose subject *is* the setup UI: `create-channel.spec.ts`, `create-direct.spec.ts`, `create-discussion.spec.ts`, `channel-management.spec.ts` (for create flows).
- Auth / session suites: `account-login.spec.ts`, `account-forgetSessionOnWindowClose.spec.ts`, `account-manage-devices.spec.ts`, `enforce-2FA.spec.ts`.
- Federation suite (separate concerns, already covered in `e2e/federation/README.md`).

The audit is produced by [`apps/meteor/tests/e2e/scripts/e2e-triage.mts`](../../apps/meteor/tests/e2e/scripts/e2e-triage.mts). Re-run it (`node --experimental-strip-types apps/meteor/tests/e2e/scripts/e2e-triage.mts`) whenever the spec surface changes or a new Playwright report is landed, and commit the regenerated table.

## Phase 2 — migrate in batches

Rules:

- **Maximum 5 spec files per PR.** Keeps review tractable and preserves bisect granularity.
- Pick files off the triage list in `priority_score` order.
- PRs are independent — no cross-PR dependencies beyond Phase 0.

Per-file recipe is in the README ([Migrating an existing suite](../../apps/meteor/tests/e2e/README.md#migrating-an-existing-suite)). Do not duplicate it here.

Required PR body template for Phase 2:

```markdown
## E2E migration — batch N

### Files
- apps/meteor/tests/e2e/<file-1>.spec.ts
- ...

### Per-file impact
| File | Tests | p50 before (ms) | p50 after (ms) | Δ |
|------|------:|----------------:|---------------:|--:|
| ... | ... | ... | ... | ... |

### Patterns applied
- [ ] Pattern 1 — API seeding
- [ ] Pattern 2 — shared browser context

### Consolidated tests
(list merged tests and confirm each original assertion is still covered — omit if none)

### Not applied
(reason for any pattern not applied on any file)
```

If any file in the batch regresses or stays flat, split that file out into its own PR with a written justification.

## Phase 3 — guardrails

Prevents regression after Phase 2 completes. Can land in parallel with Phase 2.

1. **Doc guardrail** — already in place via README "Anti-patterns to flag in review". Link to it from `.github/pull_request_template.md` under the E2E section.
2. **Lint guardrail (optional)** — a custom ESLint rule or a grep-based CI check that fails when a spec file:
   - Uses `poHomeChannel.content.sendMessage` inside `test.beforeEach` or `test.beforeAll`.
   - Declares `test.describe.serial` together with `beforeEach(async ({ page }) => { await page.goto(...) })`.
   Both are strong signals of missed Pattern 1 / Pattern 2 opportunities.
3. **Timing guardrail** — add a weekly GitHub Action (or extend an existing one) that parses the Playwright report from main and posts a list of spec files with p50 > 3s/test. Recurring offenders become Phase 2 candidates.

## Picking up the work

For contributors:

1. Skim `apps/meteor/tests/e2e/README.md#performance-patterns` and the template.
2. Pick the top unmigrated row from the triage file.
3. Follow the per-file recipe. Open a PR with the template above.
4. One PR = at most 5 files. No exceptions.

For AI agents:

- The per-file recipe is deterministic enough to run end-to-end. The two decisions that require judgement are: whether to apply Pattern 2 (check the preconditions listed in the README), and whether to consolidate tests (requires reading assertions carefully).
- Always run the suite before and after, paste both timings in the PR.
- When adding a helper, update the README table in the same PR.
- Do not migrate files in the do-not-migrate list from Phase 1. If you think one should be removed from that list, raise it in the PR body instead of silently migrating.

## Open questions

- Should timing guardrails block CI (fail the build) or only report? Lean report-only initially.
- How do we measure p50 reliably across runners of different capacity? Current suggestion is median-of-three on a dedicated runner; needs confirmation from infra.
- Do we want per-feature area ownership for Phase 2 batches, or first-come-first-serve?
