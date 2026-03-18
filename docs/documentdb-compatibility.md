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
