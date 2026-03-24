# API v2 Migration Proposal — RESTful Standardization

## Summary

The current Rocket.Chat API (`/api/v1/`) uses an **RPC-style** pattern with dot notation (e.g., `channels.create`, `users.delete`). There are **~420+ endpoints** spread across ~30 domains, with significant inconsistencies in naming, HTTP method usage, and resource duplication.

This proposal presents a migration to a **RESTful v2 API** (`/api/v2/`) that unifies duplicated resources, adopts standard REST conventions, and improves the developer experience.

---

## 1. Current API Diagnosis

### 1.1 Identified Problems

| Problem                         | Example                                                         | Impact                             |
| ------------------------------- | --------------------------------------------------------------- | ---------------------------------- |
| **Verbs in URLs**               | `channels.create`, `users.delete`                               | Does not follow REST conventions   |
| **POST for everything**         | `POST chat.delete`, `POST channels.archive`                     | HTTP methods ignored               |
| **Massive duplication**         | `channels.*` and `groups.*` have ~40 nearly identical endpoints | Duplicated maintenance             |
| **IDs in body instead of path** | `POST channels.info { roomId }`                                 | Not cacheable, not RESTful         |
| **Individual setters**          | `setDescription`, `setTopic`, `setPurpose`, `setAnnouncement`   | 4 endpoints where 1 PATCH suffices |
| **PUT/PATCH/DELETE underused**  | Only 2 endpoints use DELETE, 1 uses PUT                         | HTTP semantics lost                |
| **Naming inconsistency**        | `removeInvite/:_id` vs `channels.delete` vs `email-inbox/:_id`  | No clear standard                  |

### 1.2 Current HTTP Method Distribution

| Method | Count | Expected Usage (REST)            |
| ------ | ----- | -------------------------------- |
| GET    | ~160  | Read operations                  |
| POST   | ~250  | Create (but used for everything) |
| PUT    | ~2    | Full replacement                 |
| PATCH  | 0     | Partial update                   |
| DELETE | ~3    | Removal                          |

### 1.3 Biggest Offenders (duplication)

- **channels + groups**: ~90 combined endpoints with nearly identical logic
- **Room setters**: 8+ endpoints (`setDescription`, `setTopic`, `setPurpose`, `setAnnouncement`, `setReadOnly`, `setDefault`, `setJoinCode`, `setCustomFields`) replaceable by 1 PATCH
- **Role management**: `addModerator`, `removeModerator`, `addOwner`, `removeOwner`, `addLeader`, `removeLeader` — 6 endpoints per room type, replaceable by 1 PUT on roles

---

## 2. v2 API Principles

### 2.1 REST Conventions

1. **Resources as nouns** — `/rooms/:id` instead of `rooms.info`
2. **HTTP methods as verbs** — GET (read), POST (create), PATCH (update), PUT (replace), DELETE (remove)
3. **Sub-resources via path** — `/rooms/:id/members`, `/users/:id/teams`
4. **Filters via query params** — `?type=channel&status=online&q=search`
5. **IDs always in path** — `/rooms/:id` instead of `{ roomId }` in body
6. **Standardized responses** — consistent envelope with pagination, errors, and metadata

### 2.2 Response Standard

```jsonc
// Success (single resource)
{
  "data": { ... },
  "meta": { "requestId": "abc-123" }
}

// Success (collection)
{
  "data": [ ... ],
  "meta": {
    "total": 150,
    "offset": 0,
    "count": 50,
    "requestId": "abc-123"
  }
}

// Error
{
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "Room with id 'xyz' was not found",
    "status": 404
  },
  "meta": { "requestId": "abc-123" }
}
```

### 2.3 Coexistence Strategy

- `/api/v1/` continues working as-is
- `/api/v2/` is released incrementally per domain
- Deprecated v1 endpoints return `Deprecation` and `Sunset` headers
- OpenAPI documentation auto-generated for v2

---

## 3. Complete v1 to v2 Mapping

### 3.1 Rooms (unification of channels + groups + DMs)

> **Impact**: eliminates ~50% of API duplication. `channels.*`, `groups.*`, and parts of `rooms.*` are unified into a single `/rooms` resource.

#### Core CRUD

