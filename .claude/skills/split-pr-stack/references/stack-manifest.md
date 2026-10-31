# Stack preflight contract

The manifest is local working state, not an executable plan.
The checker never executes `required_commands` or changes a branch.
Use JSON with `version: 1`.

## Pinned source

- `repository`: absolute path to the git repository root.
- `base`: full commit ID of the common integration base.
- `source`: full commit ID of the original mixed change.
- `aggregate`: full commit ID containing every proposed node.
- `ownership`: changed repository paths mapped to nonempty arrays of node IDs.
- `parity_exceptions`: paths mapped to `reason` and `approval_source`.

Ownership must cover exactly the union of source and aggregate changes.
Each node's base-to-head diff must equal its declared owner paths.
Shared paths can have several owners when dependent nodes change the same file.
The human review must still check line-level ownership and concern boundaries.
Every node must be an ancestor of the aggregate.
Compare each committed file's mode and object ID with the source.
Record every intentional difference and remove stale exceptions.
Private workflow state, knowledge caches, and dependencies cannot belong to a PR.

## Nodes

Each object in `nodes` has these fields:

- `id`: unique nonempty identifier.
- `classification`: `fix`, `refactor`, `feature`, `test`, `chore`, or `ci`.
- `concern`: one plain-language purpose.
- `branch`: full local ref, such as `refs/heads/fix/search-cursor`.
- `base`: full comparison commit, either the root base or a prerequisite head.
- `head`: full commit ID that must still match the branch.
- `dependencies`: IDs of required nodes.
- `required_commands`: exact command objects with `argv` arrays and absolute `cwd` values.
- `estimated_workflow_runs`: nonnegative integer, including relevant push and PR triggers.
- `evidence`: optional absolute path to an evidence manifest.
- `evidence_sha256`: content hash of that manifest, required when evidence exists.
- `worktree`: absolute path to the checked node's worktree, required when evidence exists.

A required command must match a passing matrix row's argument array and working directory exactly.
The evidence repository must match the node's worktree, base, and head.
Publication evidence cannot describe uncommitted changes.
It must fingerprint all tracked node inputs, not only the files changed by that PR.
Use the repository root as the evidence source scope.
Keep generated logs and manifests outside that input set or in ignored workflow state.
The framework checker also checks source fingerprints, environment, logs, and required scenarios.

Missing evidence produces `UNVERIFIED`, not PASS.
A failed evidence check produces FAIL.
The evidence contract lives in the framework's `references/evidence.md`.
Do not reuse an aggregate result as an isolated node result.

## CI inventory and waves

The `ci` object has these fields:

- `workflow_hashes`: every workflow path at the pinned base, mapped to its SHA-256 content hash.
- `waves`: nonempty arrays of node IDs, each node appearing exactly once.
- `estimate_basis`: trigger assumptions and the source of the workflow estimate.

Start with one representative node.
A node's dependencies must appear in earlier waves.
The checker reports estimated workflow counts per wave and overall.
It does not evaluate GitHub expressions, path filters, matrices, reusable workflows, or billing.
Review the estimate against current workflow definitions before publication.
An unchanged workflow hash does not prove that the estimate is correct.
Workflow changes within the stack require an updated publication assessment.

## Failure interpretation

- A changed branch, missing prerequisite, ownership gap, or unexplained parity difference is `FAIL`.
- Missing or stale verification is not a passing publication gate.
- An installation failure does not establish a source failure.
- Missing workspace output does not establish that a feature module is correct.
- A partial lint command cannot substitute for the required CI command.

Inspect the terminal error before assigning a failed check to source or infrastructure.
Use `rocketchat-ci-triage` when available, or inspect the job's actual logs.
Do not disable checks or hide failures to permit publication.

## Existing tools and reuse

The checker extracts the reusable parts of the E2EE ownership and shipping audits:

- Exact source and comparison heads.
- Declared ownership compared with real git diffs.
- Source-to-aggregate parity.
- Required prerequisites in the final aggregate.
- Node-specific verification rather than one aggregate result.

It removes the old scripts' hardcoded PR numbers, worktree paths, and side-effectful output writes.
Keep one-time migration details in the local manifest, not in this skill.
