---
'@rocket.chat/meteor': major
---

**Breaking:** the REST API no longer answers `401 Unauthorized` for authorization failures. A 401 now means one thing only — the request carries no valid session.

Every `error-unauthorized` / `error-not-authorized` throw in the codebase follows an authorization check (`hasPermissionAsync`, `canAccessRoom`, `canDeleteFile`, agent department scope), never a missing session, but the error switch in `server/api/ApiClass.ts` mapped `error-unauthorized` to 401 while the permission middleware answered 403 for the very same condition. A client could not infer session state from the status code, which is what logged out live sessions in the `sendMessage` / `getReadReceipts` migration.

Status code changes:

- `error-not-authorized` / `not-authorized` — the dominant permission code, previously unmapped and falling through to `API.v1.failure()`: **400 → 403**.
- `error-unauthorized` / `unauthorized`: stays **403**, and no longer flips to 401.
- `rooms.membersOrderedByRole` (broadcast member list), `rooms.hide`, `rooms.bannedUsers` — returned 401 for access and permission failures: **401 → 403**. Their response schemas now declare it.
- Routes declaring `permissionsRequired` without `authRequired`, called with no session: **403 → 401**.

Also removed a dead `if (applyBreakingChanges)` fork in the permissions middleware whose two branches were identical.

The unauthenticated side is unchanged here: those checks still throw `error-invalid-user` and answer 400. Splitting them out needs a dedicated error code, since `error-invalid-user` also means "that user does not exist", and is tracked separately.
