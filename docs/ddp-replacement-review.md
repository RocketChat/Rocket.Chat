# DDP→REST replacement audit review

Reviewing the `restReplacement` heuristic mappings emitted by `scripts/add-ddp-deprecation.mjs` against the actual DDP method bodies and the claimed REST endpoint implementations. Skipped methods already deprecated before this PR: `sendFileMessage`, `starMessage`, `insertOrUpdateSound`, `uploadCustomSound`.

Verdict legend:
- **OK** — REST endpoint is a faithful drop-in (response shape may be wrapped, but the data and side effects match).
- **PARTIAL** — REST exists with the same intent, but signature/response/auth/side effects differ enough that the caller must refactor beyond a URL change.
- **WRONG** — REST endpoint does something materially different than the DDP method; the mapping is misleading.
- **MISSING** — Mapping points at a path that does not exist as a real route in v1.

## Verified mappings (sorted by severity)

| method | claimed_replacement | verdict | notes |
| --- | --- | --- | --- |
| `2fa:disable` | `/v1/users.2fa.sendEmailCode` | WRONG | DDP disables TOTP after verifying code; REST sends a 2FA email code — different feature (email vs. TOTP) and different action (send vs. disable). |
| `2fa:enable` | `/v1/users.2fa.enableEmail` | WRONG | DDP enables TOTP and returns `{secret,url}`; REST enables email-based 2FA and returns void. Different mechanism, different return shape. |
| `deleteFileMessage` | `/v1/rooms.cleanHistory` | WRONG | DDP deletes a single message by fileID; `rooms.cleanHistory` purges messages by time range across a room. Unrelated semantics. |
| `getMessages` | `/v1/chat.getMessage` | WRONG | DDP accepts an array of message IDs and returns matching messages in one call; `chat.getMessage` takes a single `msgId`. Batch behavior cannot be reproduced in one call. |
| `loadNextMessages` | `/v1/chat.syncMessages` | WRONG | DDP returns messages forward in time from a timestamp with a limit; `chat.syncMessages` returns updated/deleted since last sync. Different semantics. |
| `loadSurroundingMessages` | `/v1/chat.syncMessages` | WRONG | DDP returns messages before+after a target message (with `moreBefore`/`moreAfter`); `chat.syncMessages` is sync-based. Unrelated. |
| `readThreads` | `/v1/subscriptions.read` | WRONG | DDP marks one thread (`tmid`) as read; REST marks an entire room (or all threads in a room) read and does not accept `tmid`. |
| `getSetupWizardParameters` | `/v1/settings.public` | WRONG | DDP returns wizard-flagged settings plus `serverAlreadyRegistered`; `settings.public` returns all public settings with no `serverAlreadyRegistered` field. |
| `banner/dismiss` | `/v1/banners.dismiss` | WRONG | DDP marks a banner as read in the user document (`Users.setBannerReadById`); REST calls `Banner.dismiss` (broadcast-level dismissal). Different operations. |
| `saveSettings` | `/v1/settings` | MISSING/WRONG | Path `/v1/settings` does not exist (only `settings/:_id`). The batch endpoint is gone — caller must loop and loses atomicity/audit batching. |
| `loadHistory` | `/v1/channels.history` | PARTIAL | Works for any room type (c/p/d/l/discussions); REST only allows `room.t === 'c'` (or 'l'). Breaks for private rooms, DMs, threads-as-rooms. Also DDP allows anonymous when `Accounts_AllowAnonymousRead` is set; REST requires auth. |
| `joinRoom` | `/v1/channels.join` | PARTIAL | DDP joins any joinable room via `Room.join`; REST `findChannelByIdOrName` rejects non-channels. Discussions/groups won't work. |
| `leaveRoom` | `/v1/channels.leave` | PARTIAL | DDP leaves any room; REST restricted to channels. Groups need `groups.leave`. |
| `addUsersToRoom` | `/v1/channels.invite` | PARTIAL | DDP works for c and p rooms; REST only channels. Caller must dispatch between `channels.invite` and `groups.invite` based on room type. |
| `getRoomByTypeAndName` | `/v1/rooms.info` | PARTIAL | DDP keys by `(type, name)` and supports anonymous when type=`c`; REST takes only `roomId`/`roomName` (no type disambiguation) and requires auth. Could resolve to a wrong-type room if names collide. |
| `getRoomById` | `/v1/rooms.info` | PARTIAL | Same underlying access check, but DDP returns the raw room; REST wraps as `{room, team?, parent?}` and adds team/parent lookups (extra DB hits + breaking response shape). |
| `getThreadMessages` | `/v1/chat.getThreadMessages` | PARTIAL | DDP also calls `readThread` (marks thread as read) and prepends the parent message; REST does neither and sorts ascending vs. descending. Read-marker side effect is lost. |
| `loadMissedMessages` | `/v1/chat.syncMessages` | PARTIAL | DDP returns a flat array of messages since `ts`; REST returns `{updated, deleted, cursor}` and requires `type` or `lastUpdate`. Substantial response refactor; semantics overlap but are not equivalent. |
| `spotlight` | `/v1/spotlight` | PARTIAL | REST drops the `usernames`, `type`, and `rid` parameters; only `query` (text) is accepted. Mentions/room-scoped search and federated-room toggle are lost. |
| `setAvatarFromService` | `/v1/users.setAvatar` | PARTIAL | DDP accepts a dataURI string + `service` name; REST expects multipart `image` or `avatarUrl`. Service-name code path (e.g. gravatar) has no equivalent body shape. |
| `listCustomUserStatus` | `/v1/custom-user-status.list` | PARTIAL | DDP returns a flat array of all statuses; REST returns paginated `{statuses, count, offset, total}`. Caller must re-paginate to get full list. |
| `slashCommand` | `/v1/commands.run` | PARTIAL | DDP takes a pre-built `{cmd, params, msg, triggerId}` (caller-provided message); REST takes `{command, params, roomId, triggerId, tmid?}` and reconstructs the message internally. Custom message metadata is lost. |
| `executeSlashCommandPreview` | `/v1/commands.preview` (POST) | PARTIAL | Same underlying function; REST drops `msg` and accepts only `{command, params, roomId, tmid?, previewItem, triggerId}`. Acceptable refactor. |
| `sendMessage` | `/v1/chat.sendMessage` | OK | Both call `executeSendMessage`. REST wraps the result as `{message}`; otherwise identical. |
| `createDirectMessage` | `/v1/im.create` | OK | REST calls `createDirectMessage`. Param shape changes (`username`/`usernames`), and result is wrapped, but behavior matches. |
| `registerUser` | `/v1/users.register` | OK | Both call `registerUser`. |
| `cloud:syncWorkspace` | `/v1/cloud.syncWorkspace` | OK | Both call `syncWorkspace` with the same `manage-cloud` permission check. |
| `createPrivateGroup` | `/v1/groups.create` | OK | REST calls `createPrivateGroupMethod`. |
| `e2e.getUsersOfRoomWithoutKey` | `/v1/e2e.getUsersOfRoomWithoutKey` | OK | Identical call site (`getUsersOfRoomWithoutKeyMethod`). |
| `e2e.setRoomKeyID` | `/v1/e2e.setRoomKeyID` | OK | Identical call site (`setRoomKeyIDMethod`). |
| `getSingleMessage` | `/v1/chat.getMessage` | OK | REST calls `getSingleMessage`. |
| `getSlashCommandPreviews` | `/v1/commands.preview` (GET) | OK | Same `getSlashCommandPreviews` function. |
| `personalAccessTokens:generateToken` | `/v1/users.generatePersonalAccessToken` | OK | Same `generatePersonalAccessTokenOfUser`. |
| `personalAccessTokens:regenerateToken` | `/v1/users.regeneratePersonalAccessToken` | OK | Same underlying function. |
| `personalAccessTokens:removeToken` | `/v1/users.removePersonalAccessToken` | OK | Same underlying function. |
| `requestDataDownload` | `/v1/users.requestDataDownload` | OK | Same `requestDataDownload`. |
| `saveRoomSettings` | `/v1/rooms.saveRoomSettings` | OK | Same `saveRoomSettings`. |
| `setUserStatus` | `/v1/users.setStatus` | OK | Same `setUserStatusMethod`. Field names differ (`statusType`→`status`, `statusText`→`message`). |

