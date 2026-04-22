# Backend Folder Structure Migration Plan

## Goal

Move server-side files from `apps/meteor/app/*/server/` into `apps/meteor/server/`, extending the existing responsibility-based folder structure. Files move; code stays the same. Import paths update, but no refactoring.

## Design Principle

The existing `server/` structure is organized by **responsibility first, domain second**:

```
server/<responsibility>/<domain>/<file>
```

This migration extends that pattern by:

1. Adding domain subfolders to existing responsibility folders (e.g., `server/methods/rooms/`)
2. Creating new responsibility folders where needed (e.g., `server/functions/`, `server/api/`, `server/commands/`)
3. Preserving all existing `server/` folders untouched

## Target Structure

```
apps/meteor/server/
│
│ ── NEW (from app/*/server/) ──────────────────────────────
│
├── api/                           # REST API (from app/api/server/)
│   ├── v1/                        #   endpoint files: users.ts, rooms.ts, chat.ts...
│   │   └── omnichannel/           #   livechat endpoints (from app/livechat/server/api/v1/)
│   ├── helpers/                   #   getPaginationItems.ts, getUserFromParams.ts...
│   ├── lib/                       #   getUploadFormData.ts, isValidQuery.ts...
│   ├── middlewares/               #   authentication.ts, cors.ts, metrics.ts...
│   ├── ApiClass.ts                #   API framework
│   ├── api.ts                     #   API initialization
│   ├── router.ts                  #   Hono router
│   ├── definition.ts              #   TypeScript types
│   └── ajv.ts                     #   JSON schema validation
│
├── functions/                     # Domain functions (from app/lib/server/functions/ + app/*/server/functions/)
│   ├── users/                     #   setRealName.ts, deleteUser.ts, saveUserIdentity.ts...
│   ├── rooms/                     #   createRoom.ts, addUserToRoom.ts, deleteRoom.ts...
│   ├── messages/                  #   sendMessage.ts, deleteMessage.ts, insertMessage.ts...
│   ├── omnichannel/               #   closeLivechatRoom.ts, closeOmnichannelConversations.ts + app/livechat/server/lib/
│   ├── authorization/             #   hasPermission.ts, canAccessRoom.ts (from app/authorization/server/functions/)
│   ├── cloud/                     #   connectWorkspace.ts, syncWorkspace/ (from app/cloud/server/functions/)
│   └── shared/                    #   validateName.ts, validateNameChars.ts, getModifiedHttpHeaders.ts
│
├── commands/                      # Slash commands (from app/slashcommands-*/server/)
│   ├── archiveroom.ts
│   ├── asciiarts/
│   ├── ban.ts
│   ├── create.ts
│   ├── help.ts
│   ├── hide.ts
│   ├── invite.ts
│   ├── inviteall.ts
│   ├── join.ts
│   ├── kick.ts
│   ├── leave.ts
│   ├── me.ts
│   ├── msg.ts
│   ├── mute.ts
│   ├── status.ts
│   ├── topic.ts
│   ├── unarchiveroom.ts
│   └── index.ts
│
├── bridges/                       # External system adapters
│   ├── apps-engine/               #   (from app/apps/server/bridges/ + converters/)
│   │   ├── bridges/
│   │   └── converters/
│   ├── irc/                       #   (from app/irc/server/)
│   ├── slack/                     #   (from app/slackbridge/server/)
│   ├── smarsh/                    #   (from app/smarsh-connector/server/)
│   ├── webdav/                    #   (from app/webdav/server/)
│   └── nextcloud/                 #   (from app/nextcloud/server/)
│
│ ── EXISTING (extended with domain subfolders) ────────────
│
├── methods/                       # EXISTING — Meteor methods (deprecated)
│   ├── [existing flat files]      #   current files stay in place
│   ├── rooms/                     #   NEW: from app/lib/server/methods/ + app/channel-settings/...
│   ├── users/                     #   NEW: from app/lib/server/methods/
│   ├── messages/                  #   NEW: from app/lib/server/methods/
│   ├── auth/                      #   NEW: from app/authorization/server/methods/ + app/2fa/...
│   ├── omnichannel/               #   NEW: from app/livechat/server/methods/
│   ├── import/                    #   NEW: from app/importer/server/methods/
│   └── integrations/              #   NEW: from app/integrations/server/methods/
│
├── hooks/                         # EXISTING — event handlers
│   ├── [existing flat files]      #   current files stay in place
│   ├── messages/                  #   NEW: afterSaveMessage, threads hooks, discussion hooks
│   ├── auth/                      #   NEW: from app/authentication/server/hooks/
│   ├── rooms/                     #   NEW: beforeAddUserToRoom
│   └── omnichannel/               #   NEW: from app/livechat/server/hooks/
│
├── lib/                           # EXISTING — shared utilities
│   ├── [existing contents]        #   current files stay in place
│   ├── auth-providers/            #   NEW: OAuth providers (apple, github, gitlab, etc.)
│   ├── notifications/             #   NEW: push, email, queue (from app/push/, app/mailer/...)
│   ├── integrations/              #   NEW: webhook lib, trigger handlers
│   ├── import/                    #   NEW: importer classes, definitions
│   ├── media/                     #   NEW: file-upload, emoji, custom-sounds, assets
│   ├── search/                    #   NEW: from app/search/server/
│   ├── autotranslate/             #   NEW: from app/autotranslate/server/
│   ├── e2e/                       #   NEW: from app/e2e/server/
│   ├── 2fa/                       #   NEW: from app/2fa/server/lib/ + classes/
│   ├── saml/                      #   NEW: from app/meteor-accounts-saml/server/
│   └── messaging/                 #   NEW: mentions, markdown, threads lib, reactions, pins, stars
│
├── services/                      # EXISTING — unchanged
├── settings/                      # EXISTING — unchanged
├── cron/                          # EXISTING — unchanged
├── configuration/                 # EXISTING — unchanged
├── startup/                       # EXISTING — unchanged
├── publications/                  # EXISTING — unchanged
├── routes/                        # EXISTING — unchanged
├── modules/                       # EXISTING — unchanged
├── database/                      # EXISTING — unchanged
├── email/                         # EXISTING — unchanged
├── ufs/                           # EXISTING — unchanged
├── oauth2-server/                 # EXISTING — unchanged
├── features/                      # EXISTING — unchanged
├── deasync/                       # EXISTING — unchanged
├── models.ts                      # EXISTING — unchanged
├── main.ts                        # EXISTING — updated imports
├── tracing.ts                     # EXISTING — unchanged
└── importPackages.ts              # EXISTING — updated imports
```