| v1                         | v2                                    | Method | Notes                        |
| -------------------------- | ------------------------------------- | ------ | ---------------------------- |
| `POST channels.create`     | `POST /rooms`                         | POST   | `{ "type": "channel", ... }` |
| `POST groups.create`       | `POST /rooms`                         | POST   | `{ "type": "group", ... }`   |
| `GET channels.info`        | `GET /rooms/:id`                      | GET    |                              |
| `GET groups.info`          | `GET /rooms/:id`                      | GET    |                              |
| `GET rooms.info`           | `GET /rooms/:id`                      | GET    |                              |
| `GET channels.list`        | `GET /rooms?type=channel`             | GET    | Filter by query param        |
| `GET groups.list`          | `GET /rooms?type=group`               | GET    |                              |
| `GET groups.listAll`       | `GET /rooms?type=group&scope=all`     | GET    |                              |
| `GET channels.list.joined` | `GET /rooms?type=channel&joined=true` | GET    |                              |
| `POST channels.delete`     | `DELETE /rooms/:id`                   | DELETE |                              |
| `POST groups.delete`       | `DELETE /rooms/:id`                   | DELETE |                              |
| `POST rooms.delete`        | `DELETE /rooms/:id`                   | DELETE |                              |

#### Property Updates (setter unification)

| v1                              | v2                 | Method | Notes                           |
| ------------------------------- | ------------------ | ------ | ------------------------------- |
| `POST channels.rename`          | `PATCH /rooms/:id` | PATCH  | `{ "name": "new-name" }`        |
| `POST channels.setDescription`  | `PATCH /rooms/:id` | PATCH  | `{ "description": "..." }`      |
| `POST channels.setTopic`        | `PATCH /rooms/:id` | PATCH  | `{ "topic": "..." }`            |
| `POST channels.setPurpose`      | `PATCH /rooms/:id` | PATCH  | `{ "purpose": "..." }`          |
| `POST channels.setAnnouncement` | `PATCH /rooms/:id` | PATCH  | `{ "announcement": "..." }`     |
| `POST channels.setReadOnly`     | `PATCH /rooms/:id` | PATCH  | `{ "readOnly": true }`          |
| `POST channels.setDefault`      | `PATCH /rooms/:id` | PATCH  | `{ "default": true }`           |
| `POST channels.setJoinCode`     | `PATCH /rooms/:id` | PATCH  | `{ "joinCode": "..." }`         |
| `POST channels.setCustomFields` | `PATCH /rooms/:id` | PATCH  | `{ "customFields": {...} }`     |
| `POST channels.setType`         | `PATCH /rooms/:id` | PATCH  | `{ "type": "group" }`           |
| `POST groups.setEncrypted`      | `PATCH /rooms/:id` | PATCH  | `{ "encrypted": true }`         |
| `POST rooms.saveRoomSettings`   | `PATCH /rooms/:id` | PATCH  | Already accepts multiple fields |

> **Result**: 12 endpoints → 1 endpoint `PATCH /rooms/:id`

#### State (archive/open/close)

| v1                        | v2                          | Method |
| ------------------------- | --------------------------- | ------ |
| `POST channels.archive`   | `POST /rooms/:id/archive`   | POST   |
| `POST channels.unarchive` | `DELETE /rooms/:id/archive` | DELETE |
| `POST channels.open`      | `POST /rooms/:id/open`      | POST   |
| `POST channels.close`     | `POST /rooms/:id/close`     | POST   |
| `POST rooms.hide`         | `POST /rooms/:id/hide`      | POST   |

#### Members

| v1                        | v2                                      | Method | Notes                 |
| ------------------------- | --------------------------------------- | ------ | --------------------- |
| `GET channels.members`    | `GET /rooms/:id/members`                | GET    |                       |
| `GET channels.online`     | `GET /rooms/:id/members?status=online`  | GET    | Filter                |
| `GET channels.moderators` | `GET /rooms/:id/members?role=moderator` | GET    | Filter                |
| `POST channels.invite`    | `POST /rooms/:id/members`               | POST   | `{ "userId": "..." }` |
| `POST channels.kick`      | `DELETE /rooms/:id/members/:userId`     | DELETE |                       |
| `POST channels.join`      | `POST /rooms/:id/join`                  | POST   |                       |
| `POST channels.leave`     | `POST /rooms/:id/leave`                 | POST   |                       |
| `POST channels.addAll`    | `POST /rooms/:id/members/all`           | POST   |                       |

#### Member Roles (unification)

| v1                              | v2                                     | Method | Notes                        |
| ------------------------------- | -------------------------------------- | ------ | ---------------------------- |
| `POST channels.addModerator`    | `PUT /rooms/:id/members/:userId/roles` | PUT    | `{ "roles": ["moderator"] }` |
| `POST channels.removeModerator` | `PUT /rooms/:id/members/:userId/roles` | PUT    | Remove from array            |
| `POST channels.addOwner`        | `PUT /rooms/:id/members/:userId/roles` | PUT    | `{ "roles": ["owner"] }`     |
| `POST channels.removeOwner`     | `PUT /rooms/:id/members/:userId/roles` | PUT    | Remove from array            |
| `POST channels.addLeader`       | `PUT /rooms/:id/members/:userId/roles` | PUT    | `{ "roles": ["leader"] }`    |
| `POST channels.removeLeader`    | `PUT /rooms/:id/members/:userId/roles` | PUT    | Remove from array            |
| `GET channels.roles`            | `GET /rooms/:id/roles`                 | GET    |                              |

