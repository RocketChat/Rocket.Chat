# DDP methods still called from client — work plan

Last sync: develop @ 2026-05-28, post-#40659 merge. Open PRs: #40711, #40675, #40724.

33 DDP callers ativos no client. **Zero swaps puros restantes** — todos precisam endpoint REST novo ou design extra.

## ⏳ Em PR aberto

| PR | Callers cobertos |
|---|---|
| #40711 (batch2) | `joinRoom`, `userSetUtcOffset`, `deleteFileMessage`, `readThreads`, `spotlight` (2 sites), `listCustomSounds`, `getThreadMessages` |
| #40675 | `sendMessage` (8 sites), `getReadReceipts` |
| #40724 (batch3) | `deleteCustomSound`, `blockUser`/`unblockUser` (toggle `im.blockUser`), `saveSettings` (POST `/v1/settings`), `e2e.requestSubscriptionKeys` |

## ✅ Já mergeados

- #40659 (used-with-rest, 22 arquivos): `autoTranslate.translateMessage`, `listCustomUserStatus`, `personalAccessTokens:generateToken/regenerateToken/removeToken`, `cloud:syncWorkspace`, `executeSlashCommandPreview`, `getSlashCommandPreviews`, `getThreadMessages`, `getRoomById`, `addUsersToRoom`, `leaveRoom`, `requestDataDownload`, `createDirectMessage`, `e2e.resetOwnE2EKey`, `e2e.getUsersOfRoomWithoutKey`, `e2e.setRoomKeyID`, `getSingleMessage`, `slashCommand`
- #40656 (orphan removal) + #40657 (deprecation log sem replacement) — não tocam callers ativos

## 🔴 Restam endpoint novo (33 callers)

Agrupados por domínio. Cada bloco vira PR independente.

### Quick wins — endpoint pequeno, 1-2 callers (sugestão batch4)

| Método DDP | Caller | Proposta REST |
|---|---|---|
| `logoutCleanUp` | `providers/UserProvider.tsx:42` | **investigar** — `/v1/logout` provavelmente já dispara `afterLogoutCleanUpCallback` + `AppEvents.IPostUserLoggedOut`. Se sim, dropar `sdk.call` no client. |
| `setAvatarFromService` | `hooks/useUpdateAvatar.ts:20` | estender `POST /v1/users.setAvatar` com `service` + `contentType` (gravar `avatarOrigin: service`). |
| `getRoomByTypeAndName` | `views/room/hooks/useOpenRoom.ts:22`, `views/root/MainLayout/EmbeddedPreload.tsx:37` | `GET /v1/rooms.getByTypeAndName` (sem admin requirement). |
| `cloud:connectWorkspace` | `views/admin/workspace/VersionCard/modals/RegisterWorkspaceTokenModal.tsx:34` | `POST /v1/cloud.connectWorkspace` com `{ token }`. |
| `verifyEmail` + `afterVerifyEmail` | `meteor/startup/accounts.ts:51,53` | `POST /v1/users.verifyEmail` com `{ token }`; `afterVerifyEmail` é callback hook puro — dropar. |
| `authorization:addPermissionToRole` + `removeRoleFromPermission` | `views/admin/permissions/PermissionsTable.tsx:25-26` | `POST /v1/permissions.addRole` + `POST /v1/permissions.removeRole` (admin). |
| `clearIntegrationHistory` + `replayOutgoingIntegration` | `views/admin/integrations/outgoing/history/{OutgoingWebhookHistoryPage,HistoryItem}.tsx` | `DELETE /v1/integrations.history.clear` + `POST /v1/integrations.outgoing.replay`. |
| `checkRegistrationSecretURL` | `web-ui-registration/src/hooks/useCheckRegistrationSecret.ts:5` | `GET /v1/users.checkRegistrationSecret` (público) ou endpoint stateless. |
| `resetPassword(token, password)` | `web-ui-registration/src/ResetPassword/ResetPasswordPage.tsx:31` | `POST /v1/users.resetPassword` com `{ token, password }`. Já existe `/v1/users.forgotPassword` (envia email); falta a etapa do reset. |

### Endpoints médios — auth/2FA/admin

