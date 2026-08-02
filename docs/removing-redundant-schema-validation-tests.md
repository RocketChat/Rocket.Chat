# Removing Redundant Schema Validation E2E Tests

## Context

Rocket.Chat has migrated many API endpoints from the legacy `API.v1.addRoute()` pattern to the new `API.v1.[method]()` pattern (`API.v1.get`, `API.v1.post`, `API.v1.put`, `API.v1.delete`). The new pattern enforces **build-time input validation** (via AJV-compiled schemas on `query`/`body` options) and **runtime response validation** (in test mode). This makes many E2E tests that only verify payload schema rejection redundant.

This document describes a repeatable process for identifying and removing those redundant tests.

---

## Step 1: Identify fully-migrated endpoint files

An endpoint file is "fully migrated" when it uses **only** `API.v1.get()`, `API.v1.post()`, `API.v1.put()`, or `API.v1.delete()` and has **zero** calls to `API.v1.addRoute()`.

### How to check

```bash
# List files that ONLY use the new pattern (no addRoute calls)
# First, find all endpoint files using the new pattern:
grep -rl 'API\.v1\.\(get\|post\|put\|delete\)(' apps/meteor/app/api/server/v1/ \
  apps/meteor/app/livechat/server/api/ \
  apps/meteor/ee/ \
  --include='*.ts' | sort > /tmp/new-pattern-files.txt

# Then, find files that still use addRoute:
grep -rl 'API\.v1\.addRoute(' apps/meteor/app/api/server/v1/ \
  apps/meteor/app/livechat/server/api/ \
  apps/meteor/ee/ \
  --include='*.ts' | sort > /tmp/old-pattern-files.txt

# Files in new but NOT in old are fully migrated:
comm -23 /tmp/new-pattern-files.txt /tmp/old-pattern-files.txt
```

### Partially migrated files

Some files use **both** patterns (e.g., `push.ts` has 3 new-pattern endpoints and 2 old-pattern endpoints). For these, you must check **per-endpoint** whether the specific endpoint being tested has been migrated. Only remove schema validation tests for endpoints that use the new pattern.

To check a specific endpoint:

```bash
# Check if a specific endpoint uses the new or old pattern
grep -n 'push.token' apps/meteor/app/api/server/v1/push.ts
# If the line shows API.v1.post('push.token', ...) → migrated
# If the line shows API.v1.addRoute('push.token', ...) → NOT migrated
```

---

## Step 2: Identify schema-validation-only tests in the corresponding test file

Test files live in `apps/meteor/tests/end-to-end/api/` and typically match the endpoint file name (e.g., `banners.ts` endpoint → `banners.ts` test file).

### Indicators that a test is ONLY validating schema (safe to remove)

A test is a schema-validation-only test if it matches **ALL** of these criteria:

1. **Sends an incomplete, empty, or wrong-typed payload** — e.g., `.send({})`, omits required fields, sends `true` where `string` is expected
2. **Expects a 400 response** with one of these error patterns:
   - `errorType: 'invalid-params'` (the AJV validation error type)
   - Error message contains AJV phrases: `"must have required property"`, `"must be equal to one of the allowed values"`, `"must NOT have fewer than 1 characters"`, `"must be string"`, `"must be number"`, `"must match pattern"`
   - Error message is `'Body parameter "X" is required.'` or similar parameter-presence checks
3. **No resource setup or teardown** — no `createUser`, `createRoom`, `createTeam`, database operations, or `before`/`after` hooks specific to the test
4. **Single request-response cycle** — one HTTP call, check the error, done
5. **Uses the `expectInvalidParams` helper** from `tests/data/validation.helper.ts` (automatic indicator)

### Common test name patterns for schema-only tests

```
should fail if missing X
should fail if X is not provided
should fail if X is empty
should return an error when the required "X" parameter is not sent
should return bad request if X is not provided
should fail if X param is unknown/invalid (when testing enum values)
should return an error when the X is not provided
```

### How to find them programmatically

```bash
# Find tests that assert 'invalid-params' errorType (strong signal)
grep -n "errorType.*invalid-params\|invalid-params.*errorType" \
  apps/meteor/tests/end-to-end/api/*.ts \
  apps/meteor/tests/end-to-end/api/**/*.ts

# Find tests that assert AJV error messages (strong signal)
grep -n "must have required property\|must be equal to one of the allowed values\|must NOT have fewer than" \
  apps/meteor/tests/end-to-end/api/*.ts \
  apps/meteor/tests/end-to-end/api/**/*.ts

# Find tests named with schema-validation patterns
grep -n "should fail if missing\|should fail if.*not provided\|should fail if.*empty\|should return.*error.*required.*parameter" \
  apps/meteor/tests/end-to-end/api/*.ts \
  apps/meteor/tests/end-to-end/api/**/*.ts
```

---

## Step 3: Cross-reference — only remove tests for migrated endpoints

**Critical rule:** Only remove a schema-validation test if the endpoint it tests has been migrated to the new `API.v1.[method]()` pattern.

### Decision matrix