> **Result**: 12 endpoints (6 channels + 6 groups) → 1 endpoint `PUT /rooms/:id/members/:userId/roles`

#### Mute

| v1                      | v2                               | Method |
| ----------------------- | -------------------------------- | ------ |
| `POST rooms.muteUser`   | `POST /rooms/:id/mute/:userId`   | POST   |
| `POST rooms.unmuteUser` | `DELETE /rooms/:id/mute/:userId` | DELETE |

#### Content and History

| v1                                         | v2                            | Method |
| ------------------------------------------ | ----------------------------- | ------ |
| `GET channels.history`                     | `GET /rooms/:id/messages`     | GET    |
| `GET channels.messages`                    | `GET /rooms/:id/messages`     | GET    |
| `GET channels.files`                       | `GET /rooms/:id/files`        | GET    |
| `GET rooms.images`                         | `GET /rooms/:id/images`       | GET    |
| `GET channels.counters`                    | `GET /rooms/:id/counters`     | GET    |
| `GET channels.getIntegrations`             | `GET /rooms/:id/integrations` | GET    |
| `GET channels.getAllUserMentionsByChannel` | `GET /rooms/:id/mentions`     | GET    |
| `POST rooms.cleanHistory`                  | `DELETE /rooms/:id/messages`  | DELETE |

#### Discussions

| v1                            | v2                            | Method |
| ----------------------------- | ----------------------------- | ------ |
| `POST rooms.createDiscussion` | `POST /rooms/:id/discussions` | POST   |
| `GET rooms.getDiscussions`    | `GET /rooms/:id/discussions`  | GET    |

#### Conversion and Admin

| v1                             | v2                                | Method |
| ------------------------------ | --------------------------------- | ------ |
| `POST channels.convertToTeam`  | `POST /rooms/:id/convert-to-team` | POST   |
| `GET rooms.adminRooms`         | `GET /admin/rooms`                | GET    |
| `GET rooms.adminRooms.getRoom` | `GET /admin/rooms/:id`            | GET    |
| `GET rooms.nameExists`         | `GET /rooms/exists?name=...`      | GET    |
| `POST rooms.export`            | `POST /rooms/:id/export`          | POST   |

#### Autocomplete

| v1                                         | v2                                               | Method |
| ------------------------------------------ | ------------------------------------------------ | ------ |
| `GET rooms.autocomplete.channelAndPrivate` | `GET /rooms/autocomplete?q=...`                  | GET    |
| `GET rooms.autocomplete.adminRooms`        | `GET /admin/rooms/autocomplete?q=...`            | GET    |
| `GET rooms.autocomplete.availableForTeams` | `GET /rooms/autocomplete?availableForTeams=true` | GET    |

#### Notifications and Media

| v1                                     | v2                                      | Method |
| -------------------------------------- | --------------------------------------- | ------ |
| `POST rooms.saveNotification`          | `PUT /rooms/:id/notifications`          | PUT    |
| `POST rooms.media/:rid`                | `POST /rooms/:id/media`                 | POST   |
| `POST rooms.mediaConfirm/:rid/:fileId` | `POST /rooms/:id/media/:fileId/confirm` | POST   |
| `GET rooms.membersOrderedByRole`       | `GET /rooms/:id/members?sort=role`      | GET    |
| `GET rooms.isMember`                   | `GET /rooms/:id/members/:userId/check`  | GET    |

---

### 3.2 Messages

| v1                              | v2                                        | Method | Notes                   |
| ------------------------------- | ----------------------------------------- | ------ | ----------------------- |
| `POST chat.postMessage`         | `POST /messages`                          | POST   |                         |
| `POST chat.sendMessage`         | `POST /messages`                          | POST   | Unify with postMessage  |
| `GET chat.getMessage`           | `GET /messages/:id`                       | GET    |                         |
| `POST chat.delete`              | `DELETE /messages/:id`                    | DELETE |                         |
| `GET chat.search`               | `GET /messages?q=...&rid=...`             | GET    |                         |
| `POST chat.react`               | `POST /messages/:id/reactions`            | POST   |                         |
| `POST chat.reportMessage`       | `POST /messages/:id/reports`              | POST   |                         |
| `GET chat.getPinnedMessages`    | `GET /rooms/:id/messages?pinned=true`     | GET    |                         |
| `GET chat.getStarredMessages`   | `GET /rooms/:id/messages?starred=true`    | GET    |                         |
| `GET chat.getMentionedMessages` | `GET /rooms/:id/messages?mentioned=true`  | GET    |                         |
| `GET chat.getDeletedMessages`   | `GET /rooms/:id/messages?deleted=true`    | GET    |                         |
| `GET chat.getThreadMessages`    | `GET /messages/:id/thread`                | GET    |                         |
| `GET chat.getThreadsList`       | `GET /rooms/:id/threads`                  | GET    |                         |
| `GET chat.syncMessages`         | `GET /rooms/:id/messages/sync?since=...`  | GET    |                         |
| `GET chat.syncThreadMessages`   | `GET /messages/:id/thread/sync?since=...` | GET    |                         |
| `GET chat.syncThreadsList`      | `GET /rooms/:id/threads/sync?since=...`   | GET    |                         |
| `GET chat.getDiscussions`       | `GET /rooms/:id/discussions`              | GET    | Already mapped in rooms |
| `GET chat.getURLPreview`        | `GET /url-preview?url=...`                | GET    |                         |
| `GET chat.ignoreUser`           | `POST /subscriptions/:id/ignore/:userId`  | POST   | Move to subscriptions   |