---

## Migration Phases

The migration is split into 7 phases, ordered by risk (lowest first) and dependency (foundations first). Each phase is independently shippable — the app works after every phase.

### Phase 0: Preparation

**Goal**: Write disposable migration scripts. These are one-time-use tools — run them, verify the result, delete them. They don't need to live in the repository permanently.

**No path aliases.** Both TypeScript `paths` and Node.js subpath `imports` add configuration surface across the build system (Meteor bundler, Jest, Mocha) for little benefit. Plain relative imports are universally understood by all tools with zero config. The migration scripts handle path updates directly.

**No re-export stubs.** We control the entire codebase, so every import can be updated in the same commit as the file move. No transition period needed.

**Scripts** (disposable, deleted after use):

1. **`move-file.sh <old-path> <new-path>`** — Moves a single file and fixes all imports.
   - `mkdir -p` the target directory
   - `git mv` the file from old to new location
   - Compute the import specifier other files use for this file (strip `.ts`, handle `index.ts`)
   - `grep -rl` to find every file importing the old path
   - For each importer, compute the new relative path and replace the import
   - If the file has co-located tests (`.spec.ts`, `.tests.ts`), move those too

2. **`move-batch.sh <manifest-file>`** — Moves a batch of files from a TSV manifest.
   - Reads the manifest line by line (`old-path<TAB>new-path`)
   - Calls `move-file.sh` for each entry
   - After all moves, runs `tsc --noEmit` once to verify nothing broke
   - Reports: files moved, imports updated, any errors

3. **`verify-no-old-imports.sh`** — Checks that no imports still point to `app/*/server/` for already-moved files. Run after each phase to catch stragglers.

Each phase produces a manifest file (the tables below), feeds it to `move-batch.sh`, verifies with `tsc --noEmit`, and commits the result. The scripts themselves are deleted once all phases are complete.

**Deliverable**: Scripts written and tested on a small dry-run (e.g., move one slash command file, verify, revert).

---

### Phase 1: Slash Commands (18 folders → 1 directory)

**Goal**: Quick win. 18 tiny folders with 1-3 files each consolidate into `server/commands/`.

**Risk**: Very low. Slash commands are leaf nodes — nothing imports from them.

**Scope**: ~40 files

| Source                                             | Destination                        |
| -------------------------------------------------- | ---------------------------------- |
| `app/slashcommand-asciiarts/server/`               | `server/commands/asciiarts/`       |
| `app/slashcommands-archiveroom/server/server.ts`   | `server/commands/archiveroom.ts`   |
| `app/slashcommands-ban/server/server.ts`           | `server/commands/ban.ts`           |
| `app/slashcommands-create/server/server.ts`        | `server/commands/create.ts`        |
| `app/slashcommands-help/server/server.ts`          | `server/commands/help.ts`          |
| `app/slashcommands-hide/server/server.ts`          | `server/commands/hide.ts`          |
| `app/slashcommands-invite/server/server.ts`        | `server/commands/invite.ts`        |
| `app/slashcommands-inviteall/server/server.ts`     | `server/commands/inviteall.ts`     |
| `app/slashcommands-join/server/server.ts`          | `server/commands/join.ts`          |
| `app/slashcommands-kick/server/server.ts`          | `server/commands/kick.ts`          |
| `app/slashcommands-leave/server/server.ts`         | `server/commands/leave.ts`         |
| `app/slashcommands-me/server/server.ts`            | `server/commands/me.ts`            |
| `app/slashcommands-msg/server/server.ts`           | `server/commands/msg.ts`           |
| `app/slashcommands-mute/server/server.ts`          | `server/commands/mute.ts`          |
| `app/slashcommands-status/server/server.ts`        | `server/commands/status.ts`        |
| `app/slashcommands-topic/server/server.ts`         | `server/commands/topic.ts`         |
| `app/slashcommands-unarchiveroom/server/server.ts` | `server/commands/unarchiveroom.ts` |

