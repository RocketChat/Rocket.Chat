# Complex DDP → REST migration analysis

Methods that resisted the trivial URL-swap pass in #40659. For each one this
document captures the DDP signature, the REST endpoint shape, the caller(s),
the concrete mismatch, and a recommended path forward.

Status legend:
- **caller refactor** — REST endpoint is fine; the caller has to do extra work
  (destructure response, re-paginate, reshape input).
- **server work** — REST endpoint is missing capabilities the DDP method
  provides; we either extend the REST endpoint or add a new one.
- **out of scope** — migration would change behavior in ways callers depend
  on; keep DDP until the affected feature is redesigned.

---

## 1. `requestDataDownload` → `GET /v1/users.requestDataDownload`

**Caller**: `apps/meteor/client/views/account/preferences/PreferencesMyDataSection.tsx`

**DDP returns**:
```ts
{ requested: boolean; exportOperation: IExportOperation; url: string | null; pendingOperationsBeforeMyRequest: number }
```

**REST returns** (apps/meteor/app/api/server/v1/users.ts:1604):
```ts
{ requested: boolean; exportOperation: IExportOperation; success: true }
```

**Mismatch**: REST drops `url` and `pendingOperationsBeforeMyRequest`. Caller uses both
of them to render the "your previous export is ready at <link>" and "there
are N exports queued before yours" branches in the modal.

**Recommendation**: **server work**. Update REST endpoint to forward `url` and
`pendingOperationsBeforeMyRequest` from the underlying `requestDataDownload`
helper; the data is already there, the endpoint just isn't passing it through.

---

## 2. `registerUser` → `POST /v1/users.register`

**Callers**:
- `apps/meteor/client/views/room/composer/ComposerAnonymous.tsx` (anonymous join)
- `packages/ui-client/src/views/setupWizard/providers/SetupWizardProvider.tsx`
  (setup-wizard admin bootstrap)

**DDP returns**:
- when `formData.email === null`: a stamped login token `{ token, when }` so
  the caller can auto-login (anonymous flow).
- otherwise: the new user's `_id` (string).

**REST returns** (apps/meteor/app/api/server/v1/users.ts:929):
```ts
{ user: IUser; success: true }
```

**Mismatch**: the anonymous path needs the login token. REST never exposes it
because it assumes the client will follow with a separate login call.

**Recommendation**: **server work** + **caller refactor**:
- Keep the standard sign-up path using REST as-is.
- For `ComposerAnonymous.tsx`, REST `users.register` is unsuitable for
  anonymous users (no email, needs auto-login). Either add a dedicated
  `users.registerAnonymous` REST endpoint that returns the login token, or
  keep the DDP method alive specifically for that callsite and remove it
  from the deprecation list. Anonymous read is a niche enough feature that
  the second option is reasonable for now.

---

## 3. `executeSlashCommandPreview` → `POST /v1/commands.preview`

**Caller**: `apps/meteor/client/views/room/composer/ComposerBoxPopupPreview.tsx`

**DDP signature**: `executeSlashCommandPreview(command, preview)` where
`command = { cmd, params, msg: { rid, tmid } }` and `preview = { id, type, value }`.

**REST body** (apps/meteor/app/api/server/v1/commands.ts:476):
```ts
{ command: string; params: string; roomId: string; tmid?: string; triggerId: string; previewItem: { id, type, value } }
```

**Mismatch**: REST requires `triggerId`. The caller in `ComposerBoxPopupPreview`
does not currently generate one — `triggerId` is part of the slash-command
interactive-message protocol and is normally produced by the slash command
runtime, not the preview popup.

**Recommendation**: **caller refactor**. Generate a `triggerId` at the
callsite (the `triggerId` field is what the slash-command service uses to
correlate the preview click back to the originating command). The caller
already has access to a `Random.id()`-equivalent generator.

---

## 4. `createDirectMessage` → `POST /v1/im.create` (or `dm.create`)

**Callers**:
- `apps/meteor/client/views/room/hooks/useOpenRoom.ts` (anonymous opening of
  a DM URL like `/direct/<username>`)
- `apps/meteor/app/slashcommands-open/client/client.ts`

**DDP signature**: `createDirectMessage(...usernames: string[])` (variadic),
returns `{ rid: IRoom['_id'] }`.

**REST body** (apps/meteor/app/api/server/v1/im.ts:903): one of
`{ username: string }` or `{ usernames: string }` (comma-separated), returns:
```ts
{ room: IRoom & { _id: string } /* room.rid mirrored as _id */; success: true }
```

**Mismatch**: response shape `{ rid }` vs `{ room: { _id } }`. Caller in
`useOpenRoom.ts:47` destructures `{ rid }` directly. Also the variadic
argument spread (`createDirectMessage(...reference.split(', '))`) needs to
become a comma-separated string body.