---

### 3.3 Users

#### Core CRUD

| v1                       | v2                      | Method |
| ------------------------ | ----------------------- | ------ |
| `POST users.create`      | `POST /users`           | POST   |
| `GET users.info`         | `GET /users/:id`        | GET    |
| `GET users.list`         | `GET /users`            | GET    |
| `GET users.listByStatus` | `GET /users?status=...` | GET    |
| `POST users.update`      | `PATCH /users/:id`      | PATCH  |
| `POST users.delete`      | `DELETE /users/:id`     | DELETE |
| `POST users.register`    | `POST /users/register`  | POST   |
| `GET me`                 | `GET /users/me`         | GET    |

#### Avatar

| v1                       | v2                         | Method |
| ------------------------ | -------------------------- | ------ |
| `POST users.setAvatar`   | `PUT /users/:id/avatar`    | PUT    |
| `POST users.resetAvatar` | `DELETE /users/:id/avatar` | DELETE |
| `GET users.getAvatar`    | `GET /users/:id/avatar`    | GET    |

#### Status and Presence

| v1                      | v2                        | Method |
| ----------------------- | ------------------------- | ------ |
| `POST users.setStatus`  | `PUT /users/me/status`    | PUT    |
| `GET users.getStatus`   | `GET /users/:id/status`   | GET    |
| `GET users.getPresence` | `GET /users/:id/presence` | GET    |
| `GET users.presence`    | `GET /users/presence`     | GET    |

#### Preferences

| v1                          | v2                          | Method |
| --------------------------- | --------------------------- | ------ |
| `GET users.getPreferences`  | `GET /users/me/preferences` | GET    |
| `POST users.setPreferences` | `PUT /users/me/preferences` | PUT    |

#### Access Tokens

| v1                                         | v2                                            | Method |
| ------------------------------------------ | --------------------------------------------- | ------ |
| `GET users.getPersonalAccessTokens`        | `GET /users/me/tokens`                        | GET    |
| `POST users.generatePersonalAccessToken`   | `POST /users/me/tokens`                       | POST   |
| `POST users.removePersonalAccessToken`     | `DELETE /users/me/tokens/:tokenName`          | DELETE |
| `POST users.regeneratePersonalAccessToken` | `POST /users/me/tokens/:tokenName/regenerate` | POST   |

#### 2FA Authentication

| v1                             | v2                                   | Method |
| ------------------------------ | ------------------------------------ | ------ |
| `POST users.2fa.enableEmail`   | `POST /users/me/2fa/email`           | POST   |
| `POST users.2fa.disableEmail`  | `DELETE /users/me/2fa/email`         | DELETE |
| `POST users.2fa.sendEmailCode` | `POST /users/me/2fa/email/send-code` | POST   |

#### Administrative Actions

| v1                                 | v2                                        | Method |
| ---------------------------------- | ----------------------------------------- | ------ |
| `POST users.setActiveStatus`       | `PATCH /users/:id/active`                 | PATCH  |
| `POST users.deactivateIdle`        | `POST /users/deactivate-idle`             | POST   |
| `POST users.resetE2EKey`           | `POST /users/:id/reset-e2e-key`           | POST   |
| `POST users.resetTOTP`             | `POST /users/:id/reset-totp`              | POST   |
| `POST users.sendConfirmationEmail` | `POST /users/:id/send-confirmation-email` | POST   |
| `POST users.sendWelcomeEmail`      | `POST /users/:id/send-welcome-email`      | POST   |

#### Session

