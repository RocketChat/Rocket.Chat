---
name: release-qa-regression
description: Use when the user wants a Rocket.Chat release QA regression pass across releases, release candidates, release branches, or large release PRs; compare a target against a known-good baseline, validate user-visible regressions, and identify the introducing PR or commit.
---

# Release QA Regression

Use this workflow during Rocket.Chat release work to investigate regressions between releases, release candidates, release branches, or large PRs. Find real user-facing regressions. Focus on behavior changes users can notice, hit, or be blocked by. Do not summarize diffs for their own sake.

## Quick start

1. Lock the exact comparison range.
2. Scan high-risk client-side changes first.
3. Turn promising diffs into concrete regression candidates.
4. Validate each candidate against the baseline.
5. Report only findings with a credible repro and root-cause PR or commit.

## Task framing

When asked to investigate release regressions:

- treat the task as regression-finding, not diff summarization
- compare the target against a known-good baseline
- prioritize user-visible and workflow-visible regressions
- validate with the smallest useful proof available
- report confirmed regressions first, then strong suspicions, then targeted follow-up checks if no regression is confirmed
- identify the introducing PR or commit whenever possible

## Comparison range

Use the exact release range the user gave. If the baseline is missing, infer the closest stable baseline and state the assumption.

Recommended commands:

```bash
git tag --list | sort -V
git log --oneline --no-merges <baseline>..<target> -- apps/meteor/client
git diff --stat <baseline>..<target> -- apps/meteor/client
```

## High-yield areas

Start here first:

- `apps/meteor/client/`
- `apps/meteor/client/views/`
- `apps/meteor/client/components/`
- `apps/meteor/client/hooks/`

Most likely regression sources:

- date, time, locale, timezone, and formatting migrations
- form rewrites, validation changes, and accessibility updates
- message rendering, attachments, uploads, previews, and composer
- omnichannel, account/profile, contextual bar, and room navigation
- new helper utilities replacing older library behavior
- snapshot-heavy PRs with changed rendered output

## What counts as a regression

Treat a change as a confirmed regression only when:

- the behavior worked in the baseline release or prior implementation
- the target release is broken, misleading, degraded, or materially less usable
- the change is user-visible, workflow-visible, accessibility-visible, or output-visible
- there is a concrete code path or introducing PR or commit behind it

Do not report:

- pure refactors with no observable behavior change
- weak code-only suspicions presented as confirmed runtime failures
- intentional product changes unless the user explicitly wants them included
- duplicates unless they add clearly new user-facing scope

## Investigation flow

### 1. Scan strategically

Prefer targeted diffs over broad reading.

Recommended commands:

```bash
git diff --name-only <baseline>..<target> -- apps/meteor/client
git diff --diff-filter=D --name-status <baseline>..<target> -- apps/meteor/client
rg -n "moment|date-fns|supportedValuesOf|onBlur|formatDistance|formatDuration|new URL\\(" apps/meteor/client
```

Look for:

- deleted render branches
- removed actions or entry points
- new validation gates
- new disabled states
- snapshot text changes
- library migrations with slightly different semantics

Review the release commit by commit, not just high-risk diffs.

1. Lock the exact range.
2. Check each commit one by one.
3. For each commit, inspect changed files and classify it before moving on.

Use:

```bash
git log --first-parent --reverse --oneline --no-merges <baseline>..<target>
git diff-tree --no-commit-id --name-only -r <commit>
git show --stat --summary <commit>
git show <commit> -- <path>
```

For each commit, mark one:

- confirmed regression
- checked, no regression found
- intentional change

Do not claim a full pass unless every commit in the release range was classified. If relevant, check post-release commits on the release branch separately too.

### 2. Validate before reporting

For each candidate:

1. Confirm the old behavior in the baseline.
2. Confirm the new behavior in the target.
3. Explain the user-facing impact.
4. Identify the introducing PR or commit.

Useful commands:

```bash
git show <baseline>:<path>
git diff <baseline>..<target> -- <path>
git log --oneline --no-merges <baseline>..<target> -- <path>
git show --stat --summary <commit>
```

Use quick local checks when useful:

- small `node` snippets to compare old and new formatter behavior
- snapshot review as a signal, not proof
- following the render path to the final displayed component

### 3. Reproduce with the smallest scenario

Use the simplest proof that demonstrates the regression:

1. UI repro, if the UI exposes the affected path
2. API repro, if the UI does not expose it cleanly
3. database verification for data integrity issues
4. code-only proof only when runtime setup is impractical

For database checks, keep queries read-only unless cleanup was explicitly requested.

## Reproduction standard

Repro steps must be:

- concrete
- minimal
- repeatable
- written from the user's perspective

Good:

1. Open `My Account > Profile`.
2. Paste `/avatar/%40alice` into the avatar URL field.
3. Click add URL.
4. Observe that the URL is rejected as invalid.

Bad:

- "Test avatar URLs"
- "Check if upload still works"

## Root cause standard

Each confirmed regression should name:

- introducing PR number if available
- commit SHA
- file path(s) that changed the behavior

A strong root-cause explanation states:

- what changed
- why that changed runtime behavior
- why the baseline did not fail the same way

## Reporting format

Use this structure:

```markdown
## [Regression Title]

**Impact**: [Who is affected and why it matters]

**Steps to reproduce**:
1. ...
2. ...
3. ...

**Expected**: ...
**Actual**: ...

**Root cause**: PR #[number] / commit `[sha]`
- [Behavior-changing code change]
- [Relevant files]
```

## Output bar

- Prefer a short list of strong findings over a long list of speculative ones.
- Use `confirmed` only after reproduction or equivalent proof.
- Use `suspected` when the code signal is strong but runtime validation is incomplete.
- Optimize for precision, reproducibility, and debuggability.
