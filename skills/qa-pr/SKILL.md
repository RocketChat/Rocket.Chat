---
name: qa-pr
description: Use when the user wants a QA-style review of a Rocket.Chat branch, pull request, or diff range; inspect the change like a QA engineer, prioritize user-visible regressions, validate likely failures with targeted checks, and report confirmed bugs before summaries.
---

# QA PR Review

Use this workflow when you want a QA-style pass on the current branch or a pull request. Act like a pragmatic QA engineer: hunt for bugs a user could notice, hit, or be blocked by. Do not stop at summarizing the diff.

## Quick start

1. Lock the comparison range.
2. Classify the risky surfaces touched by the PR.
3. Turn risky changes into concrete bug hypotheses.
4. Validate each hypothesis with the smallest useful proof.
5. Report only confirmed bugs, strong suspicions, and targeted test suggestions.

## Task framing

When asked to review a branch or PR from a QA perspective:

- treat the task as bug-finding, not diff summarization
- prioritize user-visible regressions and broken workflows
- validate with the smallest useful proof available
- report confirmed bugs first, then strong suspicions, then targeted test suggestions if no bug is confirmed

## Mandatory rules

Apply every rule to every finding before it goes in the report. A finding that skipped one is not reportable.

1. **Check intent.** Read the PR's description ("Proposed changes", "Steps to test", "Further comments"), its `.changeset/*.md`, the linked Jira task, and the documentation for the feature (`docs/features/`, docs.rocket.chat). If any of them describes the observed behavior, it is an intentional change, not a bug. Add a UX note if the result is still rough for users.
2. **Confirm at runtime.** Reproduce on both the base branch and the PR with human-like input (typing and clicking as a user would, at normal speed, not only filling fields or calling APIs directly). A finding backed only by code stays `suspected`.
3. **Rule out the environment.** Run the base and the PR with the same edition, licence and settings before reporting. Many apparent bugs are an enterprise feature without a licence, a different default setting, or a licence module that one side has and the other does not.
4. **Separate existing bugs.** A bug that reproduces identically on the base branch is an existing bug. If the PR makes it more frequent, broader, or more severe, report that change as a PR regression and note the baseline behavior.

## Comparison range

Default to the current branch against its merge base with the default branch unless the user gave a base branch, diff range, or PR number.

Recommended commands:

```bash
git branch --show-current
git remote show origin | sed -n '/HEAD branch/s/.*: //p'
git merge-base HEAD origin/<base>
git diff --stat <merge-base>..HEAD
git log --first-parent --reverse --oneline <merge-base>..HEAD
```

If the user gave a PR number and remote metadata is available, use the PR base and head explicitly.

## What to optimize for

Prioritize:

- user-visible bugs
- broken workflows
- validation mistakes
- missing permissions or feature-flag handling
- rendering regressions
- state, async, or loading regressions
- API contract mismatches that break the UI or integration path

Do not report:

- pure refactors with no observable behavior change
- style-only issues unless they block use or accessibility
- speculative bugs with no concrete path to failure
- intentional product changes unless the user wants them called out

## Rocket.Chat risk map

Start here first when these paths are touched:

- `apps/meteor/client/`
- `apps/meteor/app/`
- `apps/meteor/server/`
- `apps/meteor/ee/`
- `packages/`

Pay extra attention to:

- forms, validation, and save flows
- authentication, authorization, and permissions
- navigation, routing, and deep links
- message rendering, uploads, previews, or composer flows
- settings, toggles, feature flags, and enterprise-only branches
- loading states, optimistic updates, retries, and error handling
- shared helpers whose behavior fans out to many screens

## Investigation flow

### 1. Scan strategically

Prefer targeted reading over broad reading.

Recommended commands:

```bash
git diff --name-only <merge-base>..HEAD
git diff --diff-filter=D --name-status <merge-base>..HEAD
git show --stat --summary <commit>
git show <commit> -- <path>
rg -n "onBlur|onChange|disabled=|useEffect|useMemo|useCallback|Promise\\.all|await |try \\{|catch \\(|feature flag|permission|can[A-Z]" .
```