**Import updates**: Each slash command file typically has 0-2 external importers. Update `server/importPackages.ts` to import from the new location.

**Verification**: `tsc --noEmit`, manual test of 2-3 slash commands (e.g., `/invite`, `/kick`, `/topic`).

---

### Phase 2: External Bridges (5 folders → `server/bridges/`)

**Goal**: Move isolated bridge code that has no inbound importers.

**Risk**: Low. Bridges are leaf nodes — they import from the core but nothing imports from them.

**Scope**: ~48 files

| Source                         | Destination                              |
| ------------------------------ | ---------------------------------------- |
| `app/apps/server/bridges/`     | `server/bridges/apps-engine/bridges/`    |
| `app/apps/server/converters/`  | `server/bridges/apps-engine/converters/` |
| `app/irc/server/`              | `server/bridges/irc/`                    |
| `app/slackbridge/server/`      | `server/bridges/slack/`                  |
| `app/smarsh-connector/server/` | `server/bridges/smarsh/`                 |
| `app/webdav/server/`           | `server/bridges/webdav/`                 |
| `app/nextcloud/server/`        | `server/bridges/nextcloud/`              |

**Note**: The `app/apps/server/` folder has more than just bridges (lib/, hooks/, etc.). Only move the bridges/ and converters/ subdirectories in this phase. The rest of `app/apps/` moves in Phase 5.

**Verification**: `tsc --noEmit`, test an incoming webhook and an Apps Engine app.

---

### Phase 3: REST API Infrastructure (1 folder → `server/api/`)

**Goal**: Move the API framework and all REST endpoints into `server/api/`.

**Risk**: Medium. The API folder is large (92 files) and is imported by `server/main.ts`. However, it's a cohesive unit — it moves as a block.

**Scope**: ~92 files + ~43 livechat API files

| Source                                  | Destination                  |
| --------------------------------------- | ---------------------------- |
| `app/api/server/v1/*.ts`                | `server/api/v1/`             |
| `app/api/server/helpers/`               | `server/api/helpers/`        |
| `app/api/server/lib/`                   | `server/api/lib/`            |
| `app/api/server/middlewares/`           | `server/api/middlewares/`    |
| `app/api/server/ApiClass.ts`            | `server/api/ApiClass.ts`     |
| `app/api/server/api.ts`                 | `server/api/api.ts`          |
| `app/api/server/router.ts`              | `server/api/router.ts`       |
| `app/api/server/definition.ts`          | `server/api/definition.ts`   |
| `app/api/server/ajv.ts`                 | `server/api/ajv.ts`          |
| `app/api/server/default/`               | `server/api/default/`        |
| `app/livechat/server/api/v1/*.ts`       | `server/api/v1/omnichannel/` |
| `app/livechat/imports/server/rest/*.ts` | `server/api/v1/omnichannel/` |

**Key import update**: `server/main.ts` currently imports `../app/api/server/api` — update to `./api/api`.

**Sub-steps**:

1. Move the API framework files first (ApiClass.ts, router.ts, api.ts, definition.ts, ajv.ts, middlewares/)
2. Move helpers/ and lib/
3. Move v1/ endpoint files
4. Move livechat API files into v1/omnichannel/
5. Update `server/main.ts` and all cross-references

**Verification**: `tsc --noEmit`, run the REST API test suite, test a few endpoints manually.

---

### Phase 4: Domain Functions (`server/functions/`)

**Goal**: Create `server/functions/` and populate it with domain functions from `app/lib/server/functions/` and `app/*/server/functions/`. This is the largest and most impactful phase.

**Risk**: Medium-high. These functions are heavily imported across the codebase (~62 features import from `app/lib/server`). The migration script updates all import paths in the same commit.

**Scope**: ~80 files

**Strategy**: Move files and update all imports in a single commit per sub-phase. No re-export stubs — every importer is updated immediately.

#### Phase 4a: User Functions (~19 files)