| v1                              | v2                             | Method |
| ------------------------------- | ------------------------------ | ------ |
| `POST users.logout`             | `POST /users/me/logout`        | POST   |
| `POST users.logoutOtherClients` | `POST /users/me/logout-others` | POST   |
| `POST users.removeOtherTokens`  | `DELETE /users/me/sessions`    | DELETE |
| `POST users.forgotPassword`     | `POST /users/forgot-password`  | POST   |
| `POST users.deleteOwnAccount`   | `DELETE /users/me`             | DELETE |

#### Other

| v1                                    | v2                                           | Method |
| ------------------------------------- | -------------------------------------------- | ------ |
| `GET users.autocomplete`              | `GET /users/autocomplete?q=...`              | GET    |
| `GET users.checkUsernameAvailability` | `GET /users/username-available?username=...` | GET    |
| `GET users.getUsernameSuggestion`     | `GET /users/username-suggestion`             | GET    |
| `GET users.listTeams`                 | `GET /users/:id/teams`                       | GET    |
| `POST users.updateOwnBasicInfo`       | `PATCH /users/me`                            | PATCH  |
| `GET users.requestDataDownload`       | `POST /users/me/data-export`                 | POST   |

---

### 3.4 Teams

| v1                            | v2                                          | Method |
| ----------------------------- | ------------------------------------------- | ------ |
| `POST teams.create`           | `POST /teams`                               | POST   |
| `GET teams.info`              | `GET /teams/:id`                            | GET    |
| `GET teams.list`              | `GET /teams`                                | GET    |
| `GET teams.listAll`           | `GET /teams?scope=all`                      | GET    |
| `POST teams.update`           | `PATCH /teams/:id`                          | PATCH  |
| `POST teams.delete`           | `DELETE /teams/:id`                         | DELETE |
| `GET teams.members`           | `GET /teams/:id/members`                    | GET    |
| `POST teams.addMembers`       | `POST /teams/:id/members`                   | POST   |
| `POST teams.removeMember`     | `DELETE /teams/:id/members/:userId`         | DELETE |
| `POST teams.updateMember`     | `PATCH /teams/:id/members/:userId`          | PATCH  |
| `GET teams.listRooms`         | `GET /teams/:id/rooms`                      | GET    |
| `GET teams.listChildren`      | `GET /teams/:id/rooms?includeChildren=true` | GET    |
| `GET teams.listRoomsOfUser`   | `GET /teams/:id/rooms?userId=...`           | GET    |
| `POST teams.addRooms`         | `POST /teams/:id/rooms`                     | POST   |
| `POST teams.removeRoom`       | `DELETE /teams/:id/rooms/:roomId`           | DELETE |
| `POST teams.updateRoom`       | `PATCH /teams/:id/rooms/:roomId`            | PATCH  |
| `POST teams.convertToChannel` | `POST /teams/:id/convert-to-channel`        | POST   |
| `POST teams.leave`            | `POST /teams/:id/leave`                     | POST   |
| `GET teams.autocomplete`      | `GET /teams/autocomplete?q=...`             | GET    |

---

### 3.5 Subscriptions

| v1                          | v2                               | Method |
| --------------------------- | -------------------------------- | ------ |
| `GET subscriptions.get`     | `GET /subscriptions`             | GET    |
| `GET subscriptions.getOne`  | `GET /subscriptions/:id`         | GET    |
| `POST subscriptions.read`   | `POST /subscriptions/:id/read`   | POST   |
| `POST subscriptions.unread` | `POST /subscriptions/:id/unread` | POST   |

---

### 3.6 Integrations

| v1                         | v2                              | Method |
| -------------------------- | ------------------------------- | ------ |
| `POST integrations.create` | `POST /integrations`            | POST   |
| `GET integrations.get`     | `GET /integrations/:id`         | GET    |
| `GET integrations.list`    | `GET /integrations`             | GET    |
| `PUT integrations.update`  | `PUT /integrations/:id`         | PUT    |
| `POST integrations.remove` | `DELETE /integrations/:id`      | DELETE |
| `GET integrations.history` | `GET /integrations/:id/history` | GET    |

---

### 3.7 Settings

| v1                             | v2                                     | Method |
| ------------------------------ | -------------------------------------- | ------ |
| `GET settings`                 | `GET /settings`                        | GET    |
| `GET settings/:_id`            | `GET /settings/:id`                    | GET    |
| `POST settings/:_id`           | `PATCH /settings/:id`                  | PATCH  |
| `GET settings.public`          | `GET /settings?scope=public`           | GET    |
| `GET settings.oauth`           | `GET /settings/oauth`                  | GET    |
| `POST settings.addCustomOAuth` | `POST /settings/oauth`                 | POST   |
| `GET service.configurations`   | `GET /settings/service-configurations` | GET    |

---

### 3.8 Custom Emoji