| Bloco | Métodos | Arquivos | Observação |
|---|---|---|---|
| **2FA TOTP** | `2fa:enable`, `2fa:disable`, `2fa:validateTempToken`, `2fa:checkCodesRemaining`, `2fa:regenerateCodes` | `views/account/security/TwoFactorTOTP.tsx` | Existe `/v1/users.2fa.{enable,disable,sendEmail}Email` só pra e-mail 2FA. TOTP precisa endpoints novos. Atenção: `validateTempToken` é challenge response — usar `twoFactorRequired` no resto. |
| **OAuth services** | `addOAuthService`, `removeOAuthService`, `refreshOAuthService` | `views/admin/settings/groups/OAuthGroupPage/OAuthGroupPage.tsx:37-39` | `POST /v1/oauth.services.{add,remove,refresh}` com `{ name }`. Admin only. |
| **Audit EE** | `auditGetAuditions`, `auditGetMessages`, `auditGetOmnichannelMessages` | `views/audit/components/AuditLogTable.tsx`, `views/audit/hooks/useAuditMutation.ts` | `GET /v1/audit.{auditions,messages,omnichannel.messages}`. Admin EE only. |
| **Search providers** | `rocketchatSearch.getProvider`, `rocketchatSearch.search` | `views/room/contextualBar/MessageSearchTab/hooks/{useMessageSearchProviderQuery,useMessageSearchQuery}.ts` | `GET /v1/search.provider` + `GET /v1/search` (text + room context). |

### Endpoints grandes — file ops / session

| Bloco | Métodos | Arquivos | Observação |
|---|---|---|---|
| **Webdav** | `addWebdavAccount`, `getFileFromWebdav`, `getWebdavFileList`, `getWebdavFilePreview`, `uploadFileToWebdav` | `views/room/webdav/{WebdavFilePickerModal,AddWebdavAccountModal,SaveToWebdavModal}.tsx` | Existe `/v1/webdav.getMyAccounts` + `removeAccount`. Faltam create + file ops. Proposta: `/v1/webdav.accounts.add`, `/v1/webdav.files.{list,get,preview,upload}`. Upload + preview são streaming. |
| **Presence** | `UserPresence:online`, `UserPresence:away` | `lib/userPresence.ts:78-79` | DDP usa `Presence.setConnectionStatus(uid, status, session)` — session-aware via socket. REST `/v1/users.setStatus` é global persistente, sem session tracking. Opções: aceitar drift + `setStatus` (perde session); criar `/v1/users.presence.{connect,away}` com session-id header. **Decisão de design pendente.** |
| **Anonymous register** | `registerUser({ email: null })` | `views/room/composer/ComposerAnonymous.tsx:19` | `/v1/users.register` exige email/user/pass. Anonymous auto-gera. Opções: novo `/v1/users.registerAnonymous` ou permitir `email: null` quando `Accounts_AllowAnonymousWrite=true`. |

## Roadmap sugerido

1. ✅ #40659 (22 arquivos) — merged
2. ⏳ #40711 (4 endpoints estendidos + 7 callers) — open
3. ⏳ #40675 (sendMessage + getReadReceipts, refactor) — open
4. ⏳ #40724 (5 endpoints novos + 4 callers) — open
5. **Próximo: batch4 quick wins** — 7 endpoints novos, ~10 arquivos, baixo risco:
   - `logoutCleanUp` drop
   - `setAvatarFromService` (estende existing)
   - `getRoomByTypeAndName`
   - `cloud:connectWorkspace`
   - `verifyEmail`
   - Permissions↔Roles (2)
   - Integrations clear/replay (2)
6. **PRs por domínio depois:**
   - 2FA TOTP (5 endpoints, design challenge handling)
   - OAuth admin (3 endpoints)
   - Audit EE (3 endpoints, admin)
   - Search providers (2 endpoints)
   - Webdav (5 endpoints, streaming) — pode dividir em "accounts" + "files"
   - Presence (precisa design session)
   - Anonymous register
   - `resetPassword` + `checkRegistrationSecretURL` (web-ui-registration)

## Notas

- `afterVerifyEmail` é só `sdk.call` no client; servidor é callback hook. Confirmar que não é chamado em loop antes de dropar.
- `logoutCleanUp` precisa investigação cuidadosa — pode ser que `/v1/logout` já chame `afterLogoutCleanUpCallback`.
- `2fa:validateTempToken` é parte do challenge handshake; endpoint REST precisa coordenar com `X-2fa-code` header pattern.
- Presence migration vai quebrar reactivity de "online" badges se feita sem cuidado com session/heartbeat.
- `resetPassword` no `web-ui-registration` é o único caller DDP nesse package — depois desse swap, package fica REST-only.

## Comandos de audit

```sh
# Lista métodos DDP únicos chamados do client
rg -oh "(useMethod|sdk\.call)\(['\"]([a-zA-Z0-9:_.-]+)['\"]" \
  apps/meteor/client packages/web-ui-registration | sort -u

# Caller sites com path
rg -n "(useMethod|sdk\.call)\(['\"]([a-zA-Z0-9:_.-]+)['\"]" \
  apps/meteor/client packages/web-ui-registration
```