| Source                                                          | Destination                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------- |
| `app/lib/server/functions/setRealName.ts`                       | `server/functions/users/setRealName.ts`                       |
| `app/lib/server/functions/setUsername.ts`                       | `server/functions/users/setUsername.ts`                       |
| `app/lib/server/functions/setEmail.ts`                          | `server/functions/users/setEmail.ts`                          |
| `app/lib/server/functions/saveUserIdentity.ts`                  | `server/functions/users/saveUserIdentity.ts`                  |
| `app/lib/server/functions/setUserAvatar.ts`                     | `server/functions/users/setUserAvatar.ts`                     |
| `app/lib/server/functions/setUserActiveStatus.ts`               | `server/functions/users/setUserActiveStatus.ts`               |
| `app/lib/server/functions/setStatusText.ts`                     | `server/functions/users/setStatusText.ts`                     |
| `app/lib/server/functions/getStatusText.ts`                     | `server/functions/users/getStatusText.ts`                     |
| `app/lib/server/functions/deleteUser.ts`                        | `server/functions/users/deleteUser.ts`                        |
| `app/lib/server/functions/getFullUserData.ts`                   | `server/functions/users/getFullUserData.ts`                   |
| `app/lib/server/functions/getUsernameSuggestion.ts`             | `server/functions/users/getUsernameSuggestion.ts`             |
| `app/lib/server/functions/getUserCreatedByApp.ts`               | `server/functions/users/getUserCreatedByApp.ts`               |
| `app/lib/server/functions/getUserSingleOwnedRooms.ts`           | `server/functions/users/getUserSingleOwnedRooms.ts`           |
| `app/lib/server/functions/getAvatarSuggestionForUser.ts`        | `server/functions/users/getAvatarSuggestionForUser.ts`        |
| `app/lib/server/functions/checkEmailAvailability.ts`            | `server/functions/users/checkEmailAvailability.ts`            |
| `app/lib/server/functions/checkUsernameAvailability.ts`         | `server/functions/users/checkUsernameAvailability.ts`         |
| `app/lib/server/functions/validateUsername.ts`                  | `server/functions/users/validateUsername.ts`                  |
| `app/lib/server/functions/saveCustomFields.ts`                  | `server/functions/users/saveCustomFields.ts`                  |
| `app/lib/server/functions/saveCustomFieldsWithoutValidation.ts` | `server/functions/users/saveCustomFieldsWithoutValidation.ts` |

#### Phase 4b: Room Functions (~16 files)

| Source                                                          | Destination                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------- |
| `app/lib/server/functions/createRoom.ts`                        | `server/functions/rooms/createRoom.ts`                        |
| `app/lib/server/functions/createDirectRoom.ts`                  | `server/functions/rooms/createDirectRoom.ts`                  |
| `app/lib/server/functions/deleteRoom.ts`                        | `server/functions/rooms/deleteRoom.ts`                        |
| `app/lib/server/functions/archiveRoom.ts`                       | `server/functions/rooms/archiveRoom.ts`                       |
| `app/lib/server/functions/unarchiveRoom.ts`                     | `server/functions/rooms/unarchiveRoom.ts`                     |
| `app/lib/server/functions/addUserToRoom.ts`                     | `server/functions/rooms/addUserToRoom.ts`                     |
| `app/lib/server/functions/addUserToDefaultChannels.ts`          | `server/functions/rooms/addUserToDefaultChannels.ts`          |
| `app/lib/server/functions/removeUserFromRoom.ts`                | `server/functions/rooms/removeUserFromRoom.ts`                |
| `app/lib/server/functions/acceptRoomInvite.ts`                  | `server/functions/rooms/acceptRoomInvite.ts`                  |
| `app/lib/server/functions/cleanRoomHistory.ts`                  | `server/functions/rooms/cleanRoomHistory.ts`                  |
| `app/lib/server/functions/getRoomByNameOrIdWithOptionToJoin.ts` | `server/functions/rooms/getRoomByNameOrIdWithOptionToJoin.ts` |
| `app/lib/server/functions/getRoomsWithSingleOwner.ts`           | `server/functions/rooms/getRoomsWithSingleOwner.ts`           |
| `app/lib/server/functions/joinDefaultChannels.ts`               | `server/functions/rooms/joinDefaultChannels.ts`               |
| `app/lib/server/functions/relinquishRoomOwnerships.ts`          | `server/functions/rooms/relinquishRoomOwnerships.ts`          |
| `app/lib/server/functions/setRoomAvatar.ts`                     | `server/functions/rooms/setRoomAvatar.ts`                     |
| `app/lib/server/functions/updateGroupDMsName.ts`                | `server/functions/rooms/updateGroupDMsName.ts`                |
| `app/lib/server/functions/banUserFromRoom.ts`                   | `server/functions/rooms/banUserFromRoom.ts`                   |
| `app/lib/server/functions/executeUnbanUserFromRoom.ts`          | `server/functions/rooms/executeUnbanUserFromRoom.ts`          |

#### Phase 4c: Message Functions (~10 files)

| Source                                                      | Destination                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| `app/lib/server/functions/sendMessage.ts`                   | `server/functions/messages/sendMessage.ts`                   |
| `app/lib/server/functions/insertMessage.ts`                 | `server/functions/messages/insertMessage.ts`                 |
| `app/lib/server/functions/deleteMessage.ts`                 | `server/functions/messages/deleteMessage.ts`                 |
| `app/lib/server/functions/updateMessage.ts`                 | `server/functions/messages/updateMessage.ts`                 |
| `app/lib/server/functions/loadMessageHistory.ts`            | `server/functions/messages/loadMessageHistory.ts`            |
| `app/lib/server/functions/processWebhookMessage.ts`         | `server/functions/messages/processWebhookMessage.ts`         |
| `app/lib/server/functions/parseUrlsInMessage.ts`            | `server/functions/messages/parseUrlsInMessage.ts`            |
| `app/lib/server/functions/attachMessage.ts`                 | `server/functions/messages/attachMessage.ts`                 |
| `app/lib/server/functions/isTheLastMessage.ts`              | `server/functions/messages/isTheLastMessage.ts`              |
| `app/lib/server/functions/extractUrlsFromMessageAST.ts`     | `server/functions/messages/extractUrlsFromMessageAST.ts`     |
| `app/lib/server/functions/extractMentionsFromMessageAST.ts` | `server/functions/messages/extractMentionsFromMessageAST.ts` |