| v1                         | v2                                    | Method |
| -------------------------- | ------------------------------------- | ------ |
| `GET emoji-custom.all`     | `GET /custom-emojis`                  | GET    |
| `GET emoji-custom.list`    | `GET /custom-emojis?updatedSince=...` | GET    |
| `POST emoji-custom.create` | `POST /custom-emojis`                 | POST   |
| `POST emoji-custom.update` | `PUT /custom-emojis/:id`              | PUT    |
| `POST emoji-custom.delete` | `DELETE /custom-emojis/:id`           | DELETE |

---

### 3.9 Invites

| v1                         | v2                             | Method |
| -------------------------- | ------------------------------ | ------ |
| `POST sendInvitationEmail` | `POST /invites`                | POST   |
| `DELETE removeInvite/:_id` | `DELETE /invites/:id`          | DELETE |
| `POST validateInviteToken` | `GET /invites/:token/validate` | GET    |
| `POST useInviteToken`      | `POST /invites/:token/use`     | POST   |

---

### 3.10 Moderation

| v1                                            | v2                                                   | Method |
| --------------------------------------------- | ---------------------------------------------------- | ------ |
| `GET moderation.reports`                      | `GET /moderation/reports`                            | GET    |
| `GET moderation.reportInfo`                   | `GET /moderation/reports/:id`                        | GET    |
| `POST moderation.dismissReports`              | `DELETE /moderation/reports/:id`                     | DELETE |
| `POST moderation.reportUser`                  | `POST /moderation/user-reports`                      | POST   |
| `GET moderation.reportsByUsers`               | `GET /moderation/user-reports`                       | GET    |
| `GET moderation.userReports`                  | `GET /moderation/user-reports?userId=...`            | GET    |
| `POST moderation.dismissUserReports`          | `DELETE /moderation/user-reports/:userId`            | DELETE |
| `GET moderation.user.reportedMessages`        | `GET /moderation/users/:userId/reported-messages`    | GET    |
| `POST moderation.user.deleteReportedMessages` | `DELETE /moderation/users/:userId/reported-messages` | DELETE |
| `GET moderation.user.reportsByUserId`         | `GET /moderation/users/:userId/reports`              | GET    |

---

### 3.11 Calendar Events

| v1                            | v2                             | Method |
| ----------------------------- | ------------------------------ | ------ |
| `POST calendar-events.create` | `POST /calendar-events`        | POST   |
| `GET calendar-events.info`    | `GET /calendar-events/:id`     | GET    |
| `GET calendar-events.list`    | `GET /calendar-events`         | GET    |
| `POST calendar-events.update` | `PATCH /calendar-events/:id`   | PATCH  |
| `POST calendar-events.delete` | `DELETE /calendar-events/:id`  | DELETE |
| `POST calendar-events.import` | `POST /calendar-events/import` | POST   |

---

### 3.12 Video Conference

| v1                                  | v2                                    | Method |
| ----------------------------------- | ------------------------------------- | ------ |
| `POST video-conference.start`       | `POST /video-conferences`             | POST   |
| `GET video-conference.info`         | `GET /video-conferences/:id`          | GET    |
| `GET video-conference.list`         | `GET /video-conferences`              | GET    |
| `POST video-conference.join`        | `POST /video-conferences/:id/join`    | POST   |
| `POST video-conference.cancel`      | `POST /video-conferences/:id/cancel`  | POST   |
| `GET video-conference.capabilities` | `GET /video-conferences/capabilities` | GET    |
| `GET video-conference.providers`    | `GET /video-conferences/providers`    | GET    |

---

### 3.13 Email Inbox

| v1                                | v2                             | Method |
| --------------------------------- | ------------------------------ | ------ |
| `POST email-inbox`                | `POST /email-inboxes`          | POST   |
| `GET email-inbox.list`            | `GET /email-inboxes`           | GET    |
| `GET email-inbox/:_id`            | `GET /email-inboxes/:id`       | GET    |
| `DELETE email-inbox/:_id`         | `DELETE /email-inboxes/:id`    | DELETE |
| `GET email-inbox.search`          | `GET /email-inboxes?q=...`     | GET    |
| `POST email-inbox.send-test/:_id` | `POST /email-inboxes/:id/test` | POST   |

---

### 3.14 Banners

| v1                     | v2                          | Method |
| ---------------------- | --------------------------- | ------ |
| `GET banners`          | `GET /banners`              | GET    |
| `GET banners/:id`      | `GET /banners/:id`          | GET    |
| `POST banners.dismiss` | `POST /banners/:id/dismiss` | POST   |

---

### 3.15 Cloud

