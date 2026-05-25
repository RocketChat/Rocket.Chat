# Amazon DocumentDB Compatibility

This document describes the changes made to ensure compatibility with Amazon DocumentDB, which has several differences from MongoDB in terms of supported operators and features.

## Environment Variable

Set the `DOCUMENTDB` environment variable to `true` to enable DocumentDB compatibility mode:

```bash
DOCUMENTDB=true
```

When enabled, this flag adjusts query behavior to avoid unsupported features in Amazon DocumentDB.

## Changes Overview

### 1. `allowDiskUse` option removal

**Problem:** Amazon DocumentDB does not support the `allowDiskUse` option for the `find` command. For aggregation pipelines, DocumentDB uses sort merge by default, making `allowDiskUse` unnecessary.

**Solution:** The `getAllowDiskUse()` utility function (in `packages/models/src/allowDiskUse.ts`) returns `{ allowDiskUse: true }` when running on MongoDB and `{}` (empty object, effectively omitting the option) when `DOCUMENTDB=true`. Usage is via spread: `{ ...getAllowDiskUse(), ...otherOptions }` or passed directly as the options argument: `aggregate(pipeline, getAllowDiskUse())`.

**Affected files:**
- `packages/models/src/models/Analytics.ts`
- `packages/models/src/models/LivechatAgentActivity.ts`
- `packages/models/src/models/LivechatContacts.ts`
- `packages/models/src/models/LivechatRooms.ts`
- `packages/models/src/models/Messages.ts`
- `packages/models/src/models/ModerationReports.ts`
- `packages/models/src/models/Rooms.ts`
- `packages/models/src/models/Sessions.ts`
- `apps/meteor/app/api/server/lib/users.ts`
- `apps/meteor/ee/server/api/abac/index.ts`
- `apps/meteor/ee/server/api/audit.ts`
- `apps/meteor/ee/server/models/raw/Users.ts`
- `apps/meteor/server/lib/findUsersOfRoomOrderedByRole.ts`