#### Phase 4d: Other Domain Functions

| Source                                                            | Destination                                                     |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| `app/lib/server/functions/closeLivechatRoom.ts`                   | `server/functions/omnichannel/closeLivechatRoom.ts`             |
| `app/lib/server/functions/closeOmnichannelConversations.ts`       | `server/functions/omnichannel/closeOmnichannelConversations.ts` |
| `app/lib/server/functions/syncRolePrioritiesForRoomIfRequired.ts` | `server/functions/rooms/syncRolePrioritiesForRoomIfRequired.ts` |
| `app/lib/server/functions/validateName.ts`                        | `server/functions/shared/validateName.ts`                       |
| `app/lib/server/functions/validateNameChars.ts`                   | `server/functions/shared/validateNameChars.ts`                  |
| `app/lib/server/functions/getModifiedHttpHeaders.ts`              | `server/functions/shared/getModifiedHttpHeaders.ts`             |
| `app/lib/server/functions/disableCustomScripts.ts`                | `server/functions/shared/disableCustomScripts.ts`               |
| `app/authorization/server/functions/*.ts`                         | `server/functions/authorization/`                               |
| `app/cloud/server/functions/*.ts`                                 | `server/functions/cloud/`                                       |
| `app/livechat/server/lib/*.ts` (functions)                        | `server/functions/omnichannel/`                                 |
| `app/file-upload/server/functions/*.ts`                           | `server/functions/media/`                                       |

**Verification per sub-phase**: `tsc --noEmit`, run unit tests for the moved functions, run integration tests.

---

### Phase 5: Meteor Methods (from app/\*/server/methods/ → `server/methods/<domain>/`)

**Goal**: Consolidate all Meteor methods from feature folders into `server/methods/` with domain subfolders.

**Risk**: Medium. Methods are entry points — nothing imports them, they just need to be loaded at startup. The main risk is missing a method registration.

**Scope**: ~100 files

**Note**: The existing files in `server/methods/` (flat structure) stay in place. New domain subfolders are added alongside them. Over time, the flat files can be moved into the appropriate domain subfolder too, but that's optional in this migration.

| Source                                            | Destination                                     |
| ------------------------------------------------- | ----------------------------------------------- |
| `app/lib/server/methods/setRealName.ts`           | `server/methods/users/setRealName.ts`           |
| `app/lib/server/methods/setEmail.ts`              | `server/methods/users/setEmail.ts`              |
| `app/lib/server/methods/blockUser.ts`             | `server/methods/users/blockUser.ts`             |
| `app/lib/server/methods/unblockUser.ts`           | `server/methods/users/unblockUser.ts`           |
| `app/lib/server/methods/deleteUserOwnAccount.ts`  | `server/methods/users/deleteUserOwnAccount.ts`  |
| `app/lib/server/methods/getUsernameSuggestion.ts` | `server/methods/users/getUsernameSuggestion.ts` |
| `app/lib/server/methods/createChannel.ts`         | `server/methods/rooms/createChannel.ts`         |
| `app/lib/server/methods/createPrivateGroup.ts`    | `server/methods/rooms/createPrivateGroup.ts`    |
| `app/lib/server/methods/addUserToRoom.ts`         | `server/methods/rooms/addUserToRoom.ts`         |
| `app/lib/server/methods/addUsersToRoom.ts`        | `server/methods/rooms/addUsersToRoom.ts`        |
| `app/lib/server/methods/archiveRoom.ts`           | `server/methods/rooms/archiveRoom.ts`           |
| `app/lib/server/methods/unarchiveRoom.ts`         | `server/methods/rooms/unarchiveRoom.ts`         |
| `app/lib/server/methods/leaveRoom.ts`             | `server/methods/rooms/leaveRoom.ts`             |
| `app/lib/server/methods/joinRoom.ts`              | `server/methods/rooms/joinRoom.ts`              |
| `app/lib/server/methods/joinDefaultChannels.ts`   | `server/methods/rooms/joinDefaultChannels.ts`   |
| `app/lib/server/methods/cleanRoomHistory.ts`      | `server/methods/rooms/cleanRoomHistory.ts`      |
| `app/lib/server/methods/getRoomJoinCode.ts`       | `server/methods/rooms/getRoomJoinCode.ts`       |
| `app/lib/server/methods/sendMessage.ts`           | `server/methods/messages/sendMessage.ts`        |
| `app/lib/server/methods/updateMessage.ts`         | `server/methods/messages/updateMessage.ts`      |
| `app/lib/server/methods/getChannelHistory.ts`     | `server/methods/messages/getChannelHistory.ts`  |
| `app/lib/server/methods/getMessages.ts`           | `server/methods/messages/getMessages.ts`        |
| `app/lib/server/methods/getSingleMessage.ts`      | `server/methods/messages/getSingleMessage.ts`   |
| `app/lib/server/methods/addOAuthService.ts`       | `server/methods/auth/addOAuthService.ts`        |
| `app/lib/server/methods/refreshOAuthService.ts`   | `server/methods/auth/refreshOAuthService.ts`    |
| `app/lib/server/methods/removeOAuthService.ts`    | `server/methods/auth/removeOAuthService.ts`     |
| `app/lib/server/methods/createToken.ts`           | `server/methods/auth/createToken.ts`            |
| `app/lib/server/methods/saveSetting.ts`           | `server/methods/settings/saveSetting.ts`        |
| `app/lib/server/methods/saveSettings.ts`          | `server/methods/settings/saveSettings.ts`       |
| `app/authorization/server/methods/*.ts`           | `server/methods/auth/`                          |
| `app/2fa/server/methods/*.ts`                     | `server/methods/auth/`                          |
| `app/channel-settings/server/methods/*.ts`        | `server/methods/rooms/`                         |
| `app/threads/server/methods/*.ts`                 | `server/methods/messages/`                      |
| `app/discussion/server/methods/*.ts`              | `server/methods/messages/`                      |
| `app/livechat/server/methods/*.ts`                | `server/methods/omnichannel/`                   |
| `app/integrations/server/methods/*.ts`            | `server/methods/integrations/`                  |
| `app/importer/server/methods/*.ts`                | `server/methods/import/`                        |
| `app/autotranslate/server/methods/*.ts`           | `server/methods/platform/`                      |
| `app/e2e/server/methods/*.ts`                     | `server/methods/platform/`                      |

