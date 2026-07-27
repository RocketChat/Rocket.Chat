---
'@rocket.chat/meteor': minor
---

Stops the REST API from answering `401 Unauthorized` for authorization failures, so that a 401 only ever means "no valid session".

Every `error-unauthorized` / `error-not-authorized` throw in the codebase follows an authorization check (`hasPermissionAsync`, `canAccessRoom`, `canDeleteFile`, agent department scope), never a missing session, but the error switch in `server/api/ApiClass.ts` mapped `error-unauthorized` to 401 once the 9.0.0 breaking-change flag turned on — while the permission middleware answered 403 for the very same condition. A client could not infer session state from the status code, which is what broke live sessions in the `sendMessage` / `getReadReceipts` migration.

- `error-unauthorized` / `unauthorized` now always map to 403, dropping the 401 they would have been promoted to in 9.0.0 (403 today, unchanged).
- `error-not-authorized` / `not-authorized` (the dominant permission code, previously unmapped and falling through to 400) map to 403 from 9.0.0.
- `rooms.membersOrderedByRole` (broadcast member list), `rooms.hide` and `rooms.bannedUsers` returned 401 for access/permission failures; they return 403 from 9.0.0, and their response schemas now declare it.
- Removed a dead `if (applyBreakingChanges)` fork in the permissions middleware whose branches were identical.

The unauthenticated side is unchanged here: those checks still throw `error-invalid-user` and answer 400. Splitting them out needs a dedicated error code and is tracked separately.