**Recommendation**: **caller refactor**. Pass `{ usernames: reference }` to
the REST endpoint and use `room._id` (REST already mirrors `room.rid` as
`room._id`). Straightforward — listed as complex because the response
destructure is wrong on every callsite.

---

## 5. `getRoomById` → `GET /v1/rooms.info`

**Caller**: `apps/meteor/client/views/room/hooks/useGoToRoom.ts`

**DDP returns**: bare `IRoom`.

**REST returns** (apps/meteor/app/api/server/v1/rooms.ts):
```ts
{ room: IRoom | null; team?: ITeam; parent?: IRoom; success: true }
```

**Mismatch**: REST wraps the room in `{ room }` and additionally fetches the
team and parent room. Two extra DB hits per call. Caller only uses
`room.t` and `room._id` (to build the route).

**Recommendation**: **caller refactor**. Destructure `{ room }`, accept the
extra DB hits — they're rare (only when the in-store `Subscriptions.state`
miss path is taken). Acceptable to ship as-is; the team/parent lookups are
inexpensive against the indexed lookups.

---

## 6. `getThreadMessages` → `GET /v1/chat.getThreadMessages`

**Caller**: `apps/meteor/client/views/room/contextualBar/Threads/hooks/useThreadMessagesQuery.ts`

**DDP returns**: `IMessage[]` including the parent message (prepended), and
calls `readThread(uid, tmid)` as a side effect (marking the thread as read
for the calling user).

**REST returns**:
```ts
{ messages: IMessage[]; count: number; offset: number; total: number; success: true }
```
Does **not** prepend the parent message and does **not** mark the thread as
read.

**Mismatch**:
1. Response shape differs (paginated wrapper).
2. Parent message no longer included — caller (`useThreadMessagesQuery`)
   filters out `msg._id !== tmid` so even if it were included it would be
   stripped, but other callsites might rely on it being present.
3. Read-marker side effect is missing. The thread won't auto-mark-as-read
   when the contextual bar opens.

**Recommendation**: **caller refactor** + **server work**:
- Caller can destructure `{ messages }` (the parent-message filtering it
  already does makes the prepend irrelevant).
- For the read-marker side effect: either add `readThread` as an explicit
  step in the caller (call `POST /v1/subscriptions.read` after fetching),
  or update the REST endpoint to do it server-side when the caller is the
  thread participant. Caller-side is the cleaner choice — it's the same
  pattern as marking a regular room read after opening it.

---

## 7. `listCustomUserStatus` → `GET /v1/custom-user-status.list`

**Caller**: `apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/hooks/useStatusItems.tsx`

**DDP returns**: `ICustomUserStatus[]` (the full list).

**REST returns**:
```ts
PaginatedResult<{ statuses: ICustomUserStatus[] }> // { statuses, count, offset, total, success }
```

**Mismatch**: REST is paginated; default limit is 50. `userStatuses.sync` (in
`apps/meteor/client/lib/userStatuses.ts`) takes the full array and stores
it locally as a complete cache.

**Recommendation**: **caller refactor**. Loop with `offset` until
`offset + count >= total`. Or pass `count: total` from a first call. Or
update `userStatuses.sync` to know how to page the source. The status list
is bounded in practice (few dozen entries on a typical workspace) — paging
through once is fine.

---

## 8. `setAvatarFromService` → `POST /v1/users.setAvatar`

**Caller**: `apps/meteor/client/hooks/useUpdateAvatar.ts`

**DDP signature**:
`setAvatarFromService(dataURI: string, contentType: string, service: string, targetUserId?: string)`.
The server fetches the avatar from the named service (Gravatar, Twitter, Google, GitHub, etc.)
or accepts a data URI and stores it as the user's avatar.

**REST body** (apps/meteor/app/api/server/v1/users.ts:921): one of
- multipart with `image` file (and optional `userId`)
- JSON with `{ avatarUrl, userId? }`.

No `service` parameter, no `dataURI` parameter.

**Mismatch**: REST has no way to "import this avatar from `<named service>`".
For the Gravatar / GitHub / Google import paths, the DDP method handles the
service-specific HTTP fetch on the server. REST would require the client to
do the fetch (CORS + auth issues) or to send a `dataURI` (server-side blob
upload).

**Recommendation**: **server work**. Either:
- Extend `users.setAvatar` to accept `{ service: string }` and an opaque
  `serviceToken` and replicate the DDP fetch on the server, or
- Add `users.setAvatarFromService` as a new REST endpoint that mirrors the
  DDP method 1:1.

Until then, keep DDP `setAvatarFromService` alive — the alternative is
broken UI for Gravatar/Google/GitHub avatar import.

---

## 9. `sendMessage` → `POST /v1/chat.sendMessage`