**Import updates**: Update `server/importPackages.ts` and any `server/methods/index.ts` that aggregates method registrations.

**Verification**: `tsc --noEmit`, test several Meteor methods via DDP client.

---

### Phase 6: Lib, Hooks, and Feature-Specific Code

**Goal**: Move remaining feature-specific code: hooks, lib files, auth providers, notification code, and other domain-specific libraries.

**Risk**: Medium. These files have more cross-references than the previous phases.

**Scope**: ~300 files

#### Phase 6a: Auth Providers (~30 files)

| Source                                    | Destination                                      |
| ----------------------------------------- | ------------------------------------------------ |
| `app/apple/server/`                       | `server/lib/auth-providers/apple.ts`             |
| `app/crowd/server/`                       | `server/lib/auth-providers/crowd/`               |
| `app/custom-oauth/server/`                | `server/lib/auth-providers/custom-oauth.ts`      |
| `app/dolphin/server/`                     | `server/lib/auth-providers/dolphin.ts`           |
| `app/drupal/server/`                      | `server/lib/auth-providers/drupal.ts`            |
| `app/github/server/`                      | `server/lib/auth-providers/github.ts`            |
| `app/github-enterprise/server/`           | `server/lib/auth-providers/github-enterprise.ts` |
| `app/gitlab/server/`                      | `server/lib/auth-providers/gitlab.ts`            |
| `app/google-oauth/server/`                | `server/lib/auth-providers/google.ts`            |
| `app/iframe-login/server/`                | `server/lib/auth-providers/iframe.ts`            |
| `app/wordpress/server/`                   | `server/lib/auth-providers/wordpress.ts`         |
| `app/lib/server/oauth/*.js`               | `server/lib/auth-providers/oauth/`               |
| `app/meteor-accounts-saml/server/`        | `server/lib/saml/`                               |
| `app/2fa/server/lib/` + `server/classes/` | `server/lib/2fa/`                                |
| `app/authentication/server/` (non-hooks)  | `server/lib/auth/`                               |
| `app/token-login/server/`                 | `server/lib/auth/token-login.ts`                 |

#### Phase 6b: Hooks (~25 files)

| Source                                             | Destination                                           |
| -------------------------------------------------- | ----------------------------------------------------- |
| `app/authentication/server/hooks/*.ts`             | `server/hooks/auth/`                                  |
| `app/discussion/server/hooks/*.ts`                 | `server/hooks/messages/`                              |
| `app/threads/server/hooks/*.ts`                    | `server/hooks/messages/`                              |
| `app/livechat/server/hooks/*.ts`                   | `server/hooks/omnichannel/`                           |
| `app/lib/server/lib/afterSaveMessage.ts`           | `server/hooks/messages/afterSaveMessage.ts`           |
| `app/lib/server/lib/notifyUsersOnMessage.ts`       | `server/hooks/messages/notifyUsersOnMessage.ts`       |
| `app/lib/server/lib/sendNotificationsOnMessage.ts` | `server/hooks/messages/sendNotificationsOnMessage.ts` |
| `app/lib/server/lib/beforeAddUserToRoom.ts`        | `server/hooks/rooms/beforeAddUserToRoom.ts`           |

#### Phase 6c: Notification Libraries (~20 files)