Review commit by commit when the PR is non-trivial. Classify each commit as:

- checked, no bug found
- confirmed bug
- suspected bug
- existing bug (also on the base branch, not caused by this PR)
- intentional change

Do not claim a full QA pass unless the whole requested range was checked.

### 2. Turn code signals into hypotheses

Write concrete, falsifiable bug hypotheses before testing them.

Examples:

- "Submitting profile changes now fails when the field is unchanged because validation moved from blur-time to submit-time."
- "The composer attachment flow can get stuck because a new disabled state is never cleared on API error."
- "A permission gate now hides an action for valid roles because the fallback branch was removed."

High-yield bug patterns:

- deleted guards or fallback branches
- changed default values
- new required props or parameters without all call sites updated
- server response shape changes without UI updates
- state derived from stale closures or incomplete effect dependencies
- loading spinners, disabled buttons, or optimistic state that never resets
- feature-flag or edition checks that skip a previously valid path
- helper or library migrations with slightly different semantics

### 3. Validate with the smallest proof

Use the cheapest proof that can support or reject the hypothesis:

1. existing automated tests
2. targeted unit or integration tests
3. local app flow or UI repro
4. API repro
5. code-path proof when runtime setup is impractical; a finding backed only by code is `suspected`, never `confirmed`

Whatever the proof, apply the [mandatory rules](#mandatory-rules) before reporting: intent, runtime on both sides, same environment, existing-bug check.

Useful commands:

```bash
git diff <merge-base>..HEAD -- <path>
git log --oneline <merge-base>..HEAD -- <path>
git show <merge-base>:<path>
gh pr view <number> --json body,files -q '.body'
git diff <merge-base>..HEAD -- '.changeset/*.md'
```

Validation guidance:

- Prefer targeted test commands over whole-repo suites.
- If no relevant test exists, say that clearly and propose the smallest missing check.
- Use manual repro steps when the issue is primarily UX or workflow-visible.
- Use code-only proof only when runtime validation is too expensive for the task.

## Reproduction standard

Bug reports must be:

- concrete
- minimal
- repeatable
- written from the user's perspective

Good:

1. Open the room composer.
2. Add an attachment.
3. Force the upload API to fail.
4. Observe that the send button remains disabled after the error toast.

Bad:

- "Test attachments"
- "See if the composer still works"

## Reporting format

Use this structure:

```markdown
## [Bug Title]

**Status**: confirmed | suspected
**Impact**: [Who is affected and why it matters]

**Steps to reproduce**:
1. ...
2. ...
3. ...

**Expected**: ...
**Actual**: ...

**Evidence**:
- [test failure, code path, local repro, or API proof]

**Root cause**: commit `[sha]` / PR #[number if known]
- [behavior-changing code change]
- [relevant files]

**Intent check**: [PR / changeset / Jira task / docs reviewed; behavior not documented as intended]
**Base check**: [base branch result with the same edition, licence and settings]
```

List existing bugs found along the way after the PR's own bugs:

```markdown
## Existing bugs (not caused by this PR)

### [Bug title]

**Repro**: [one-line repro]
**Intent check**: [PR / changeset / Jira task / docs reviewed; behavior not documented as intended]
**Base check**: also on [base branch / version]
**Environment**: [edition, licence and settings, matched on both sides]
**Jira**: [key or "not filed yet"]
```

If no bug is confirmed, use:

```markdown
## No confirmed bugs found

**Highest-risk areas checked**:
- ...

**Targeted tests to run**:
- ...

**Manual QA still recommended**:
1. ...
2. ...
```

## Output bar

- Prefer one strong confirmed bug over five weak suspicions.
- Use `confirmed` only after reproducing at runtime on the PR and checking that the base branch, run with the same edition, licence and settings, does not fail.
- Use `suspected` when the risk is real but validation is incomplete, including every finding backed only by code.
- Never report a behavior the PR, changeset, Jira task or documentation describes as intended as a bug.
- Always include why the bug matters to a user, not just why the code looks wrong.
