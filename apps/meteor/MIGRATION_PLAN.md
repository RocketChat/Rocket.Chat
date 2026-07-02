# Backend Folder Structure Migration Plan

## Goal

Move server-side files from `apps/meteor/app/*/server/` into `apps/meteor/server/`, extending the existing responsibility-based folder structure. Files move; code stays the same. Import paths update, but no refactoring.

## Design Principle

The existing `server/` structure is organized by **responsibility first, domain second**:

```
server/<responsibility>/<domain>/<file>
```

This migration extends that pattern by:

1. Adding domain subfolders to existing responsibility folders (e.g., `server/meteor-methods/rooms/`)
2. Creating new responsibility folders where needed (e.g., `server/api/`, `server/slashcommands/`)
3. Extending `server/lib/` with domain subfolders for functions and shared libraries
4. Preserving all existing `server/` folders untouched

## License Boundary (EE) — Hard Constraint

**Enterprise code is governed by a different license** (the Rocket.Chat Enterprise Edition license, e.g. `apps/meteor/ee/LICENSE`) from the rest of the repository. The directory boundary _is_ the license boundary: code is protected by the Enterprise license **only** because it physically lives under an `ee/` path.

This produces one non-negotiable rule for the entire migration:

> **EE files never leave EE.** A file whose path contains an `ee/` segment must have a destination whose path also contains the corresponding `ee/` segment. Moving EE code into a community location would silently relicense it and is forbidden in every phase.

### Where EE code lives (and what this plan touches)