| Source                           | Destination                               |
| -------------------------------- | ----------------------------------------- |
| `app/push/server/`               | `server/lib/notifications/push/`          |
| `app/push-notifications/server/` | `server/lib/notifications/push-config/`   |
| `app/mailer/server/`             | `server/lib/notifications/email/`         |
| `app/mail-messages/server/`      | `server/lib/notifications/mail-messages/` |
| `app/notification-queue/server/` | `server/lib/notifications/queue/`         |
| `app/notifications/server/`      | `server/lib/notifications/core/`          |

#### Phase 6d: Messaging Libraries (~25 files)

| Source                                            | Destination                         |
| ------------------------------------------------- | ----------------------------------- |
| `app/threads/server/` (non-methods, non-hooks)    | `server/lib/messaging/threads/`     |
| `app/discussion/server/` (non-methods, non-hooks) | `server/lib/messaging/discussions/` |
| `app/reactions/server/`                           | `server/lib/messaging/reactions/`   |
| `app/message-pin/server/`                         | `server/lib/messaging/pins/`        |
| `app/message-star/server/`                        | `server/lib/messaging/stars/`       |
| `app/message-mark-as-unread/server/`              | `server/lib/messaging/unread/`      |
| `app/mentions/server/`                            | `server/lib/messaging/mentions/`    |
| `app/markdown/server/`                            | `server/lib/messaging/markdown/`    |
| `app/emoji/server/`                               | `server/lib/messaging/emoji/`       |
| `app/highlight-words/` (if server code exists)    | `server/lib/messaging/highlight/`   |

#### Phase 6e: Media, Import, Search, and Remaining Libraries

| Source                                      | Destination                               |
| ------------------------------------------- | ----------------------------------------- |
| `app/file-upload/server/` (non-functions)   | `server/lib/media/file-upload/`           |
| `app/file/server/`                          | `server/lib/media/file/`                  |
| `app/emoji-custom/server/`                  | `server/lib/media/emoji-custom/`          |
| `app/emoji-emojione/server/`                | `server/lib/media/emoji-emojione/`        |
| `app/custom-sounds/server/`                 | `server/lib/media/custom-sounds/`         |
| `app/assets/server/`                        | `server/lib/media/assets/`                |
| `app/importer/server/` (non-methods)        | `server/lib/import/`                      |
| `app/importer-csv/server/`                  | `server/lib/import/csv/`                  |
| `app/importer-slack/server/`                | `server/lib/import/slack/`                |
| `app/importer-slack-users/server/`          | `server/lib/import/slack-users/`          |
| `app/importer-omnichannel-contacts/server/` | `server/lib/import/omnichannel-contacts/` |
| `app/importer-pending-avatars/server/`      | `server/lib/import/pending-avatars/`      |
| `app/importer-pending-files/server/`        | `server/lib/import/pending-files/`        |
| `app/search/server/`                        | `server/lib/search/`                      |
| `app/autotranslate/server/` (non-methods)   | `server/lib/autotranslate/`               |
| `app/e2e/server/` (non-methods)             | `server/lib/e2e/`                         |
| `app/integrations/server/` (non-methods)    | `server/lib/integrations/`                |
| `app/statistics/server/`                    | `server/lib/statistics/`                  |
| `app/metrics/server/`                       | `server/lib/metrics/`                     |
| `app/cloud/server/` (non-functions)         | `server/lib/cloud/`                       |
| `app/version-check/server/`                 | `server/lib/cloud/version-check/`         |
| `app/license/server/`                       | `server/lib/cloud/license/`               |

**Verification**: `tsc --noEmit` after each sub-phase, full test suite at end of Phase 6.

---

### Phase 7: Omnichannel and Remaining Cleanup

**Goal**: Move the largest single feature (livechat, 132 files) and clean up remaining files.

**Risk**: Medium-high. Livechat is the largest feature and has many internal dependencies. Move it as a cohesive unit.

**Scope**: ~150 files

| Source                             | Destination                                                 |
| ---------------------------------- | ----------------------------------------------------------- |
| `app/livechat/server/lib/`         | `server/functions/omnichannel/` + `server/lib/omnichannel/` |
| `app/livechat/server/methods/`     | Already moved in Phase 5                                    |
| `app/livechat/server/hooks/`       | Already moved in Phase 6b                                   |
| `app/livechat/server/api/`         | Already moved in Phase 3                                    |
| `app/livechat/server/` (remaining) | `server/lib/omnichannel/`                                   |
| `app/livechat-enterprise/server/`  | `server/lib/omnichannel/enterprise/` (if exists)            |

**Remaining cleanup**:

- `app/channel-settings/server/` (non-methods) → `server/lib/rooms/settings/`
- `app/invites/server/` → `server/lib/rooms/invites/`
- `app/retention-policy/server/` → `server/lib/rooms/retention/`
- `app/user-status/server/` → `server/lib/users/status/`
- `app/bot-helpers/server/` → `server/lib/commands/bot-helpers.ts`
- `app/cors/server/` → `server/lib/cors/`
- `app/error-handler/server/` → `server/lib/error-handler/`
- `app/oauth2-server-config/server/` → `server/lib/auth/oauth2-server/`
- `app/settings/server/` → `server/settings/` (merge with existing)
- `app/theme/server/` → `server/settings/theme/`
- `app/utils/server/` → `server/lib/utils/`
- `app/ui-master/server/` → `server/lib/ui-master/`
- Delete `app/lib/server/index.ts` (should be empty by now)
- Update `server/importPackages.ts` to remove all `app/` imports
- Verify no remaining imports from `app/*/server/`
- Delete the migration scripts (`move-file.sh`, `move-batch.sh`, `verify-no-old-imports.sh`)

