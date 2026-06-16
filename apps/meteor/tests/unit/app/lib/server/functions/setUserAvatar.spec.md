# setUserAvatar.spec.ts - Modification Guide

This guide describes what to modify in `setUserAvatar.spec.ts` when avatar URL behavior changes.

## File Under Test
- Source: `apps/meteor/app/lib/server/functions/setUserAvatar.ts`
- Test file: `apps/meteor/tests/unit/app/lib/server/functions/setUserAvatar.spec.ts`

## When You Change MIME Validation
Update tests in these sections:
- `rejects disallowed MIME types`
- `accepts allowed MIME types`
- `ignores Content-Type parameters`
- `accepts Content-Type values with uppercase letters`

What to modify:
- Add/remove MIME types from `allowedTypes` and `disallowedTypes` arrays.
- Keep at least one normalization test (`image/jpeg; charset=...` or uppercase).

## When You Change Max Size Logic
Update tests in:
- `Content-Length early rejection`
- `streaming byte counter (Content-Length absent)`

What to modify:
- `maxSize` setup values.
- Chunk combinations that cross or do not cross the limit.
- Keep one test proving overflow is detected without `Content-Length`.

## When You Change Fetch/Response Error Handling
Update tests in:
- `throws error-avatar-invalid-url for a 404 response`
- `throws error-avatar-url-handling for a 500 response`
- `throws error-avatar-invalid-url when fetch rejects (network error)`
- `throws error-avatar-invalid-url when response body is missing`

What to modify:
- Assert the expected Meteor error code (`error` field) after changing behavior.

## Required Assertions to Keep
For security regressions, keep these assertions in relevant tests:
- `fileStoreInsert.called` is `false` for rejected payloads.
- `fileStoreInsert.calledOnce` is `true` for accepted payloads.
- Correct Meteor error code is asserted (`error-avatar-invalid-url`, `error-avatar-image-too-large`, etc.).

## Running Only This Spec
From `apps/meteor`:

```bash
TS_NODE_COMPILER_OPTIONS='{"module":"commonjs"}' npx mocha --no-config --require tsx --exit --timeout 10000 tests/unit/app/lib/server/functions/setUserAvatar.spec.ts
```
