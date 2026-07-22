# DDP methods still called from client — work plan

Last sync: develop @ 2026-05-28, post-#40659 merge. Open PRs: #40711, #40675, #40724.

33 active DDP callers in the client. **Zero pure swaps left** — every one needs a new REST endpoint or extra design work.

## ⏳ In open PRs

| PR | Callers covered |
|---|---|
| #40711 (batch2) | `joinRoom`, `userSetUtcOffset`, `deleteFileMessage`, `readThreads`, `spotlight` (2 sites), `listCustomSounds`, `getThreadMessages` |
| #40675 | `sendMessage` (8 sites), `getReadReceipts` |
| #40724 (batch3) | `deleteCustomSound`, `blockUser`/`unblockUser` (toggle `im.blockUser`), `saveSettings` (POST `/v1/settings`), `e2e.requestSubscriptionKeys` |

## ✅ Already merged

- #40659 (used-with-rest, 22 files): `autoTranslate.translateMessage`, `listCustomUserStatus`, `personalAccessTokens:generateToken/regenerateToken/removeToken`, `cloud:syncWorkspace`, `executeSlashCommandPreview`, `getSlashCommandPreviews`, `getThreadMessages`, `getRoomById`, `addUsersToRoom`, `leaveRoom`, `requestDataDownload`, `createDirectMessage`, `e2e.resetOwnE2EKey`, `e2e.getUsersOfRoomWithoutKey`, `e2e.setRoomKeyID`, `getSingleMessage`, `slashCommand`
- #40656 (orphan removal) + #40657 (deprecation log without replacement) — don't touch active callers

## 🔴 Still need a new endpoint (33 callers)

Grouped by domain. Each block becomes an independent PR.

### Quick wins — small endpoint, 1-2 callers (suggested batch4)

| DDP method | Caller | REST proposal |
|---|---|---|
| `logoutCleanUp` | `providers/UserProvider.tsx:42` | **investigate** — `/v1/logout` probably already fires `afterLogoutCleanUpCallback` + `AppEvents.IPostUserLoggedOut`. If so, drop the client-side `sdk.call`. |
| `setAvatarFromService` | `hooks/useUpdateAvatar.ts:20` | extend `POST /v1/users.setAvatar` with `service` + `contentType` (store `avatarOrigin: service`). |
| `getRoomByTypeAndName` | `views/room/hooks/useOpenRoom.ts:22`, `views/root/MainLayout/EmbeddedPreload.tsx:37` | `GET /v1/rooms.getByTypeAndName` (no admin requirement). |
| `cloud:connectWorkspace` | `views/admin/workspace/VersionCard/modals/RegisterWorkspaceTokenModal.tsx:34` | `POST /v1/cloud.connectWorkspace` with `{ token }`. |
| `verifyEmail` + `afterVerifyEmail` | `meteor/startup/accounts.ts:51,53` | `POST /v1/users.verifyEmail` with `{ token }`; `afterVerifyEmail` is a pure callback hook — drop it. |
| `authorization:addPermissionToRole` + `removeRoleFromPermission` | `views/admin/permissions/PermissionsTable.tsx:25-26` | `POST /v1/permissions.addRole` + `POST /v1/permissions.removeRole` (admin). |
| `clearIntegrationHistory` + `replayOutgoingIntegration` | `views/admin/integrations/outgoing/history/{OutgoingWebhookHistoryPage,HistoryItem}.tsx` | `DELETE /v1/integrations.history.clear` + `POST /v1/integrations.outgoing.replay`. |
| `checkRegistrationSecretURL` | `web-ui-registration/src/hooks/useCheckRegistrationSecret.ts:5` | `GET /v1/users.checkRegistrationSecret` (public) or a stateless endpoint. |
| `resetPassword(token, password)` | `web-ui-registration/src/ResetPassword/ResetPasswordPage.tsx:31` | `POST /v1/users.resetPassword` with `{ token, password }`. `/v1/users.forgotPassword` already exists (sends the email); the reset step is missing. |

### Medium endpoints — auth/2FA/admin