**Final verification**: Full `tsc --noEmit`, full test suite, manual smoke test of core features (login, send message, create room, livechat, file upload).

---

## Cross-Cutting Concerns

### How to Handle `app/lib/server/lib/` (Utility Files)

These files don't fit neatly into `functions/` because they're hooks, utilities, or notification orchestration:

| File                             | Destination                 | Reason                     |
| -------------------------------- | --------------------------- | -------------------------- |
| `afterSaveMessage.ts`            | `server/hooks/messages/`    | It's a hook                |
| `notifyUsersOnMessage.ts`        | `server/hooks/messages/`    | It's a hook                |
| `sendNotificationsOnMessage.ts`  | `server/hooks/messages/`    | It's a hook                |
| `beforeAddUserToRoom.ts`         | `server/hooks/rooms/`       | It's a hook                |
| `notifyListener.ts`              | `server/lib/` (stays)       | Already effectively in lib |
| `msgStream.ts`                   | `server/lib/messaging/`     | Messaging utility          |
| `validateCustomMessageFields.ts` | `server/lib/messaging/`     | Messaging utility          |
| `bugsnag.ts`                     | `server/lib/`               | Infrastructure             |
| `deprecationWarningLogger.ts`    | `server/lib/`               | Infrastructure             |
| `passwordPolicy.ts`              | `server/lib/auth/`          | Auth utility               |
| `generatePassword.ts`            | `server/lib/auth/`          | Auth utility               |
| `loginErrorMessageOverride.ts`   | `server/lib/auth/`          | Auth utility               |
| `processDirectEmail.ts`          | `server/lib/notifications/` | Email processing           |
| `getHiddenSystemMessages.ts`     | `server/lib/messaging/`     | Messaging utility          |
| `defaultBlockedDomainsList.ts`   | `server/lib/`               | Configuration data         |
| `checkSettingValueBonds.ts`      | `server/settings/`          | Settings utility           |

### How to Handle `app/lib/server/startup/`

| File                         | Destination                                        |
| ---------------------------- | -------------------------------------------------- |
| `index.ts`                   | Updated to import from new paths                   |
| `rateLimiter.js`             | `server/startup/rateLimiter.js`                    |
| `robots.js`                  | `server/startup/robots.js`                         |
| `mentionUserNotInChannel.ts` | `server/hooks/messages/mentionUserNotInChannel.ts` |

### How to Handle `app/lib/server/index.ts`

This file is the main import aggregator for the app/lib module. As files move out, update this file to remove the corresponding imports. Once all files are moved, delete `app/lib/server/index.ts` entirely.

---

## Risks and Mitigations

| Risk                                                                          | Mitigation                                                                                                         |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Broken imports** — moving 800+ files changes import paths everywhere        | Migration script updates all imports in the same commit as the file move; `tsc --noEmit` verifies after each batch |
| **Missing method registration** — Meteor methods must be imported to register | Each phase verifies that all methods still register by checking `tsc --noEmit` and running method-specific tests   |
| **Merge conflicts** — other developers working on moved files                 | Communicate migration schedule; do large moves in low-activity windows; each phase is a separate PR                |
| **`app/lib/server/` is a dependency hub** — 62 features import from it        | Migration script handles all import updates atomically per batch; `verify-no-old-imports.sh` catches stragglers    |
| **Omnichannel is huge** — 132 files in livechat                               | Move incrementally: API in Phase 3, methods in Phase 5, hooks in Phase 6, lib in Phase 7                           |
| **Test breakage** — tests may import from old paths                           | Update test imports in the same PR as the file move; tests co-located with source files move together              |

---

## What This Plan Does NOT Do

- **No code refactoring.** Files move as-is. Business logic stays the same.
- **No service consolidation.** Services stay in `server/services/` untouched.
- **No Meteor method removal.** Methods move to `server/methods/<domain>/` but continue to work.
- **No new abstractions.** No port interfaces, no dependency injection, no new TypeScript patterns.
- **No reorganization of existing `server/` files.** Everything already in `server/` stays in place. Domain subfolders are additive.

---

## After the Migration

Once all files are in `server/`, the following improvements become possible (but are separate work):

1. **Move business logic from `functions/` into `services/`** — the service layer becomes the single source of truth
2. **Delete Meteor methods** — the `server/methods/` directory can be emptied feature by feature
3. **Delete publications** — `server/publications/` can be emptied as DDP is removed
4. **Add `index.ts` exports** to each `functions/<domain>/` for a clean public API
5. **Add ESLint layer rules** — e.g., `methods/` cannot import from `api/`, `functions/` cannot import from `methods/`
6. **Reorganize `server/lib/`** into a cleaner structure (it will have grown with auth-providers, messaging, notifications, etc.)