| EE location                      | What it is                                                    | In scope?                                                |
| -------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| `apps/meteor/ee/`                | EE code inside the meteor app (`apps/meteor/ee/LICENSE`)      | **Yes** — restructured by the [EE Mirror](#ee-mirror-restructuring-within-ee), staying inside `apps/meteor/ee/` |
| `ee/apps/` (repo root)           | Standalone EE microservice apps (ddp-streamer, presence-service, queue-worker, …) | **No** — separate Yarn workspaces, not part of the `apps/meteor` restructure |
| `ee/packages/` (repo root)       | Standalone EE packages (abac, federation-matrix, license, …)  | **No** — separate Yarn workspaces                        |
| `packages/*/src/ee/` (e.g. `core-typings`) | EE-licensed subtrees embedded in community packages | **No** — this plan does not touch `packages/`            |

This migration is strictly an **`apps/meteor/` internal restructure**. The only EE code it moves is `apps/meteor/ee/app/*/server/` → `apps/meteor/ee/server/`. Everything else under an `ee/` path is left untouched.

Consequences:

- **The community phases (1–7) only touch community sources** under `apps/meteor/app/**` and `apps/meteor/server/**`. None of their source paths may contain an `ee/` segment.
- **EE code in the meteor app is restructured by an exact mirror within `apps/meteor/ee/`** — see the [EE Mirror](#ee-mirror-restructuring-within-ee) section. `ee/app/*/server/` moves into `ee/server/`, which already has the same responsibility-based folders (`api/`, `hooks/`, `lib/`, `methods/`, `services/`, `settings/`, `startup/`, …).
- **Community ⇄ EE imports stay as imports.** EE code already imports from the community tree and vice versa; the migration only rewrites paths, never relocates a file across the boundary to "resolve" an import.

## Target Structure

```
apps/meteor/server/
│
│ ── NEW (from app/*/server/) ──────────────────────────────
│
├── api/                           # REST API (from app/api/server/)
│   ├── v1/                        #   endpoint files: users.ts, rooms.ts, chat.ts...
│   │   ├── omnichannel/           #   livechat endpoints (from app/livechat/server/api/v1/)
│   │   └── middlewares/           #   authentication.ts, cors.ts, metrics.ts...
│   ├── lib/                       #   helpers + lib merged: getPaginationItems.ts, getUploadFormData.ts...
│   ├── validation/                #   ajv.ts — JSON schema validation
│   ├── ApiClass.ts                #   API framework
│   ├── api.ts                     #   API initialization
│   ├── router.ts                  #   Hono router
│   └── definition.ts              #   TypeScript types
│
├── slashcommands/                 # Slash commands (from app/slashcommands-*/server/)
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
│   ├── irc/                       #   (from app/irc/server/)
│   ├── slack/                     #   (from app/slackbridge/server/)
│   ├── smarsh/                    #   (from app/smarsh-connector/server/)
│   ├── webdav/                    #   (from app/webdav/server/)
│   └── nextcloud/                 #   (from app/nextcloud/server/)
│                                  #   (app/apps/server/ is out of scope — handled separately)
│
│ ── EXISTING (extended with domain subfolders) ────────────
│
├── meteor-methods/                # EXISTING (renamed from methods/) — Meteor methods (deprecated)
│   ├── rooms/                     #   from app/lib/server/methods/ + app/channel-settings/... + existing flat files
│   ├── users/                     #   from app/lib/server/methods/ + existing flat files
│   ├── messages/                  #   from app/lib/server/methods/ + existing flat files
│   ├── auth/                      #   from app/authorization/server/methods/ + app/2fa/... + existing flat files
│   ├── omnichannel/               #   from app/livechat/server/methods/
│   ├── settings/                  #   from app/lib/server/methods/ + existing flat files
│   ├── platform/                  #   from app/autotranslate/ + app/e2e/ + existing flat files
│   ├── import/                    #   from app/importer/server/methods/
│   ├── integrations/              #   from app/integrations/server/methods/
│   └── index.ts                   #   updated to import from domain subfolders
│
├── hooks/                         # EXISTING — event handlers
│   ├── [existing flat files]      #   current files stay in place
│   ├── messages/                  #   NEW: afterSaveMessage, threads hooks, discussion hooks
│   ├── auth/                      #   NEW: from app/authentication/server/hooks/
│   ├── rooms/                     #   NEW: beforeAddUserToRoom
│   └── omnichannel/               #   NEW: from app/livechat/server/hooks/
│
├── lib/                           # EXISTING — shared utilities + domain functions
│   ├── [existing contents]        #   current files stay in place
│   ├── users/                     #   NEW: domain functions (setRealName.ts, deleteUser.ts, saveUserIdentity.ts...)
│   ├── rooms/                     #   NEW: domain functions (createRoom.ts, addUserToRoom.ts, deleteRoom.ts...)
│   ├── messages/                  #   NEW: domain functions (sendMessage.ts, deleteMessage.ts, insertMessage.ts...)
│   ├── omnichannel/               #   NEW: domain functions + livechat lib (closeLivechatRoom.ts...)
│   ├── authorization/             #   NEW: hasPermission.ts, canAccessRoom.ts (from app/authorization/server/functions/)
│   ├── cloud/                     #   NEW: connectWorkspace.ts, syncWorkspace/ (from app/cloud/server/functions/)
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

1. **`move-module.mjs --from <old-dir> --to <new-dir>`** — Moves a module directory and fixes all imports.

   - `mkdir -p` the target directory
   - `git mv` every file from old to new location
   - For each moved file, recompute relative imports from the new position
   - For external files importing into the moved directory, recompute their specifiers
   - Supports `--dry-run` to preview changes without writing

2. **`move-batch.mjs <manifest.tsv>`** — Moves a batch of modules from a TSV manifest.

   - Reads the manifest line by line (`old-path<TAB>new-path`)
   - Calls `move-module.mjs` for each entry
   - After all moves, runs `yarn lint --quiet` once to verify no imports broke
   - Reports: files moved, imports updated, any errors

3. **`verify-no-old-imports.mjs <pattern>...`** — Checks that no imports still reference given substrings (e.g., `app/slashcommand`). Run after each phase to catch stragglers.

**License-boundary guard (mandatory).** `move-module.mjs` must refuse any move where the source path contains an `ee/` segment but the destination does not (and vice versa), failing loud before any `git mv`. `move-batch.mjs` validates every manifest row against this rule up front, so a community-phase manifest can never contain an `ee/` source and an EE-mirror manifest can never point outside `ee/`. This is the automated enforcement of the [License Boundary](#license-boundary-ee--hard-constraint) rule — it is not optional and not a warning.

Each phase produces a manifest file (the tables below), feeds it to `move-batch.mjs`, verifies with `yarn lint --quiet`, and commits the result. The scripts themselves are deleted once all phases are complete.

**Primary validation command**: `yarn lint --quiet` is the authoritative check for broken imports after a move. The `--quiet` flag suppresses warnings so unresolved-import errors stand out. Run it from the repo root after every batch. `tsc --noEmit` may additionally be used to catch type regressions, but lint is the first line of defense for import integrity.

**Deliverable**: Scripts written and tested on a small dry-run (e.g., move one slash command file, verify, revert).

---

### Phase 1: Slash Commands (18 folders → 1 directory)

**Goal**: Quick win. 18 tiny folders with 1-3 files each consolidate into `server/slashcommands/`.

**Risk**: Very low. Slash commands are leaf nodes — nothing imports from them.

**Scope**: ~40 files

| Source                                             | Destination                             |
| -------------------------------------------------- | --------------------------------------- |
| `app/slashcommand-asciiarts/server/`               | `server/slashcommands/asciiarts/`       |
| `app/slashcommands-archiveroom/server/server.ts`   | `server/slashcommands/archiveroom.ts`   |
| `app/slashcommands-ban/server/server.ts`           | `server/slashcommands/ban.ts`           |
| `app/slashcommands-create/server/server.ts`        | `server/slashcommands/create.ts`        |
| `app/slashcommands-help/server/server.ts`          | `server/slashcommands/help.ts`          |
| `app/slashcommands-hide/server/server.ts`          | `server/slashcommands/hide.ts`          |
| `app/slashcommands-invite/server/server.ts`        | `server/slashcommands/invite.ts`        |
| `app/slashcommands-inviteall/server/server.ts`     | `server/slashcommands/inviteall.ts`     |
| `app/slashcommands-join/server/server.ts`          | `server/slashcommands/join.ts`          |
| `app/slashcommands-kick/server/server.ts`          | `server/slashcommands/kick.ts`          |
| `app/slashcommands-leave/server/server.ts`         | `server/slashcommands/leave.ts`         |
| `app/slashcommands-me/server/server.ts`            | `server/slashcommands/me.ts`            |
| `app/slashcommands-msg/server/server.ts`           | `server/slashcommands/msg.ts`           |
| `app/slashcommands-mute/server/server.ts`          | `server/slashcommands/mute.ts`          |
| `app/slashcommands-status/server/server.ts`        | `server/slashcommands/status.ts`        |
| `app/slashcommands-topic/server/server.ts`         | `server/slashcommands/topic.ts`         |
| `app/slashcommands-unarchiveroom/server/server.ts` | `server/slashcommands/unarchiveroom.ts` |

**Import updates**: Each slash command file typically has 0-2 external importers. Update `server/importPackages.ts` to import from the new location.

**Verification**: `yarn lint --quiet`, manual test of 2-3 slash commands (e.g., `/invite`, `/kick`, `/topic`).

---

### Phase 2: External Bridges (5 folders → `server/bridges/`)

**Goal**: Move isolated bridge code that has no inbound importers.

**Risk**: Low. Bridges are leaf nodes — they import from the core but nothing imports from them.

**Scope**: ~48 files

| Source                         | Destination                 |
| ------------------------------ | --------------------------- |
| `app/irc/server/`              | `server/bridges/irc/`       |
| `app/slackbridge/server/`      | `server/bridges/slack/`     |
| `app/smarsh-connector/server/` | `server/bridges/smarsh/`    |
| `app/webdav/server/`           | `server/bridges/webdav/`    |
| `app/nextcloud/server/`        | `server/bridges/nextcloud/` |

**Note**: `app/apps/server/` (Apps-Engine bridges and converters) is explicitly out of scope for this migration. It will be handled manually in a separate initiative — do not move, rename, or touch it during any phase of this plan.

**Verification**: `yarn lint --quiet`, test an incoming webhook.

---

### Phase 3: REST API Infrastructure (1 folder → `server/api/`)

**Goal**: Move the API framework and all REST endpoints into `server/api/`.

**Risk**: Medium. The API folder is large (92 files) and is imported by `server/main.ts`. However, it's a cohesive unit — it moves as a block.

**Scope**: ~92 files + ~43 livechat API files

| Source                                  | Destination                    |
| --------------------------------------- | ------------------------------ |
| `app/api/server/v1/*.ts`                | `server/api/v1/`               |
| `app/api/server/helpers/`               | `server/api/lib/`              |
| `app/api/server/lib/`                   | `server/api/lib/`              |
| `app/api/server/middlewares/`           | `server/api/v1/middlewares/`   |
| `app/api/server/ApiClass.ts`            | `server/api/ApiClass.ts`       |
| `app/api/server/api.ts`                 | `server/api/api.ts`            |
| `app/api/server/router.ts`              | `server/api/router.ts`         |
| `app/api/server/definition.ts`          | `server/api/definition.ts`     |
| `app/api/server/ajv.ts`                 | `server/api/validation/ajv.ts` |
| `app/api/server/default/`               | `server/api/default/`          |
| `app/livechat/server/api/v1/*.ts`       | `server/api/v1/omnichannel/`   |
| `app/livechat/imports/server/rest/*.ts` | `server/api/v1/omnichannel/`   |

**Key import update**: `server/main.ts` currently imports `../app/api/server/api` — update to `./api/api`.

**Sub-steps**:

1. Move the API framework files first (ApiClass.ts, router.ts, api.ts, definition.ts)
2. Move ajv.ts into `server/api/validation/`
3. Merge helpers/ and lib/ into a single `server/api/lib/`
4. Move v1/ endpoint files and middlewares/ into `server/api/v1/`
5. Move livechat API files into v1/omnichannel/
6. Update `server/main.ts` and all cross-references
7. Re-wire test-runner globs for every moved spec and fix stale proxyquire/`jest.mock` keys — see [Test Mocks and Runner Globs](#test-mocks-and-runner-globs-proxyquire--jestmock--lint--tsc-do-not-catch-these). `app/api/server/` specs move to `server/api/` (both mocha lib specs and Jest specs), so both `.mocharc.js` and `jest.config.ts` `testMatch` need updating, and specs proxyquiring moved modules (e.g. `FileUpload.spec.ts` → `MultipartUploadHandler`, `api.helpers` consumers) need their mock keys rewritten.

**Verification**: `yarn lint --quiet`, **then actually run** the REST API test suite via both runners (`yarn jest` and `yarn mocha --config ./.mocharc.js`) — lint/tsc do not catch broken mock keys or specs that silently stopped being discovered — and test a few endpoints manually.

---

### Phase 4: Domain Functions (into `server/lib/`)

**Goal**: Move domain functions from `app/lib/server/functions/` and `app/*/server/functions/` into `server/lib/` with domain subfolders. This is the largest and most impactful phase.

**Risk**: Medium-high. These functions are heavily imported across the codebase (~62 features import from `app/lib/server`). The migration script updates all import paths in the same commit.

**Scope**: ~80 files

**Strategy**: Move files and update all imports in a single commit per sub-phase. No re-export stubs — every importer is updated immediately.

#### Phase 4a: User Functions (~19 files)

| Source                                                          | Destination                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------- |
| `app/lib/server/functions/setRealName.ts`                       | `server/lib/users/setRealName.ts`                       |
| `app/lib/server/functions/setUsername.ts`                       | `server/lib/users/setUsername.ts`                       |
| `app/lib/server/functions/setEmail.ts`                          | `server/lib/users/setEmail.ts`                          |
| `app/lib/server/functions/saveUserIdentity.ts`                  | `server/lib/users/saveUserIdentity.ts`                  |
| `app/lib/server/functions/setUserAvatar.ts`                     | `server/lib/users/setUserAvatar.ts`                     |
| `app/lib/server/functions/setUserActiveStatus.ts`               | `server/lib/users/setUserActiveStatus.ts`               |
| `app/lib/server/functions/setStatusText.ts`                     | `server/lib/users/setStatusText.ts`                     |
| `app/lib/server/functions/getStatusText.ts`                     | `server/lib/users/getStatusText.ts`                     |
| `app/lib/server/functions/deleteUser.ts`                        | `server/lib/users/deleteUser.ts`                        |
| `app/lib/server/functions/getFullUserData.ts`                   | `server/lib/users/getFullUserData.ts`                   |
| `app/lib/server/functions/getUsernameSuggestion.ts`             | `server/lib/users/getUsernameSuggestion.ts`             |
| `app/lib/server/functions/getUserCreatedByApp.ts`               | `server/lib/users/getUserCreatedByApp.ts`               |
| `app/lib/server/functions/getUserSingleOwnedRooms.ts`           | `server/lib/users/getUserSingleOwnedRooms.ts`           |
| `app/lib/server/functions/getAvatarSuggestionForUser.ts`        | `server/lib/users/getAvatarSuggestionForUser.ts`        |
| `app/lib/server/functions/checkEmailAvailability.ts`            | `server/lib/users/checkEmailAvailability.ts`            |
| `app/lib/server/functions/checkUsernameAvailability.ts`         | `server/lib/users/checkUsernameAvailability.ts`         |
| `app/lib/server/functions/validateUsername.ts`                  | `server/lib/users/validateUsername.ts`                  |
| `app/lib/server/functions/saveCustomFields.ts`                  | `server/lib/users/saveCustomFields.ts`                  |
| `app/lib/server/functions/saveCustomFieldsWithoutValidation.ts` | `server/lib/users/saveCustomFieldsWithoutValidation.ts` |

#### Phase 4b: Room Functions (~16 files)

| Source                                                          | Destination                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------- |
| `app/lib/server/functions/createRoom.ts`                        | `server/lib/rooms/createRoom.ts`                        |
| `app/lib/server/functions/createDirectRoom.ts`                  | `server/lib/rooms/createDirectRoom.ts`                  |
| `app/lib/server/functions/deleteRoom.ts`                        | `server/lib/rooms/deleteRoom.ts`                        |
| `app/lib/server/functions/archiveRoom.ts`                       | `server/lib/rooms/archiveRoom.ts`                       |
| `app/lib/server/functions/unarchiveRoom.ts`                     | `server/lib/rooms/unarchiveRoom.ts`                     |
| `app/lib/server/functions/addUserToRoom.ts`                     | `server/lib/rooms/addUserToRoom.ts`                     |
| `app/lib/server/functions/addUserToDefaultChannels.ts`          | `server/lib/rooms/addUserToDefaultChannels.ts`          |
| `app/lib/server/functions/removeUserFromRoom.ts`                | `server/lib/rooms/removeUserFromRoom.ts`                |
| `app/lib/server/functions/acceptRoomInvite.ts`                  | `server/lib/rooms/acceptRoomInvite.ts`                  |
| `app/lib/server/functions/cleanRoomHistory.ts`                  | `server/lib/rooms/cleanRoomHistory.ts`                  |
| `app/lib/server/functions/getRoomByNameOrIdWithOptionToJoin.ts` | `server/lib/rooms/getRoomByNameOrIdWithOptionToJoin.ts` |
| `app/lib/server/functions/getRoomsWithSingleOwner.ts`           | `server/lib/rooms/getRoomsWithSingleOwner.ts`           |
| `app/lib/server/functions/joinDefaultChannels.ts`               | `server/lib/rooms/joinDefaultChannels.ts`               |
| `app/lib/server/functions/relinquishRoomOwnerships.ts`          | `server/lib/rooms/relinquishRoomOwnerships.ts`          |
| `app/lib/server/functions/setRoomAvatar.ts`                     | `server/lib/rooms/setRoomAvatar.ts`                     |
| `app/lib/server/functions/updateGroupDMsName.ts`                | `server/lib/rooms/updateGroupDMsName.ts`                |
| `app/lib/server/functions/banUserFromRoom.ts`                   | `server/lib/rooms/banUserFromRoom.ts`                   |
| `app/lib/server/functions/executeUnbanUserFromRoom.ts`          | `server/lib/rooms/executeUnbanUserFromRoom.ts`          |

#### Phase 4c: Message Functions (~10 files)

| Source                                                      | Destination                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| `app/lib/server/functions/sendMessage.ts`                   | `server/lib/messages/sendMessage.ts`                   |
| `app/lib/server/functions/insertMessage.ts`                 | `server/lib/messages/insertMessage.ts`                 |
| `app/lib/server/functions/deleteMessage.ts`                 | `server/lib/messages/deleteMessage.ts`                 |
| `app/lib/server/functions/updateMessage.ts`                 | `server/lib/messages/updateMessage.ts`                 |
| `app/lib/server/functions/loadMessageHistory.ts`            | `server/lib/messages/loadMessageHistory.ts`            |
| `app/lib/server/functions/processWebhookMessage.ts`         | `server/lib/messages/processWebhookMessage.ts`         |
| `app/lib/server/functions/parseUrlsInMessage.ts`            | `server/lib/messages/parseUrlsInMessage.ts`            |
| `app/lib/server/functions/attachMessage.ts`                 | `server/lib/messages/attachMessage.ts`                 |
| `app/lib/server/functions/isTheLastMessage.ts`              | `server/lib/messages/isTheLastMessage.ts`              |
| `app/lib/server/functions/extractUrlsFromMessageAST.ts`     | `server/lib/messages/extractUrlsFromMessageAST.ts`     |
| `app/lib/server/functions/extractMentionsFromMessageAST.ts` | `server/lib/messages/extractMentionsFromMessageAST.ts` |

#### Phase 4d: Other Domain Functions

| Source                                                            | Destination                                                     |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| `app/lib/server/functions/closeLivechatRoom.ts`                   | `server/lib/omnichannel/closeLivechatRoom.ts`             |
| `app/lib/server/functions/closeOmnichannelConversations.ts`       | `server/lib/omnichannel/closeOmnichannelConversations.ts` |
| `app/lib/server/functions/syncRolePrioritiesForRoomIfRequired.ts` | `server/lib/rooms/syncRolePrioritiesForRoomIfRequired.ts` |
| `app/lib/server/functions/validateName.ts`                        | `server/lib/shared/validateName.ts`                       |
| `app/lib/server/functions/validateNameChars.ts`                   | `server/lib/shared/validateNameChars.ts`                  |
| `app/lib/server/functions/getModifiedHttpHeaders.ts`              | `server/lib/shared/getModifiedHttpHeaders.ts`             |
| `app/lib/server/functions/disableCustomScripts.ts`                | `server/lib/shared/disableCustomScripts.ts`               |
| `app/authorization/server/functions/*.ts`                         | `server/lib/authorization/`                               |
| `app/cloud/server/functions/*.ts`                                 | `server/lib/cloud/`                                       |
| `app/livechat/server/lib/*.ts` (functions)                        | `server/lib/omnichannel/`                                 |

**Verification per sub-phase**: `yarn lint --quiet`, run unit tests for the moved functions, run integration tests.

---

### Phase 5: Meteor Methods (from app/\*/server/methods/ → `server/meteor-methods/<domain>/`)

**Goal**: Consolidate all Meteor methods from feature folders into `server/meteor-methods/` with domain subfolders.

**Risk**: Medium. Methods are entry points — nothing imports them, they just need to be loaded at startup. The main risk is missing a method registration.

**Scope**: ~148 files

**Naming**: This phase introduces the `meteor-methods/` folder name (renamed from the existing `methods/`) to make it explicit that these are Meteor-specific RPC handlers — not generic class methods, REST handlers, or service methods. The rename clarifies intent and reinforces that this directory is deprecated and slated for removal as features migrate off Meteor.

**Phase 5 first step — rename the existing folder**: Before moving any new files in, rename `apps/meteor/server/methods/` → `apps/meteor/server/meteor-methods/` with a single `git mv`, and update every importer accordingly. Run `yarn lint --quiet` to confirm no broken imports before proceeding to the moves below.

**Note**: After the rename above, the existing flat files (now under `server/meteor-methods/`) are also moved into the appropriate domain subfolder as part of this phase.

| Source                                            | Destination                                     |
| ------------------------------------------------- | ----------------------------------------------- |
| `app/lib/server/methods/setRealName.ts`           | `server/meteor-methods/users/setRealName.ts`           |
| `app/lib/server/methods/setEmail.ts`              | `server/meteor-methods/users/setEmail.ts`              |
| `app/lib/server/methods/blockUser.ts`             | `server/meteor-methods/users/blockUser.ts`             |
| `app/lib/server/methods/unblockUser.ts`           | `server/meteor-methods/users/unblockUser.ts`           |
| `app/lib/server/methods/deleteUserOwnAccount.ts`  | `server/meteor-methods/users/deleteUserOwnAccount.ts`  |
| `app/lib/server/methods/getUsernameSuggestion.ts` | `server/meteor-methods/users/getUsernameSuggestion.ts` |
| `app/lib/server/methods/createChannel.ts`         | `server/meteor-methods/rooms/createChannel.ts`         |
| `app/lib/server/methods/createPrivateGroup.ts`    | `server/meteor-methods/rooms/createPrivateGroup.ts`    |
| `app/lib/server/methods/addUserToRoom.ts`         | `server/meteor-methods/rooms/addUserToRoom.ts`         |
| `app/lib/server/methods/addUsersToRoom.ts`        | `server/meteor-methods/rooms/addUsersToRoom.ts`        |
| `app/lib/server/methods/archiveRoom.ts`           | `server/meteor-methods/rooms/archiveRoom.ts`           |
| `app/lib/server/methods/unarchiveRoom.ts`         | `server/meteor-methods/rooms/unarchiveRoom.ts`         |
| `app/lib/server/methods/leaveRoom.ts`             | `server/meteor-methods/rooms/leaveRoom.ts`             |
| `app/lib/server/methods/joinRoom.ts`              | `server/meteor-methods/rooms/joinRoom.ts`              |
| `app/lib/server/methods/joinDefaultChannels.ts`   | `server/meteor-methods/rooms/joinDefaultChannels.ts`   |
| `app/lib/server/methods/cleanRoomHistory.ts`      | `server/meteor-methods/rooms/cleanRoomHistory.ts`      |
| `app/lib/server/methods/getRoomJoinCode.ts`       | `server/meteor-methods/rooms/getRoomJoinCode.ts`       |
| `app/lib/server/methods/sendMessage.ts`           | `server/meteor-methods/messages/sendMessage.ts`        |
| `app/lib/server/methods/updateMessage.ts`         | `server/meteor-methods/messages/updateMessage.ts`      |
| `app/lib/server/methods/getChannelHistory.ts`     | `server/meteor-methods/messages/getChannelHistory.ts`  |
| `app/lib/server/methods/getMessages.ts`           | `server/meteor-methods/messages/getMessages.ts`        |
| `app/lib/server/methods/getSingleMessage.ts`      | `server/meteor-methods/messages/getSingleMessage.ts`   |
| `app/lib/server/methods/addOAuthService.ts`       | `server/meteor-methods/auth/addOAuthService.ts`        |
| `app/lib/server/methods/refreshOAuthService.ts`   | `server/meteor-methods/auth/refreshOAuthService.ts`    |
| `app/lib/server/methods/removeOAuthService.ts`    | `server/meteor-methods/auth/removeOAuthService.ts`     |
| `app/lib/server/methods/createToken.ts`           | `server/meteor-methods/auth/createToken.ts`            |
| `app/lib/server/methods/saveSetting.ts`           | `server/meteor-methods/settings/saveSetting.ts`        |
| `app/lib/server/methods/saveSettings.ts`          | `server/meteor-methods/settings/saveSettings.ts`       |
| `app/authorization/server/methods/*.ts`           | `server/meteor-methods/auth/`                          |
| `app/2fa/server/methods/*.ts`                     | `server/meteor-methods/auth/`                          |
| `app/channel-settings/server/methods/*.ts`        | `server/meteor-methods/rooms/`                         |
| `app/threads/server/methods/*.ts`                 | `server/meteor-methods/messages/`                      |
| `app/discussion/server/methods/*.ts`              | `server/meteor-methods/messages/`                      |
| `app/livechat/server/methods/*.ts`                | `server/meteor-methods/omnichannel/`                   |
| `app/integrations/server/methods/*.ts`            | `server/meteor-methods/integrations/`                  |
| `app/importer/server/methods/*.ts`                | `server/meteor-methods/import/`                        |
| `app/autotranslate/server/methods/*.ts`           | `server/meteor-methods/platform/`                      |
| `app/e2e/server/methods/*.ts`                     | `server/meteor-methods/platform/`                      |

**Existing `server/meteor-methods/` flat files** — also moved into domain subfolders:

| Source                                        | Destination                                        |
| --------------------------------------------- | -------------------------------------------------- |
| `server/meteor-methods/deleteUser.ts`                | `server/meteor-methods/users/deleteUser.ts`               |
| `server/meteor-methods/setUserActiveStatus.ts`       | `server/meteor-methods/users/setUserActiveStatus.ts`      |
| `server/meteor-methods/registerUser.ts`              | `server/meteor-methods/users/registerUser.ts`             |
| `server/meteor-methods/resetAvatar.ts`               | `server/meteor-methods/users/resetAvatar.ts`              |
| `server/meteor-methods/setAvatarFromService.ts`      | `server/meteor-methods/users/setAvatarFromService.ts`     |
| `server/meteor-methods/saveUserPreferences.ts`       | `server/meteor-methods/users/saveUserPreferences.ts`      |
| `server/meteor-methods/saveUserProfile.ts`           | `server/meteor-methods/users/saveUserProfile.ts`          |
| `server/meteor-methods/getUsersOfRoom.ts`            | `server/meteor-methods/users/getUsersOfRoom.ts`           |
| `server/meteor-methods/userPresence.ts`              | `server/meteor-methods/users/userPresence.ts`             |
| `server/meteor-methods/userSetUtcOffset.ts`          | `server/meteor-methods/users/userSetUtcOffset.ts`         |
| `server/meteor-methods/ignoreUser.ts`                | `server/meteor-methods/users/ignoreUser.ts`               |
| `server/meteor-methods/addAllUserToRoom.ts`          | `server/meteor-methods/rooms/addAllUserToRoom.ts`         |
| `server/meteor-methods/addRoomLeader.ts`             | `server/meteor-methods/rooms/addRoomLeader.ts`            |
| `server/meteor-methods/addRoomModerator.ts`          | `server/meteor-methods/rooms/addRoomModerator.ts`         |
| `server/meteor-methods/addRoomOwner.ts`              | `server/meteor-methods/rooms/addRoomOwner.ts`             |
| `server/meteor-methods/removeRoomLeader.ts`          | `server/meteor-methods/rooms/removeRoomLeader.ts`         |
| `server/meteor-methods/removeRoomModerator.ts`       | `server/meteor-methods/rooms/removeRoomModerator.ts`      |
| `server/meteor-methods/removeRoomOwner.ts`           | `server/meteor-methods/rooms/removeRoomOwner.ts`          |
| `server/meteor-methods/removeUserFromRoom.ts`        | `server/meteor-methods/rooms/removeUserFromRoom.ts`       |
| `server/meteor-methods/getRoomById.ts`               | `server/meteor-methods/rooms/getRoomById.ts`              |
| `server/meteor-methods/getRoomIdByNameOrId.ts`       | `server/meteor-methods/rooms/getRoomIdByNameOrId.ts`      |
| `server/meteor-methods/getRoomNameById.ts`           | `server/meteor-methods/rooms/getRoomNameById.ts`          |
| `server/meteor-methods/browseChannels.ts`            | `server/meteor-methods/rooms/browseChannels.ts`           |
| `server/meteor-methods/channelsList.ts`              | `server/meteor-methods/rooms/channelsList.ts`             |
| `server/meteor-methods/getTotalChannels.ts`          | `server/meteor-methods/rooms/getTotalChannels.ts`         |
| `server/meteor-methods/hideRoom.ts`                  | `server/meteor-methods/rooms/hideRoom.ts`                 |
| `server/meteor-methods/openRoom.ts`                  | `server/meteor-methods/rooms/openRoom.ts`                 |
| `server/meteor-methods/toggleFavorite.ts`            | `server/meteor-methods/rooms/toggleFavorite.ts`           |
| `server/meteor-methods/createDirectMessage.ts`       | `server/meteor-methods/messages/createDirectMessage.ts`   |
| `server/meteor-methods/deleteFileMessage.ts`         | `server/meteor-methods/messages/deleteFileMessage.ts`     |
| `server/meteor-methods/messageSearch.ts`             | `server/meteor-methods/messages/messageSearch.ts`         |
| `server/meteor-methods/loadHistory.ts`               | `server/meteor-methods/messages/loadHistory.ts`           |
| `server/meteor-methods/loadMissedMessages.ts`        | `server/meteor-methods/messages/loadMissedMessages.ts`    |
| `server/meteor-methods/loadNextMessages.ts`          | `server/meteor-methods/messages/loadNextMessages.ts`      |
| `server/meteor-methods/loadSurroundingMessages.ts`   | `server/meteor-methods/messages/loadSurroundingMessages.ts` |
| `server/meteor-methods/readMessages.ts`              | `server/meteor-methods/messages/readMessages.ts`          |
| `server/meteor-methods/readThreads.ts`               | `server/meteor-methods/messages/readThreads.ts`           |
| `server/meteor-methods/muteUserInRoom.ts`            | `server/meteor-methods/rooms/muteUserInRoom.ts`           |
| `server/meteor-methods/unmuteUserInRoom.ts`          | `server/meteor-methods/rooms/unmuteUserInRoom.ts`         |
| `server/meteor-methods/afterVerifyEmail.ts`          | `server/meteor-methods/auth/afterVerifyEmail.ts`          |
| `server/meteor-methods/sendConfirmationEmail.ts`     | `server/meteor-methods/auth/sendConfirmationEmail.ts`     |
| `server/meteor-methods/sendForgotPasswordEmail.ts`   | `server/meteor-methods/auth/sendForgotPasswordEmail.ts`   |
| `server/meteor-methods/logoutCleanUp.ts`             | `server/meteor-methods/auth/logoutCleanUp.ts`             |
| `server/meteor-methods/getSetupWizardParameters.ts`  | `server/meteor-methods/settings/getSetupWizardParameters.ts` |
| `server/meteor-methods/loadLocale.ts`                | `server/meteor-methods/platform/loadLocale.ts`            |
| `server/meteor-methods/OEmbedCacheCleanup.ts`        | `server/meteor-methods/platform/OEmbedCacheCleanup.ts`    |
| `server/meteor-methods/requestDataDownload.ts`       | `server/meteor-methods/platform/requestDataDownload.ts`   |

**Import updates**: Update `server/importPackages.ts` and any `server/meteor-methods/index.ts` that aggregates method registrations.

**Verification**: `yarn lint --quiet`, test several Meteor methods via DDP client.

---

### Phase 6: Lib, Hooks, and Feature-Specific Code

**Goal**: Move remaining feature-specific code: hooks, lib files, auth providers, notification code, and other domain-specific libraries.

**Risk**: Medium. These files have more cross-references than the previous phases.

**Scope**: ~300 files

#### Phase 6a: Auth Providers (~30 files)

| Source                                   | Destination                                      |
| ---------------------------------------- | ------------------------------------------------ |
| `app/apple/server/`                      | `server/lib/auth-providers/apple.ts`             |
| `app/crowd/server/`                      | `server/lib/auth-providers/crowd/`               |
| `app/custom-oauth/server/`               | `server/lib/auth-providers/custom-oauth.ts`      |
| `app/dolphin/server/`                    | `server/lib/auth-providers/dolphin.ts`           |
| `app/drupal/server/`                     | `server/lib/auth-providers/drupal.ts`            |
| `app/github/server/`                     | `server/lib/auth-providers/github.ts`            |
| `app/github-enterprise/server/`          | `server/lib/auth-providers/github-enterprise.ts` |
| `app/gitlab/server/`                     | `server/lib/auth-providers/gitlab.ts`            |
| `app/google-oauth/server/`               | `server/lib/auth-providers/google.ts`            |
| `app/iframe-login/server/`               | `server/lib/auth-providers/iframe.ts`            |
| `app/wordpress/server/`                  | `server/lib/auth-providers/wordpress.ts`         |
| `app/lib/server/oauth/*.js`              | `server/lib/auth-providers/oauth/`               |
| `app/meteor-accounts-saml/server/`       | `server/lib/saml/`                               |
| `app/2fa/server/` (non-methods)          | `server/lib/2fa/`                                |
| `app/authentication/server/` (non-hooks) | `server/lib/auth/`                               |
| `app/token-login/server/`                | `server/lib/auth/token-login.ts`                 |

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

#### Phase 6e: Media, Import, Search, and Remaining Libraries

| Source                                      | Destination                               |
| ------------------------------------------- | ----------------------------------------- |
| `app/file-upload/server/`                   | `server/lib/media/file-upload/`           |
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

**Verification**: `yarn lint --quiet` after each sub-phase, full test suite at end of Phase 6.

---

### Phase 7: Omnichannel and Remaining Cleanup

**Goal**: Move the largest single feature (livechat, 132 files) and clean up remaining files.

**Risk**: Medium-high. Livechat is the largest feature and has many internal dependencies. Move it as a cohesive unit.

**Scope**: ~150 files

| Source                               | Destination                                                 |
| ------------------------------------ | ----------------------------------------------------------- |
| `app/livechat/server/lib/`           | `server/lib/omnichannel/` |
| `app/livechat/server/methods/`       | Already moved in Phase 5                                    |
| `app/livechat/server/hooks/`         | Already moved in Phase 6b                                   |
| `app/livechat/server/api/`           | Already moved in Phase 3                                    |
| `app/livechat/server/` (remaining)   | `server/lib/omnichannel/`                                   |

> **EE livechat is NOT moved here.** `ee/app/livechat-enterprise/server/` is Enterprise-licensed and stays under `ee/`. It is restructured into `ee/server/lib/omnichannel/` (and sibling `ee/server/` folders) as part of the [EE Mirror](#ee-mirror-restructuring-within-ee), never into the community `server/lib/omnichannel/`. See the [License Boundary](#license-boundary-ee--hard-constraint) rule.

**Remaining cleanup**:

- `app/channel-settings/server/` (non-methods) → `server/lib/rooms/settings/`
- `app/invites/server/` → `server/lib/rooms/invites/`
- `app/retention-policy/server/` → `server/lib/rooms/retention/`
- `app/user-status/server/` → `server/lib/users/status/`
- `app/bot-helpers/server/` → `server/lib/bot-helpers/` (moved in Phase 1)
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
- Delete the migration scripts (`move-module.mjs`, `move-batch.mjs`, `verify-no-old-imports.mjs`)

**Final verification**: `yarn lint --quiet` across the repo, full `tsc --noEmit` for type regressions, full test suite, manual smoke test of core features (login, send message, create room, livechat, file upload).

---

## EE Mirror — Restructuring within `ee/`

The Enterprise tree gets the **same responsibility-based restructure** as the community tree, applied **entirely inside `apps/meteor/ee/`**. Files move from `ee/app/*/server/` into `ee/server/`, which already contains the matching responsibility folders (`api/`, `hooks/`, `lib/`, `methods/`, `services/`, `settings/`, `startup/`, …). Nothing in this section may target a path outside `ee/` — see the [License Boundary](#license-boundary-ee--hard-constraint) rule, enforced by the `move-module.mjs` guard.

**Sequencing**: run each EE sub-step in (or immediately after) the community phase it parallels, so cross-tree imports are rewritten together. The EE mirror reuses the same scripts and the same `yarn lint --quiet` verification.

**Folder rename**: mirror the community `methods/` → `meteor-methods/` rename here too — `ee/server/methods/` → `ee/server/meteor-methods/` — before moving EE methods into domain subfolders.

| Source (EE)                                       | Destination (EE)                          | Parallels   |
| ------------------------------------------------- | ----------------------------------------- | ----------- |
| `ee/app/api-enterprise/server/` (endpoints)       | `ee/server/api/v1/`                       | Phase 3     |
| `ee/app/api-enterprise/server/middlewares/`       | `ee/server/api/v1/middlewares/`           | Phase 3     |
| `ee/app/api-enterprise/server/lib/`               | `ee/server/api/lib/`                      | Phase 3     |
| `ee/app/livechat-enterprise/server/api/`          | `ee/server/api/v1/omnichannel/`           | Phase 3     |
| `ee/app/authorization/server/` (functions)        | `ee/server/lib/authorization/`            | Phase 4     |
| `ee/app/livechat-enterprise/server/methods/`      | `ee/server/meteor-methods/omnichannel/`   | Phase 5     |
| `ee/app/canned-responses/server/methods/`         | `ee/server/meteor-methods/`               | Phase 5     |
| `ee/app/license/server/methods.ts`                | `ee/server/meteor-methods/`               | Phase 5     |
| `ee/app/authorization/server/` (methods)          | `ee/server/meteor-methods/auth/`          | Phase 5     |
| `ee/app/livechat-enterprise/server/hooks/`        | `ee/server/hooks/omnichannel/`            | Phase 6b    |
| `ee/app/canned-responses/server/hooks/`           | `ee/server/hooks/`                        | Phase 6b    |
| `ee/app/message-read-receipt/server/hooks/`       | `ee/server/hooks/messages/`               | Phase 6b    |
| `ee/app/authorization/server/callback.ts`         | `ee/server/hooks/auth/`                   | Phase 6b    |
| `ee/app/canned-responses/server/` (lib)           | `ee/server/lib/canned-responses/`         | Phase 6     |
| `ee/app/license/server/` (non-methods)            | `ee/server/lib/license/`                  | Phase 6     |
| `ee/app/message-read-receipt/server/` (non-hooks) | `ee/server/lib/message-read-receipt/`     | Phase 6     |
| `ee/app/livechat-enterprise/server/lib/`          | `ee/server/lib/omnichannel/`              | Phase 7     |
| `ee/app/livechat-enterprise/server/business-hour/`| `ee/server/lib/omnichannel/business-hour/`| Phase 7     |
| `ee/app/livechat-enterprise/server/outboundcomms/`| `ee/server/lib/omnichannel/outboundcomms/`| Phase 7     |
| `ee/app/livechat-enterprise/server/priorities.ts` | `ee/server/lib/omnichannel/`              | Phase 7     |
| `ee/app/livechat-enterprise/server/services/`     | `ee/server/services/`                     | Phase 7     |
| `ee/app/livechat-enterprise/server/` (settings, startup, permissions) | `ee/server/lib/omnichannel/`  | Phase 7     |
| `ee/app/settings/server/`                         | `ee/server/settings/`                     | Phase 7     |

**Note**: feature `index.ts` files (e.g. `ee/app/*/server/index.ts`) are import aggregators — fold their contents into the corresponding `ee/server/` entry points (`ee/server/index.ts`, `importPackages`) and delete them once empty, exactly as the community plan handles `app/lib/server/index.ts`.

**Verification**: `yarn lint --quiet` after each EE sub-step; confirm no community file resolves to an `ee/` _file_ that moved (imports may still cross the boundary, but every EE source must resolve to an `ee/` destination).

---

## Cross-Cutting Concerns

### How to Handle `app/lib/server/lib/` (Utility Files)

These files don't fit neatly into `lib/<domain>/` because they're hooks, utilities, or notification orchestration:

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

### Mirrored Test Trees (`tests/unit/**`) — move the specs with their sources

Not every spec is co-located with its source: `tests/unit/` (and `ee/tests/unit/`) is a **mirror of the source tree** (`tests/unit/app/lib/server/functions/setUsername.spec.ts` tests `app/lib/server/functions/setUsername.ts`). Moving a source file without moving its mirrored spec leaves the spec **orphaned in a stale mirror** — it keeps running (the `tests/unit/**` globs still match it), so nothing fails, but the tree layout silently rots and the next person can't find the test for a module.

**Procedure for every module move:**

1. Move the mirrored spec so it mirrors the **new** source location: source `app/lib/server/functions/X.ts` → `server/lib/users/X.ts` means spec `tests/unit/app/lib/server/functions/X.spec.ts` → `tests/unit/server/lib/users/X.spec.ts`.
2. Recompute the spec's relative `import`s **and its proxyquire target path** (`proxyquire(...)` / `.load(...)` — string literals the move script does not rewrite) for the new depth. Mock **keys** are unaffected by moving the spec (they match the loaded module's own specifiers, not the spec's location).
3. Check runner globs both ways: the new location must be matched by an existing glob (`tests/unit/server/**/*.{spec,tests}.ts` already covers the server mirror), and the old glob must not be left matching nothing.

**Orphan detector** (run after each phase): for every `*.spec.ts`/`*.tests.ts` under `tests/unit/app/**`, resolve its relative imports and proxyquire targets; any spec resolving into `server/**` (or `ee/server/**`) belongs in the corresponding mirror under `tests/unit/server/**` (or `ee/tests/unit/**`). Phases 3 and 4 left 15 such orphans (fixed in the Phase 4 follow-up); phases 1–2 had no unit-test mirrors.

### Test Mocks and Runner Globs (proxyquire / jest.mock) — lint & tsc do NOT catch these

Moving a module silently breaks two things that `yarn lint --quiet` and `tsc --noEmit` **cannot** see, because both are driven by **string literals**, not statically-resolved imports:

1. **Mock keys go stale.** `proxyquire('./target', { '<key>': stub })` and `jest.mock('<key>', …)` match `<key>` **literally** against the specifier the loaded module passes to `require`/`import`. When a module moves, _its own_ relative import specifiers change — so a mock key that used to match no longer does. proxyquire silently ignores the unmatched key and loads the **real** dependency instead of the stub. That either:
   - **crashes the whole runner** — if the real dependency transitively pulls in `meteor/*` or other bundler-only modules (a single load-time throw aborts every spec in a mocha run, so the failure looks unrelated to the moved file); or
   - **silently changes behavior** — the real function runs instead of the stub, producing confusing assertion failures (e.g. `expected undefined to be true`).

   Note two aliasing subtleties: a stale key may still _resolve to an existing file_ (so "does the path exist?" is not a sufficient check — it must **match the moved module's actual import specifier**), and the same key string is often reused as a plain property key in a `stubs`/`mocks` object, so it must be updated consistently in both places.

2. **Runner discovery globs go stale.** `jest.config.ts` `testMatch` and `.mocharc.js` `spec` list **old directory paths**. A moved spec silently stops being discovered — worse than a red test, this is **green CI that runs nothing**. Keep jest specs and mocha specs in **separate** globs: a jest spec (`jest.mock`/`jest.fn`) accidentally matched by a mocha glob throws `jest is not defined`, and vice versa. When a moved spec lands in a directory that mixes runners (e.g. a Jest `getUserInfo.spec.ts` moving into a `lib/` folder full of mocha specs), name it explicitly and add a mocha `ignore` entry so the broad glob doesn't claim it.

**Procedure after every module move (do this in the same PR):**

- **Relocate mirrored specs.** Move the module's specs under `tests/unit/**` to mirror the new source location — see [Mirrored Test Trees](#mirrored-test-trees-testsunit--move-the-specs-with-their-sources).
- **Re-wire discovery globs.** For each moved `*.spec.ts`, update `jest.config.ts` `testMatch` (jest specs) or `.mocharc.js` `spec` (mocha specs) to its new location; remove the now-empty old glob (it prints a `Cannot find any files matching pattern` warning).
- **Find dependent specs.** Grep for specs that mock the moved module **or any module the moved module transitively imports**: `grep -rlE "proxyquire|jest\.mock" --include='*.spec.ts'`, then check each mock/`jest.mock` key against the moved module's new import specifiers. A quick detector: for every relative mock key, resolve it against the loaded module's directory and flag the ones that no longer resolve.
- **Rewrite stale keys** to exactly match the moved module's new relative import specifiers (update the reused property-key strings too).
- **Actually run the moved and dependent specs** — `yarn jest <paths>` and `yarn mocha --config ./.mocharc.js <paths>`. Lint and tsc will pass on a spec whose mocks are entirely broken; only running it proves the stubs still intercept.

---

## Risks and Mitigations

| Risk                                                                          | Mitigation                                                                                                         |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Broken imports** — moving 800+ files changes import paths everywhere        | Migration script updates all imports in the same commit as the file move; `yarn lint --quiet` verifies after each batch (authoritative check for unresolved imports) |
| **Missing method registration** — Meteor methods must be imported to register | Each phase verifies that all methods still register by running `yarn lint --quiet` and method-specific tests   |
| **Merge conflicts** — other developers working on moved files                 | Communicate migration schedule; do large moves in low-activity windows; each phase is a separate PR                |
| **`app/lib/server/` is a dependency hub** — 62 features import from it        | Migration script handles all import updates atomically per batch; `verify-no-old-imports.mjs` catches stragglers   |
| **Omnichannel is huge** — 132 files in livechat                               | Move incrementally: API in Phase 3, methods in Phase 5, hooks in Phase 6, lib in Phase 7                           |
| **Test breakage** — tests may import from old paths                           | Update test imports in the same PR as the file move; tests co-located with source files move together              |
| **Silent test-mock breakage** — `proxyquire`/`jest.mock` string keys and runner discovery globs (`testMatch`, `.mocharc.js` `spec`) reference old paths; **lint and tsc pass anyway** | After every move, re-wire runner globs and rewrite stale mock keys to match the moved module's new specifiers, then **run** the moved and dependent specs (not just lint) — see [Test Mocks and Runner Globs](#test-mocks-and-runner-globs-proxyquire--jestmock--lint--tsc-do-not-catch-these) |
| **Accidental relicensing** — moving an `ee/` file into community `server/` silently strips its Enterprise license | Hard rule: EE files never leave `ee/` ([License Boundary](#license-boundary-ee--hard-constraint)); `move-module.mjs` guard refuses any boundary-crossing move before `git mv`; community manifests carry no `ee/` sources |

---

## What This Plan Does NOT Do

- **No code refactoring.** Files move as-is. Business logic stays the same.
- **No service consolidation.** Services stay in `server/services/` untouched.
- **No Meteor method removal.** Methods move to `server/meteor-methods/<domain>/` but continue to work.
- **No new abstractions.** No port interfaces, no dependency injection, no new TypeScript patterns.
- **No reorganization of existing `server/` files.** Everything already in `server/` stays in place. Domain subfolders are additive.

---

## After the Migration

Once all files are in `server/`, the following improvements become possible (but are separate work):

1. **Move business logic from `lib/` domain folders into `services/`** — the service layer becomes the single source of truth
2. **Delete Meteor methods** — the `server/meteor-methods/` directory can be emptied feature by feature
3. **Delete publications** — `server/publications/` can be emptied as DDP is removed
4. **Add `index.ts` exports** to each `lib/<domain>/` for a clean public API
5. **Add ESLint layer rules** — e.g., `methods/` cannot import from `api/`, `lib/` domain folders cannot import from `methods/`
6. **Reorganize `server/lib/`** into a cleaner structure if needed (it will have grown with domain functions, auth-providers, messaging, notifications, etc.)