| Endpoint uses new API? | Test is schema-validation-only? | Action                                           |
| ---------------------- | ------------------------------- | ------------------------------------------------ |
| Yes                    | Yes                             | **REMOVE** the test                              |
| Yes                    | No (integration test)           | **KEEP** the test                                |
| No                     | Yes                             | **KEEP** the test (still needed until migration) |
| No                     | No                              | **KEEP** the test                                |

---

## Step 4: What to KEEP (do NOT remove these)

Even if an endpoint is migrated, keep tests that:

1. **Test business logic validation** — errors like `'error-invalid-room'`, `'error-contact-manager-not-found'`, `'error-unauthorized'`, `'Not allowed'`. These validate application logic, not schema.
2. **Test authentication guards** (`should fail if not logged in`, expects 401) — while `authRequired: true` is enforced by the framework too, auth tests serve as a security regression gate and are cheap to run. Use team judgment on whether to keep or remove.
3. **Test authorization/permissions** — errors about missing permissions, role checks
4. **Test with semantically valid payloads** — the payload passes schema validation but fails a business rule (e.g., `userId` is valid format but user doesn't exist)
5. **Create/verify resources or side effects** — multi-step tests that verify state changes

### Gray area: how to distinguish business logic from schema validation

- If `errorType` is `'invalid-params'` → **schema validation** (AJV layer)
- If `errorType` is anything else (e.g., `'error-invalid-room'`, `'error-not-found'`, custom error) → **business logic** (keep)
- If the error message contains AJV vocabulary (`"must have required property"`, `"must be"`, `"must NOT"`) → **schema validation**
- If the error message is application-specific → **business logic** (keep)

---

## Step 5: Execute the removal

For each test file with removable tests:

1. Read the test file
2. Identify the `it(...)` blocks that are schema-validation-only (per Step 2 criteria)
3. Remove the `it(...)` blocks
4. If removing all tests in a `describe(...)` block, remove the entire `describe` block
5. If removing all tests in a file, delete the file entirely
6. Clean up unused imports that were only used by removed tests
7. Run the remaining tests to ensure nothing is broken:
   ```bash
   yarn workspace @rocket.chat/meteor testapi --grep "endpoint-name"
   ```

---

## Step 6: Verify with the OpenAPI docs endpoint

You can verify which endpoints are fully migrated by querying the OpenAPI endpoint:

```bash
# Get only migrated (documented) endpoints
curl http://localhost:3000/api/docs/json | jq '.paths | keys'

# Get ALL endpoints including unmigrated ones
curl http://localhost:3000/api/docs/json?withUndocumented=true | jq '.paths | keys'

# Difference = unmigrated endpoints
```

Endpoints tagged with `'Missing Documentation'` in the OpenAPI output are still using the old pattern.

---

## Already Fully Migrated Endpoint Files (as of 2026-03-31)

These files use **only** the new `API.v1.[method]()` pattern:

| Endpoint file                        | Test file                               | Schema-only tests to remove |
| ------------------------------------ | --------------------------------------- | --------------------------- |
| `app/api/server/v1/banners.ts`       | `tests/end-to-end/api/banners.ts`       | 6 tests                     |
| `app/api/server/v1/custom-sounds.ts` | `tests/end-to-end/api/custom-sounds.ts` | 3 tests                     |
| `app/api/server/v1/moderation.ts`    | `tests/end-to-end/api/moderation.ts`    | 9 tests                     |

### Partially migrated (check per-endpoint):

| Endpoint file               | Migrated endpoints                                      | Not migrated            |
| --------------------------- | ------------------------------------------------------- | ----------------------- |
| `app/api/server/v1/push.ts` | `push.token` (POST), `push.token` (DELETE), `push.test` | `push.get`, `push.info` |

For `push.ts`, the 7 schema-validation tests for `push.token` POST and DELETE can be removed. Tests for `push.get` and `push.info` should be kept.

---

## Automation Script (for future runs)

To repeat this process after more endpoints are migrated, run these steps:

```bash
# 1. Generate list of fully-migrated endpoint files
grep -rl 'API\.v1\.\(get\|post\|put\|delete\)(' apps/meteor/app/api/server/v1/ --include='*.ts' | \
  while read f; do
    if ! grep -q 'API\.v1\.addRoute(' "$f"; then
      echo "$f"
    fi
  done

# 2. For each migrated file, find the corresponding test file
# Endpoint: apps/meteor/app/api/server/v1/XXXX.ts
# Test:     apps/meteor/tests/end-to-end/api/XXXX.ts

# 3. In each test file, find schema-validation tests
# Look for the patterns described in Step 2

# 4. Review and remove, then run tests
```

---

## Key Files Reference

| Purpose                                             | Path                                            |
| --------------------------------------------------- | ----------------------------------------------- |
| New API class (`get`/`post`/`put`/`delete` methods) | `apps/meteor/app/api/server/ApiClass.ts`        |
| API instantiation (`API.v1`)                        | `apps/meteor/app/api/server/api.ts`             |
| Schema validation test helper                       | `apps/meteor/tests/data/validation.helper.ts`   |
| AJV validators (rest-typings)                       | `packages/rest-typings/src/v1/`                 |
| OpenAPI docs endpoint                               | `apps/meteor/app/api/server/default/openApi.ts` |
| E2E API tests                                       | `apps/meteor/tests/end-to-end/api/`             |