| v1                                    | v2                                     | Method |
| ------------------------------------- | -------------------------------------- | ------ |
| `GET cloud.registrationStatus`        | `GET /cloud/registration`              | GET    |
| `POST cloud.createRegistrationIntent` | `POST /cloud/registration`             | POST   |
| `POST cloud.registerPreIntent`        | `POST /cloud/registration/pre-intent`  | POST   |
| `POST cloud.manualRegister`           | `POST /cloud/registration/manual`      | POST   |
| `GET cloud.confirmationPoll`          | `GET /cloud/registration/confirmation` | GET    |
| `POST cloud.syncWorkspace`            | `POST /cloud/sync`                     | POST   |
| `POST cloud.removeLicense`            | `DELETE /cloud/license`                | DELETE |
| `GET cloud.checkoutUrl`               | `GET /cloud/checkout-url`              | GET    |

---

### 3.16 Import

| v1                              | v2                                       | Method |
| ------------------------------- | ---------------------------------------- | ------ |
| `POST import.new`               | `POST /imports`                          | POST   |
| `GET import.status`             | `GET /imports/status`                    | GET    |
| `POST import.run`               | `POST /imports/run`                      | POST   |
| `POST import.clear`             | `DELETE /imports/current`                | DELETE |
| `POST import.addUsers`          | `POST /imports/users`                    | POST   |
| `GET importers.list`            | `GET /importers`                         | GET    |
| `GET getCurrentImportOperation` | `GET /imports/current`                   | GET    |
| `GET getImportFileData`         | `GET /imports/current/file-data`         | GET    |
| `GET getImportProgress`         | `GET /imports/current/progress`          | GET    |
| `GET getLatestImportOperations` | `GET /imports/history`                   | GET    |
| `POST startImport`              | `POST /imports/current/start`            | POST   |
| `POST uploadImportFile`         | `POST /imports/current/upload`           | POST   |
| `POST downloadPendingFiles`     | `POST /imports/current/download-files`   | POST   |
| `POST downloadPendingAvatars`   | `POST /imports/current/download-avatars` | POST   |
| `POST downloadPublicImportFile` | `POST /imports/current/download-public`  | POST   |

---

### 3.17 Commands

| v1                      | v2                                | Method |
| ----------------------- | --------------------------------- | ------ |
| `GET commands.list`     | `GET /commands`                   | GET    |
| `GET commands.get`      | `GET /commands/:command`          | GET    |
| `POST commands.run`     | `POST /commands/:command/run`     | POST   |
| `GET commands.preview`  | `GET /commands/:command/preview`  | GET    |
| `POST commands.preview` | `POST /commands/:command/preview` | POST   |

---

### 3.18 Custom User Status

| v1                               | v2                                 | Method |
| -------------------------------- | ---------------------------------- | ------ |
| `GET custom-user-status.list`    | `GET /custom-user-statuses`        | GET    |
| `POST custom-user-status.create` | `POST /custom-user-statuses`       | POST   |
| `POST custom-user-status.update` | `PUT /custom-user-statuses/:id`    | PUT    |
| `POST custom-user-status.delete` | `DELETE /custom-user-statuses/:id` | DELETE |

---

### 3.19 Push

| v1               | v2                       | Method |
| ---------------- | ------------------------ | ------ |
| `GET push.get`   | `GET /push/subscription` | GET    |
| `GET push.info`  | `GET /push/info`         | GET    |
| `POST push.test` | `POST /push/test`        | POST   |

---

### 3.20 Statistics

| v1                          | v2                           | Method |
| --------------------------- | ---------------------------- | ------ |
| `GET statistics`            | `GET /statistics`            | GET    |
| `GET statistics.list`       | `GET /statistics/history`    | GET    |
| `POST statistics.telemetry` | `POST /statistics/telemetry` | POST   |

---

### 3.21 Uploads

| v1                    | v2                    | Method |
| --------------------- | --------------------- | ------ |
| `POST uploads.delete` | `DELETE /uploads/:id` | DELETE |

---

### 3.22 Assets

| v1                       | v2                      | Method |
| ------------------------ | ----------------------- | ------ |
| `POST assets.setAsset`   | `PUT /assets/:asset`    | PUT    |
| `POST assets.unsetAsset` | `DELETE /assets/:asset` | DELETE |

---

### 3.23 WebDAV

| v1                                | v2                            | Method |
| --------------------------------- | ----------------------------- | ------ |
| `GET webdav.getMyAccounts`        | `GET /webdav/accounts`        | GET    |
| `POST webdav.removeWebdavAccount` | `DELETE /webdav/accounts/:id` | DELETE |

---

### 3.24 LDAP

| v1                         | v2                           | Method |
| -------------------------- | ---------------------------- | ------ |
| `POST ldap.testConnection` | `POST /ldap/test-connection` | POST   |
| `POST ldap.testSearch`     | `POST /ldap/test-search`     | POST   |

---

### 3.25 Mailer

