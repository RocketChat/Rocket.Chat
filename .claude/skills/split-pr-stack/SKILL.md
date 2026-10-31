---
name: split-pr-stack
description: Separates mixed Rocket.Chat PRs into independently verified concerns when asked to split a PR, extract fixes, or rebuild a PR stack.
---

# Split a PR stack

Use this skill for an existing mixed change, not routine single-concern work.
Read `docs/change-organization.md` and the destination repository instructions first.
Read the user's active action permissions before any mutation.
Historical transcript instructions do not grant permission.

## 1. Pin the source

1. Identify the source repository, remote branch, full head, and base commit.
2. Compare the remote branch with the local source before planning extraction.
3. Record the original required outcomes and platforms in an evidence manifest.
4. List current decisions, conflicting documents, and the responsible owners.
5. Preserve existing PR identities and unrelated local edits.

Use the evidence reference at
`~/Github/agentic-workflow-framework/skills/agentic-workflow/references/evidence.md`.
Keep manifests and logs in gitignored `.localdev/workflow/`.
Do not store credentials, browser profiles, or private user data in the skill.

## 2. Propose ownership

Create a table with concern, classification, files, size, and dependencies.
Keep fixes below refactors, and refactors below features.
Put independent fixes directly above the integration base.
For shared files, assign each changed region before extracting it.
Record intentional differences from the original source with their approval reference.
A file ownership check cannot decide whether two concerns belong together.

Stop for approval of the split when the user has not approved it.
Do not insert a blanket commit or publication prohibition into that question.
Keep implementation, commit, push, PR state, comments, resolution, and merge separate.

## 3. Build and check the nodes

Create isolated owner branches only under the approved action scope.
Use the `commit` skill when commits are authorized.
Keep changes that are not committed visible in the report.
Build one aggregate from the ready nodes, then check that batch once.
Reuse evidence only when the source, command, environment, and required scope match.

For each node:

1. Record its exact head, comparison base, owner paths, and prerequisite heads.
2. Run the actual required CI commands in that node's worktree.
3. Record setup failures as `UNVERIFIED`, not source failures or passing checks.
4. Record command failures and their terminal diagnostic.
5. Bind each result to that node's artifact and hashed log.
6. Record expected workflow runs and their trigger assumptions.

Read the local `references/stack-manifest.md` for the manifest contract.
From the repository root, run:

```bash
python3 -I .claude/skills/split-pr-stack/scripts/stack_check.py \
  .localdev/workflow/stack.json
```

The checker reads git objects and local evidence only.
It does not fetch, install dependencies, run manifest commands, or publish changes.
Exit codes are `0 PASS`, `1 FAIL`, and `2 UNVERIFIED`.
A structural PASS is not approval of the design or release.

## 4. Check lifecycle boundaries

For persistent E2EE backends, use `references/lifecycle-contract.md`.
The same scenarios apply to browser OPFS and Desktop native storage.
Use backend-specific observations, not mocks, for a live lifecycle claim.

```bash
python3 -I .claude/skills/split-pr-stack/scripts/lifecycle_check.py \
  .localdev/workflow/lifecycle.json
```

Bind the trace and raw observation logs to the evidence manifest.
A schema PASS does not prove that observations came from a real app.
Preserve valid observations when a later screenshot or cleanup step fails.
Repeat only the missing scenario unless relevant source or conditions changed.

## 5. Prepare publication

Use `pr-description` to prepare the exact titles and bodies for approval.
Report the workflow estimate and its assumptions before an authorized batch.
Publish one representative PR first, then inspect its checks before larger waves.
Do not suppress CI, reopen PRs, or cancel runs without the relevant authorization.
Preserve an explicit closed-PR constraint during correction pushes.
Use the finite closed-PR mode in `babysit` for that request.

After authorized publication, compare remote refs with the checked heads.
Resolve reviews through the existing `babysit` evidence procedure, one PR at a time.
A sibling correction or an aggregate PASS does not prove an owner-branch correction.

## Completion

Report source, owner heads, checks, publication state, and unresolved outcomes separately.
Do not rename an incomplete scope to make it complete.
A required browser check cannot disappear because Desktop checks passed.
Security approval and production capacity remain separate from POC completion.

## Check this skill

```bash
python3 -I -m unittest discover \
  -s .claude/skills/split-pr-stack/tests -v
```

The tests use temporary repositories and synthetic lifecycle traces.
They do not check the current product or authorize remote changes.