**Reference:** [Amazon DocumentDB - allowDiskUse](https://docs.aws.amazon.com/documentdb/latest/developerguide/how-it-works.html)

### 2. `$lookup` with `let` / pipeline subqueries

**Problem:** Amazon DocumentDB does not support `$lookup` stages that use `let` and `pipeline` (correlated subqueries). Only the basic `$lookup` form (`localField` / `foreignField`) is supported.

**Solution:** Replaced pipeline-based `$lookup` stages with the basic `localField` / `foreignField` form, followed by additional pipeline stages (`$unwind`, `$match`, `$project`) to achieve equivalent results.

**Affected files:**
- `packages/models/src/models/LivechatRooms.ts`
- `packages/models/src/models/Rooms.ts` (findChildrenOfTeam)
- `packages/models/src/models/Subscriptions.ts` (findConnectedUsersExcept)
- `packages/models/src/models/Users.ts` (getNextLeastBusyAgent, getLastAvailableAgentRouted)
- `apps/meteor/ee/server/models/raw/Users.ts` (getUnavailableAgents)
- `apps/meteor/server/lib/findUsersOfRoomOrderedByRole.ts`
- `packages/models/src/models/LivechatDepartment.ts`

### 3. `$facet` stage replacement

**Problem:** Amazon DocumentDB has limited support for `$facet`. Certain operators within `$facet` sub-pipelines may not work as expected, and `$facet` can cause performance issues due to the lack of index usage within sub-pipelines.

**Solution:** Replaced `$facet` stages with parallel aggregation calls (using `Promise.all`) — one for the data query and one for the count query. This approach also enables better index utilization.

**Affected files:**
- `packages/models/src/models/Analytics.ts`
- `packages/models/src/models/Rooms.ts` (findChildrenOfTeam)
- `packages/models/src/models/Sessions.ts`
- `packages/models/src/models/LivechatRooms.ts` (getQueueMetrics)
- `packages/models/src/models/LivechatBusinessHours.ts` (findHoursToScheduleJobs)
- `apps/meteor/app/api/server/lib/users.ts` (users.list endpoint)
- `apps/meteor/ee/server/models/raw/Users.ts` (findAgentsWithDepartments)

### 4. `$$REMOVE` system variable replacement

**Problem:** Amazon DocumentDB does not support the `$$REMOVE` system variable, which is used in `$cond` / `$ifNull` expressions to conditionally remove fields from documents.

**Solution:** Replaced `$$REMOVE` usage with a two-step approach:
1. Set the field to a sentinel value (e.g., `null` or omit it) in the `$project` / `$addFields` stage.
2. Use a subsequent `$unset` or `$project` stage to remove the field when not needed.

Alternatively, restructured the pipeline to avoid the conditional field removal entirely.

**Affected files:**
- `packages/models/src/models/Sessions.ts` (listUsers)
- `packages/models/src/models/LivechatRooms.ts` (findAvailableSources)
- `packages/models/src/models/LivechatDepartment.ts` (getBusinessHoursWithDepartmentStatuses)

### 5. Pipeline-based `$lookup` in `LivechatDepartment.ts`

**Problem:** A complex `$lookup` with pipeline was used to join and filter department data with business hours.

**Solution:** Replaced with basic `$lookup` using `localField` / `foreignField`, followed by `$unwind` and `$match` stages to filter the joined data.

**Affected files:**
- `packages/models/src/models/LivechatDepartment.ts`

### 6. `$trunc` aggregation operator replacement

**Problem:** `$trunc` is unsupported on DocumentDB 5.0. Rocket.Chat used it to truncate averages
and duration values (all non-negative) in livechat and session analytics aggregations.

**Solution:** Replaced every call with `$floor`, which is supported and equivalent for the
non-negative inputs present at each call site (counters, divisions of durations, time deltas later
filtered by `time > 0`).

**Affected files:**
- `packages/models/src/models/LivechatRooms.ts` — response-time, reaction and chat-duration averages
- `packages/models/src/models/LivechatAgentActivity.ts` — `averageAvailableServiceTimeInSeconds`
- `packages/models/src/models/Sessions.ts` — `dailySessions` duration in seconds

### 7. Aggregation merge stage replaced in migration 332

**Problem:** Migration 332 backfills `contactName` / `contactUsername` on older `CallHistory` rows
by running an aggregation that joins `Users` and writes results back via the aggregation merge
stage. That stage is unsupported on DocumentDB 5.0 and would abort the migration.

**Solution:** The pipeline now drops its terminal merge stage and returns a projected cursor. The
migration iterates the cursor in batches of 500 and issues `bulkWrite` `updateOne` operations with
`{ ordered: false }` to apply the backfill. Idempotency is preserved: the `$match` still filters on
`contactName: { $exists: false }`, so re-runs skip rows that were already populated.

**Affected files:**
- `apps/meteor/server/startup/migrations/v332.ts`

## Known Issues (not yet fixed)

The following issues are present in the codebase and have not yet been addressed. They will fail
or behave incorrectly on DocumentDB but continue to work on MongoDB.

### Collation-indexed case-insensitive lookups

**Problem:** DocumentDB 5.0 does not support the `collation` index option. Seven indexes declaring
`{ locale: 'en', strength: 2 }` for case-insensitive username/email lookups are skipped at index
creation time by `filterIndexesForDocumentDB`. The indexes are not created; queries still run but
fall back to collection scans, and the collation semantics are lost — callers that depend on
case-insensitive matching must handle case at query time.

**Affected models:**
- `packages/models/src/models/Users.ts` — 5 indexes on `username` / `emails.address`
- `packages/models/src/models/LivechatContacts.ts` — 2 indexes on `name` / `emails.address`

### Wildcard indexes

**Problem:** DocumentDB 5.0 does not support wildcard indexes (`{ 'path.$**': 1 }`). Two are
defined in livechat models over custom-fields subdocuments and are skipped at index creation time
by `filterIndexesForDocumentDB`. Ad-hoc queries over `livechatData.*` fall back to collection scans.

**Affected models:**
- `packages/models/src/models/LivechatVisitors.ts:37`
- `packages/models/src/models/LivechatRooms.ts:71`

### Text indexes

**Problem:** Text indexes are skipped at index creation time by `filterIndexesForDocumentDB`.
`$text` / `$search` queries fall back to whatever alternative path the callers use (e.g. regex).

**Affected models:**
- `packages/models/src/models/Messages.ts:56` — `{ msg: 'text' }`

## Compatibility scan

To re-run the compat scan against this codebase:

```bash
git ls-files | grep -E '\.(ts|tsx|js|jsx|mjs|cjs)$' \
  | grep -v -E '(^|/)(node_modules|uikit-playground|_build|dist|\.meteor)/' > /tmp/files.txt

mkdir -p /tmp/docdb-src && cd /tmp/docdb-src \
  && while IFS= read -r f; do mkdir -p "$(dirname "$f")" \
       && ln -sf "$(git rev-parse --show-toplevel)/$f" "$f"; done < /tmp/files.txt

git clone --depth 1 https://github.com/awslabs/amazon-documentdb-tools.git /tmp/aws-docdb-tools
python3 /tmp/aws-docdb-tools/compat-tool/compat.py \
  --directory /tmp/docdb-src --version 5.0 \
  --included-extensions ts,tsx,js,jsx,mjs,cjs
```

Note: the compat-tool matches string literals as well as real operators, so expect false positives
when a field happens to be named after an aggregation operator (e.g. `'$score'` as a field path,
or `$where` in the client-side minimongo emulator at `packages/mongo-adapter/`).

### Version compatibility matrix

The compat scan was re-run against DocumentDB 4.0, 5.0 and 8.0 on the post-fix codebase. Only
real findings are listed — the `$where` (minimongo emulator) and `$score` (field path in
`Subscriptions.ts`) false positives are omitted.

| Target version | Real unsupported operators | Notes |
|---|---|---|
| **4.0** | `$meta` (15×), `$text` (12×), `$search` (12×) | Full-text search paths break. Would require reworking message search and all `textScore` projections. |
| **5.0** (current target) | none | All fixes in sections 1-7 land on this version. |
| **8.0** | none | Every operator filtered by `filterIndexesForDocumentDB` (text, wildcard, collation) is natively supported; `$trunc` and the migration-332 `$merge` would also work. Sections 6-7 and parts of the runtime index filter could be reverted if the deployment ever moves to 8.0. |

Scanning test fixtures (`*.spec.ts`, `**/__tests__/**`, `*.json`) separately produced zero
additional findings — no unsupported operators live in static test data.

## Concerns not covered by the compat-tool

`compat.py` only pattern-matches operator strings inside source files. The following runtime
concerns must be verified separately; none of them are covered by sections 1-7 above.

### Transactions

- Centralised wrapper: `apps/meteor/server/database/utils.ts` (`wrapInSessionTransaction`,
  `transactionOptions`).
- Already sets `readPreference: primary` inside every transaction, which DocumentDB requires
  (transactions fail with "Read preference in a transaction must be primary" under a
  `secondaryPreferred` client). Direct `client.startSession()` call sites
  (`app/livechat/server/lib/closeRoom.ts`, `app/livechat/server/lib/QueueManager.ts`,
  `ee/server/patches/verifyContactChannel.ts`) reuse this `transactionOptions` object.
- `shouldRetryTransaction` already inspects `TransientTransactionError` /
  `UnknownTransactionCommitResult` labels, which DocumentDB also emits — no change needed.

### Change streams

- Two call sites: `BaseRaw.watch(pipeline)` (generic helper) and
  `InstanceStatusRaw.watchActiveInstances()` (only used by the EE TCP transporter in
  `ee/server/local-services/instance/service.ts:122`). Both use the basic `.watch()` form with no
  `fullDocumentBeforeChange` or `changeStreamPreAndPostImages` options — both of which are
  unsupported on DocumentDB 5.0.
- **DocumentDB caveat**: change-stream log retention defaults to **3 hours** (compared with
  MongoDB's oplog sizing). If an EE instance is offline longer than that and tries to resume with
  a stored token, the resume will fail and the consumer must re-establish from the current tip.
  This default can be raised via the `change_stream_log_retention_duration` cluster parameter.

### Connection-string requirements

- DocumentDB requires `retryWrites=false`. The E2E test harness already pins this
  (`apps/meteor/tests/e2e/config/constants.ts:11`); production `MONGO_URL` strings must do the
  same. No source-level sweep is possible here — enforce in the deployment layer.

### Low-cardinality indexes

- AWS explicitly flags this as a DocumentDB performance footgun (see
  `awslabs/amazon-documentdb-tools/performance/index-cardinality-detection`): fields whose distinct
  values are less than ~1% of the collection (boolean-ish fields like `rooms.open`, `rooms.t`,
  `subscriptions.open`, `sessions.year`) expand the B-tree disproportionately on DocumentDB.
  There is no static-analysis fix; run the cardinality detection tool against a representative
  dataset to decide which indexes to drop or rewrite.

### Document size

- MongoDB's BSON hard limit is 16MB. AWS's `large-doc-finder` defaults its warning threshold to
  **8MB**, indicating that DocumentDB performance degrades well before the hard cap. The hot
  collections to watch in Rocket.Chat are `messages` (attachments, translations, reactions) and
  `users` (custom fields, OAuth service blobs). Run `large-doc-finder` against real data to confirm.