| v1                        | v2                         | Method |
| ------------------------- | -------------------------- | ------ |
| `POST mailer`             | `POST /mailer/send`        | POST   |
| `POST mailer.unsubscribe` | `POST /mailer/unsubscribe` | POST   |

---

### 3.26 Presence

| v1                              | v2                          | Method |
| ------------------------------- | --------------------------- | ------ |
| `POST presence.enableBroadcast` | `POST /presence/broadcast`  | POST   |
| `GET presence.getConnections`   | `GET /presence/connections` | GET    |

---

### 3.27 Misc

| v1                             | v2                                        | Method |
| ------------------------------ | ----------------------------------------- | ------ |
| `GET directory`                | `GET /directory`                          | GET    |
| `GET spotlight`                | `GET /search/spotlight?q=...`             | GET    |
| `GET pw.getPolicy`             | `GET /password-policy`                    | GET    |
| `GET shield.svg`               | `GET /shield.svg`                         | GET    |
| `GET smtp.check`               | `GET /smtp/status`                        | GET    |
| `POST fingerprint`             | `POST /fingerprint`                       | POST   |
| `POST method.call/:method`     | Deprecate (migrate to specific endpoints) | —      |
| `POST method.callAnon/:method` | Deprecate (migrate to specific endpoints) | —      |

---

### 3.28 Call History

| v1                      | v2                      | Method |
| ----------------------- | ----------------------- | ------ |
| `GET call-history.info` | `GET /call-history/:id` | GET    |
| `GET call-history.list` | `GET /call-history`     | GET    |

---

### 3.29 Instances

| v1                  | v2               | Method |
| ------------------- | ---------------- | ------ |
| `GET instances.get` | `GET /instances` | GET    |

---

## 4. Impact Metrics

### 4.1 Endpoint Reduction

| Domain                            | v1 (endpoints) | v2 (endpoints) | Reduction |
| --------------------------------- | -------------- | -------------- | --------- |
| Rooms (channels + groups + rooms) | ~120           | ~45            | **-62%**  |
| Messages (chat)                   | 19             | 16             | -16%      |
| Users                             | 39             | 35             | -10%      |
| Teams                             | 19             | 17             | -11%      |
| Other                             | ~220           | ~200           | -9%       |
| **Total**                         | **~420**       | **~313**       | **~-25%** |

### 4.2 HTTP Method Distribution Improvement

| Method | v1    | v2   |
| ------ | ----- | ---- |
| GET    | ~38%  | ~45% |
| POST   | ~60%  | ~30% |
| PATCH  | 0%    | ~10% |
| PUT    | ~0.5% | ~8%  |
| DELETE | ~1.5% | ~7%  |

---

## 5. Execution Plan

### Phase 1 — Foundation (Sprints 1–2)

- Define v2 routing middleware
- Implement v2 response standard
- Configure automatic OpenAPI generation
- Implement deprecation headers for v1
- **Domains**: Integrations, Custom User Status, Custom Emoji (smaller domains, already close to REST)

### Phase 2 — Core Resources (Sprints 3–6)

- **Teams**: 19 endpoints, pattern already close to REST
- **Subscriptions**: 4 endpoints, simple migration
- **Settings**: 7 endpoints
- **Banners, Calendar, Video Conference**: medium-sized domains

### Phase 3 — Rooms Unification (Sprints 7–10)

- Unify `channels.*`, `groups.*`, and `rooms.*` into `/rooms`
- Biggest impact: ~120 → ~45 endpoints
- Requires SDK and documentation updates

### Phase 4 — Users and Messages (Sprints 11–13)

- **Users**: 39 endpoints, significant reorganization
- **Messages**: 19 endpoints, filter reclassification

### Phase 5 — Remaining and Cleanup (Sprints 14–16)

- Migrate remaining domains (Import, Cloud, Moderation, etc.)
- Deprecate `method.call` and `method.callAnon`
- Update official SDKs
- Publish migration guide for integrators

### Phase 6 — v1 Sunset (6 months after v2 completion)

- Communicate deactivation timeline
- Move v1 to legacy mode (critical bugfixes only)
- Deactivate v1 after sunset period

---

## 6. Considerations

### 6.1 Compatibility

- Official SDKs (JS, mobile) need parallel updates
- Marketplace apps using v1 API need a migration period
- Webhooks and external integrations need to be notified

### 6.2 Risks

- **Scope**: channels/groups/rooms unification is the most complex change
- **Breaking changes**: v2 is a new API, not backwards-compatible with v1
- **Performance**: ensure the v2 routing layer does not add latency

### 6.3 Technical Requirements

- OpenAPI 3.1 spec auto-generated for all of v2
- Request/response validation via schemas (already partially implemented with AJV)
- Rate limiting per resource/method
- Schema versioning for future evolution without breaking changes