## Methods audited as "no REST" that DO have a fitting endpoint

These appear in `usedWithoutRest` but a viable REST endpoint exists — likely missed because of naming case or path-shape mismatch in `candidateRoutes()`:

| method | suggested replacement | rationale |
| --- | --- | --- |
| `autoTranslate.getSupportedLanguages` | `/v1/autotranslate.getSupportedLanguages` | Same name with lowercase `autotranslate`. Endpoint exists at `apps/meteor/app/api/server/v1/autotranslate.ts:46`. |
| `autoTranslate.translateMessage` | `/v1/autotranslate.translateMessage` | Endpoint at `apps/meteor/app/api/server/v1/autotranslate.ts:113`. Same underlying `translateMessage` function. |
| `autoTranslate.getProviderUiMetadata` | (none directly) | REST has `autotranslate.saveSettings`/`autotranslate.getSupportedLanguages` but no provider-metadata endpoint. Correctly unmapped. |
| `subscriptions/get` | `/v1/subscriptions.get` | Both call `getSubscriptions`. The DDP path uses `/` separator; the regex apparently only matched dotted method names. |
| `getReadReceipts` | `/v1/chat.getMessageReadReceipts` | EE endpoint at `apps/meteor/ee/server/api/chat.ts:24`. The script did not look in `ee/server/api/`. |

## Observations

- The script's "candidate" heuristic appears to rely on dotted-method/colon-prefix substring matching against `v1/<segment>` paths. It misses (a) snake-cased renames such as `autoTranslate`→`autotranslate`, (b) slash-style method names like `subscriptions/get`, and (c) EE-only endpoints under `apps/meteor/ee/server/api/`.
- Several mappings fall into the "same family of endpoints, wrong member of the family" trap, especially anything `channels.*` proposed for a method that supports all room types. Any caller relying on these for non-channel rooms will silently break.
- The `chat.syncMessages` endpoint was over-applied (mapped to three different history-loading methods that have nothing to do with sync semantics).
- The 2FA TOTP enable/disable methods have no REST counterpart — the email-2FA endpoints were mistakenly used. There is no safe path forward without adding a REST endpoint for TOTP setup/teardown first.
- `banner/dismiss` and `banners.dismiss` are namesakes but call entirely different APIs (`Users.setBannerReadById` vs `Banner.dismiss`); this is a name-collision false positive.
- `saveSettings` is a batched, audited write; `settings/:_id` is single-write only. Removing the DDP method without restoring a batch endpoint would force callers to lose atomicity.