| Block | Methods | Files | Notes |
|---|---|---|---|
| **2FA TOTP** | `2fa:enable`, `2fa:disable`, `2fa:validateTempToken`, `2fa:checkCodesRemaining`, `2fa:regenerateCodes` | `views/account/security/TwoFactorTOTP.tsx` | `/v1/users.2fa.{enable,disable,sendEmail}Email` exists for e-mail 2FA only. TOTP needs new endpoints. Careful: `validateTempToken` is a challenge response — use `twoFactorRequired` for the rest. |
| **OAuth services** | `addOAuthService`, `removeOAuthService`, `refreshOAuthService` | `views/admin/settings/groups/OAuthGroupPage/OAuthGroupPage.tsx:37-39` | `POST /v1/oauth.services.{add,remove,refresh}` with `{ name }`. Admin only. |
| **Audit EE** | `auditGetAuditions`, `auditGetMessages`, `auditGetOmnichannelMessages` | `views/audit/components/AuditLogTable.tsx`, `views/audit/hooks/useAuditMutation.ts` | `GET /v1/audit.{auditions,messages,omnichannel.messages}`. Admin EE only. |
| **Search providers** | `rocketchatSearch.getProvider`, `rocketchatSearch.search` | `views/room/contextualBar/MessageSearchTab/hooks/{useMessageSearchProviderQuery,useMessageSearchQuery}.ts` | `GET /v1/search.provider` + `GET /v1/search` (text + room context). |

### Large endpoints — file ops / session

| Block | Methods | Files | Notes |
|---|---|---|---|
| **Webdav** | `addWebdavAccount`, `getFileFromWebdav`, `getWebdavFileList`, `getWebdavFilePreview`, `uploadFileToWebdav` | `views/room/webdav/{WebdavFilePickerModal,AddWebdavAccountModal,SaveToWebdavModal}.tsx` | `/v1/webdav.getMyAccounts` + `removeAccount` exist. Missing create + file ops. Proposal: `/v1/webdav.accounts.add`, `/v1/webdav.files.{list,get,preview,upload}`. Upload + preview are streaming. |
| **Presence** | `UserPresence:online`, `UserPresence:away` | `lib/userPresence.ts:78-79` | DDP uses `Presence.setConnectionStatus(uid, status, session)` — session-aware via socket. REST `/v1/users.setStatus` is global and persistent, no session tracking. Options: accept the drift and use `setStatus` (loses session); or create `/v1/users.presence.{connect,away}` with a session-id header. **Design decision pending.** |
| **Anonymous register** | `registerUser({ email: null })` | `views/room/composer/ComposerAnonymous.tsx:19` | `/v1/users.register` requires email/user/pass. Anonymous auto-generates them. Options: new `/v1/users.registerAnonymous`, or allow `email: null` when `Accounts_AllowAnonymousWrite=true`. |

## Suggested roadmap

1. ✅ #40659 (22 files) — merged
2. ⏳ #40711 (4 extended endpoints + 7 callers) — open
3. ⏳ #40675 (sendMessage + getReadReceipts, refactor) — open
4. ⏳ #40724 (5 new endpoints + 4 callers) — open
5. **Next: batch4 quick wins** — 7 new endpoints, ~10 files, low risk:
   - `logoutCleanUp` drop
   - `setAvatarFromService` (extends existing)
   - `getRoomByTypeAndName`
   - `cloud:connectWorkspace`
   - `verifyEmail`
   - Permissions↔Roles (2)
   - Integrations clear/replay (2)
6. **Per-domain PRs after that:**
   - 2FA TOTP (5 endpoints, challenge-handling design)
   - OAuth admin (3 endpoints)
   - Audit EE (3 endpoints, admin)
   - Search providers (2 endpoints)
   - Webdav (5 endpoints, streaming) — can split into "accounts" + "files"
   - Presence (needs session design)
   - Anonymous register
   - `resetPassword` + `checkRegistrationSecretURL` (web-ui-registration)

## Notes

- `afterVerifyEmail` is only an `sdk.call` on the client; the server side is a callback hook. Confirm it isn't called in a loop before dropping.
- `logoutCleanUp` needs careful investigation — `/v1/logout` may already call `afterLogoutCleanUpCallback`.
- `2fa:validateTempToken` is part of the challenge handshake; a REST endpoint must coordinate with the `X-2fa-code` header pattern.
- Presence migration will break "online" badge reactivity if done without care around session/heartbeat.
- `resetPassword` in `web-ui-registration` is the only DDP caller in that package — after this swap, the package becomes REST-only.

## Audit commands

```sh
# Unique DDP methods called from the client
rg -oh "(useMethod|sdk\.call)\(['\"]([a-zA-Z0-9:_.-]+)['\"]" \
  apps/meteor/client packages/web-ui-registration | sort -u

# Caller sites with paths
rg -n "(useMethod|sdk\.call)\(['\"]([a-zA-Z0-9:_.-]+)['\"]" \
  apps/meteor/client packages/web-ui-registration
```