**Callers** (8):
- `apps/meteor/client/lib/chats/flows/sendMessage.ts` (primary message flow)
- `apps/meteor/client/hooks/notification/useNotification.ts` (sound test message)
- `apps/meteor/client/apps/gameCenter/GameCenterInvitePlayersModal.tsx`
- `apps/meteor/app/slashcommand-asciiarts/client/lenny.ts`
- `apps/meteor/app/slashcommand-asciiarts/client/tableflip.ts`
- `apps/meteor/app/slashcommand-asciiarts/client/unflip.ts`
- `apps/meteor/app/slashcommand-asciiarts/client/gimme.ts`
- `apps/meteor/app/slashcommand-asciiarts/client/shrug.ts`

**DDP signature**: `sendMessage(message: IMessage, previewUrls?: string[])`,
returns the sent `IMessage`.

**REST body** (apps/meteor/app/api/server/v1/chat.ts):
```ts
{ message: Partial<IMessage>; previewUrls?: string[] }
```
returns `{ message: IMessage; success: true }`.

**Mismatch**: response wrapped in `{ message }`. Both call shapes converge
on `executeSendMessage` so behavior is identical — only the wire format
differs.

**Recommendation**: **caller refactor** (large). All 8 callers need:
1. Body shape changed from positional `(message, previewUrls)` to
   `{ message, previewUrls }`.
2. Result destructured from `{ message }` if the return value is used.

`sendMessage.ts` is on the critical send-message path — needs careful
testing (offline send, retry, optimistic UI). The asciiart slash commands
are mechanical. Suggest splitting the migration: asciiarts + GameCenter +
useNotification first as a low-risk batch, then `sendMessage.ts` as a
separate PR with QA.

---

## 10. `subscriptions/get` (and `rooms/get`, `permissions/get`, `public-settings/get`, `private-settings/get`)

**Caller**: `apps/meteor/client/lib/cachedStores/CachedStore.ts`

**DDP call pattern** (template literal — invisible to the audit's literal
scanner):
```ts
const data = await sdk.call(`${this.name}/get`);          // initial load
const data = await sdk.call(`${this.name}/get`, updatedSince); // sync
```

`this.name` is one of: `subscriptions`, `rooms`, `permissions`,
`public-settings`, `private-settings`.

**REST endpoints**:
- `subscriptions.get` ✅ exists
- `rooms.adminRooms` exists but is admin-scoped
- `permissions.listAll` ✅ exists
- `settings.public` ✅ exists (covers `public-settings/get`)
- `settings` ✅ exists (covers `private-settings/get`, admin-scoped)

DDP methods return either `T[]` (initial load) or
`{ update: T[]; remove: { _id; _deletedAt }[] }` (sync delta). REST
endpoints have varying shapes — `subscriptions.get` matches the DDP
contract, the others do not.

**Mismatch**:
1. The CachedStore abstraction assumes a single endpoint per store and a
   single shape for both the initial load and the delta sync. Each REST
   endpoint has its own URL and parameter shape.
2. `rooms/get` and `permissions/get` REST equivalents either don't exist
   or are admin-only.

**Recommendation**: **server work** + **caller refactor**:
- Each `Cached*` store subclasses `CachedStore` and supplies its own name.
  Refactor `CachedStore` to take a `loader` / `syncer` callback pair
  instead of building a method name on the fly. Each concrete store
  passes the matching REST call.
- For the missing endpoints (`rooms`, `permissions`), audit whether the
  store is actually used and decide between adding a REST endpoint or
  retiring the store.

This is the biggest of the bunch and the most invasive — touches the
client-side caching layer. Best treated as its own PR.

---

## Summary

| method | recommendation | rough effort |
| --- | --- | --- |
| `requestDataDownload` | server work | small (forward fields) |
| `registerUser` | server work + caller refactor | medium |
| `executeSlashCommandPreview` | caller refactor | small |
| `createDirectMessage` | caller refactor | small |
| `getRoomById` | caller refactor | small |
| `getThreadMessages` | caller refactor + server work | medium |
| `listCustomUserStatus` | caller refactor | small |
| `setAvatarFromService` | server work | medium |
| `sendMessage` | caller refactor across 8 sites | medium |
| `subscriptions/get` (CachedStore) | server work + caller refactor | large |

Pure caller-refactor cases (`executeSlashCommandPreview`, `createDirectMessage`,
`getRoomById`, `listCustomUserStatus`, `getThreadMessages`, `sendMessage`) can
be tackled inside the existing migration PR #40659 once the response-shape
plan is signed off.

The server-work items need separate scope:
- `requestDataDownload` — minor endpoint patch.
- `users.setAvatar` — non-trivial; touches uploads + external HTTP fetches.
- `users.registerAnonymous` — new endpoint or keep DDP for anonymous.
- `CachedStore` — architecture-level refactor, deserves its own design pass.
