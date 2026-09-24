# Persistent Chat (`19b9cb2043f`) — reimplementation inventory

Source commit: `19b9cb2043fd725d3deffeb8cca9dcec4719e692` — "feat: Persistent Chat"
(80 files, +4325/−567). This document lists **everything the commit implements**, so the
commit can be dropped during `git rebase -i feat/pexip-integration` and reimplemented on the
new base.

> **Caveat:** a lot of the raw diff is pure noise — the commit wraps most of
> `server/services/video-conference/service.ts` in `try/catch` + `logger.debug`/`logger.error`
> with **no behavioural change**. That reindentation is why the conflicts are so bad. It is
> called out in §5.9 and is safe to skip entirely.

---

## 0. What the feature actually is

A conference is no longer "open the provider's URL in a tab". Instead `/conference/:id` is an
**in-product page** that splits into:

- a **left side-rail panel** hosting a real Rocket.Chat room (the persistent chat), and
- a **right iframe** hosting the Pexip webapp.

Around that, the commit adds:

1. **Conference ↔ chat room binding** — the chat shown is `conference.discussionRid` when set,
   else `conference.rid`; it can be re-pointed live and every participant follows (new
   `video-conference` DDP stream).
2. **Add participants** mid-call — either invite into the current room (keep history) or fork a
   fresh discussion (no history), plus dial-out of raw phone numbers through the Pexip plugin.
3. **SIP aliases** — an 8-digit numeric alias per conference so a desk phone / scheduled invite
   can dial in, and `/conference/:alias?scheduled=1` lazily materialises a conference.
4. **Window confinement** — the conference window never navigates away; links go to the opener
   (browser) or the desktop main window.
5. **Call-history contextual bar** rework (ongoing/past sections, discussion titles & last
   message).

---

## 1. Data model

### 1.1 `packages/core-typings/src/IVideoConference.ts`

- `IVideoConference` gains:
  - `sipAlias?: string`
  - `sipParticipantCount?: number`
  - `webrtcParticipantCount?: number`
- New exported type:
  ```ts
  export type VideoConferenceWithDiscussion = VideoConference & {
      discussionTitle?: string;
      discussionLastMessage?: IMessage;
  };
  ```

### 1.2 `packages/core-typings/src/INotification.ts`

`INotificationDesktop` gains:
- `requireInteraction?: boolean` — force the notification to persist regardless of the
  recipient's `desktopNotificationRequireInteraction` preference.
- `actions?: { action: string; title: string }[]` — action buttons (desktop app only).
- `payload.conferenceId?: string` — lets the notification offer a "Join" action.

### 1.3 `packages/model-typings/src/models/IVideoConferenceModel.ts` + `packages/models/src/models/VideoConference.ts`

- **New index:** `{ providerName: 1, sipAlias: 1 }`, `unique: true`,
  `partialFilterExpression: { sipAlias: { $exists: true } }`.
- `findPaginatedByRoomId` return type changes from `FindPaginated<FindCursor<VideoConference>>`
  to `FindPaginated<AggregationCursor<VideoConferenceWithDiscussion>>`. Implementation becomes an
  aggregation:
  - `$match: { $or: [{ rid }, { discussionRid: rid }] }` — **key change**: a discussion room now
    resolves the conference it belongs to, because invited users may have no access to the parent
    room.
  - `$sort: { createdAt: -1 }`, `$skip`, `$limit`
  - `$lookup` into `rocketchat_room` on `discussionRid`, projecting `fname`, `name`, `lastMessage`
  - `$addFields`: `discussionTitle = fname ?? name`, `discussionLastMessage = lastMessage`
  - `$project: { providerData: 0, discussionRoom: 0 }`
  - `totalCount` = `countDocuments(matchFilter)`
- `createGroup` signature accepts `sipAlias` and `discussionRid` (both optional, conditionally
  spread into the inserted doc). Note the old signature required `ringing`; the new one does not.
- `setDataById` signature narrows to `Partial<Omit<VideoConference, '_id' | 'sipAlias'>>` and
  **`$unset`s `sipAlias`** when the new `status` is `EXPIRED | ENDED | DECLINED`.
- `setStatusById` likewise `$unset`s `sipAlias` on those terminal statuses.
- `setEndedById` also `$unset`s `sipAlias`.
- New methods:
  - `setSipAliasById(callId, sipAlias)`
  - `unsetSipAliasById(callId)`
  - `findOneByProviderNameAndSipAlias<T>(providerName, sipAlias, options?)`
  - `increaseSipParticipantCount(sipAlias)` → `findOneAndUpdate` `$inc sipParticipantCount`, returns after
  - `increaseWebRTCParticipantCount(conferenceId)` → `$inc webrtcParticipantCount`, returns after

> **Rationale for freeing the alias on end:** aliases are short numeric strings under a unique
> index; releasing them on terminal status keeps the namespace reusable.

---

## 2. Settings — `apps/meteor/server/settings/pexip.ts`

- Default of `Pexip_Integration_Meeting_Url` changes to
  `/webapp/conference?conference={callId}&join=1` (adds `&join=1`).
- **New section `Pexip_Integration_SIP`:**
  - `Pexip_Integration_SIP_AddAlias` — `boolean`, public, default `false`
  - `Pexip_Integration_SIP_Host` — `string`, public, default `''`
  - `Pexip_Integration_SIP_Port` — `int`, public, default `5060`
- **New section `Pexip_Integration_PersistentChat`:**
  - `Pexip_Integration_PersistentChat_ExternalRoom` — `roomPick`, public, default `''`
    (parent room used when a conference is created automatically, e.g. by SIP dial-in)
- `getPexipSettings()` gains a `sip: { addAlias, host, port }` block.
- `packages/pexip/src/definition/PexipSettings.ts` mirrors that with
  `sip: { addAlias: boolean; host: string; port: number }`.

---

## 3. REST API

### 3.1 `packages/rest-typings/src/v1/videoConference/`

- **New** `VideoConfAddParticipantsProps.ts`:
  `{ callId: string; users: string[]; keepHistory?: boolean }` + `isVideoConfAddParticipantsProps`
  (ajv, `additionalProperties: false`, required `callId`, `users`).
- **New** `VideoConfJoinScheduledProps.ts`:
  `{ sipAlias: string }` + `isVideoConfJoinScheduledProps`.
- `index.ts`: export both; register endpoints
  - `POST /v1/video-conference.add-participants` → `{ rid: string }`
  - `POST /v1/video-conference.join-scheduled` → `{ callId: string }`
  - `GET /v1/video-conference.list` response data type becomes `VideoConferenceWithDiscussion[]`

### 3.2 `apps/meteor/server/api/v1/videoConference.ts`

- Response schemas `joinScheduledResponseSchema` and `addParticipantsResponseSchema`.
- **`video-conference.join`** — access check widened: a user may join if they can access
  `call.rid` **or** `call.discussionRid`. (Invited users only belong to the discussion.)
- **`video-conference.info`** — same widened access check.
- **New `POST video-conference.add-participants`**
  (auth required, rate limit 5 req / 60 s):
  - loads the conference (`rid`, `users`, `discussionRid` projection)
  - **external-conference escape hatch**: if the conference lives in the
    `Pexip_Integration_PersistentChat_ExternalRoom` room *and* the caller is already in
    `conf.users`, skip the room-access check (they may not be a member of that parent room)
  - otherwise require `canAccessRoomIdAsync(conf.rid, userId)`
  - dispatches to `VideoConf.addUsersToConferenceRoom` when `keepHistory`, else
    `VideoConf.createConferenceDiscussionWithParticipants`
  - returns `{ rid }`
- **New `POST video-conference.join-scheduled`**
  (auth required, rate limit 15 req / 3 s): calls
  `VideoConf.initializeOrJoinScheduledConference(sipAlias, userId)`, returns `{ callId }`.

---

## 4. Services, events & streams

### 4.1 `packages/core-services/src/events/Events.ts`

New broadcast event:
```ts
'video-conference.discussionUpdated'(data: { callId: VideoConference['_id']; discussionRid: IRoom['_id'] | undefined }): void;
```

### 4.2 `packages/ddp-client/src/types/streams.ts`

New streamer:
```ts
'video-conference': [{ key: `${string}/discussionUpdated`; args: [{ discussionRid: IRoom['_id'] | undefined }] }];
```

### 4.3 `apps/meteor/server/modules/notifications/notifications.module.ts`

- New `streamVideoConference: IStreamer<'video-conference'>` (`new this.Streamer('video-conference')`).
- `allowWrite('none')`; `allowRead` resolves `callId` from `eventName.split('/')[0]`, loads the
  conference (`users` projection) and allows only if the reader is in `call.users`.
- New `notifyVideoConference(callId, event, ...args)` emitting `` `${callId}/${event}` ``.
  (The commit needs a `@ts-expect-error` on the spread because the stream has a single event.)

### 4.4 `apps/meteor/server/modules/listeners/listeners.module.ts`

```ts
service.onEvent('video-conference.discussionUpdated', ({ callId, discussionRid }) => {
    notifications.notifyVideoConference(callId, 'discussionUpdated', { discussionRid });
});
```

### 4.5 `packages/core-services/src/types/IVideoConfService.ts`

`IVideoConfService` gains:
- `list(...)` returns `PaginatedResult<{ data: VideoConferenceWithDiscussion[] }>`
- `createConferenceDiscussionWithParticipants(uid, conference, usernames): Promise<IRoom['_id']>`
- `addUsersToConferenceRoom(uid, conference, usernames): Promise<IRoom['_id']>`
- `joinCall(call, user, options): Promise<string>` (promoted from private)
- `getRidForExternalConference(): Promise<string | null>`
- `makePersistentChatUrlForConference(conferenceId: string): Promise<string>`
- `initializeOrJoinScheduledConference(sipAlias, uid): Promise<string>`

---

## 5. `apps/meteor/server/services/video-conference/service.ts`

### 5.1 SIP alias generation

- `makeSipAlias()` — 8 numeric digits via `crypto.getRandomValues`, **rejection-sampled** to avoid
  modulo bias: first digit from bytes `< 252` mapped to `1–9` (never leading zero), remaining
  digits from bytes `< 250` mapped to `0–9`.
- `addSipAlias(callId, attempt = 0)` — writes the alias; on a duplicate-key error (`E11000`)
  retries up to **20** attempts, then logs and returns `null`.
- `maybeAddSipAliasToCall(callId, providerName)` — no-op unless `providerName === 'core.pexip'`
  **and** `Pexip_Integration_SIP_AddAlias` is on.
- Called from **both** `startDirect` and `startGroup`, immediately after the conference record is
  created and **before** `runNewVideoConferenceEvent`.

### 5.2 Scheduled / SIP-initiated conferences

`initializeOrJoinScheduledConference(sipAlias, uid)`:
1. Throws `feature-disabled` unless `Pexip_Integration_Enabled` **and**
   `Pexip_Integration_SIP_AddAlias`.
2. `findOneByProviderNameAndSipAlias('core.pexip', sipAlias)` — if found, add the user to its
   discussion (`addUserToConferenceDiscussion`) and return the existing `_id`.
3. Otherwise: resolve `getRidForExternalConference()` (throws `invalid-room` if unset), load the
   user, create a discussion via `createDiscussionForConferenceData(getDiscussionDisplayName(), rid, user)`,
   then `VideoConferenceModel.createGroup({ rid, createdBy, title: sipAlias, providerName: 'core.pexip', sipAlias, discussionRid })`.
4. Returns the new `callId`.

> Note the `// TODO: custom title` — the conference title is just the alias.

`getRidForExternalConference()` — reads `Pexip_Integration_PersistentChat_ExternalRoom`, which is
a `roomPick` array; returns the first entry's `_id`, else `null`.

`addUserToConferenceDiscussion(conference, uid)` — `Room.addUserToRoom(discussionRid, { _id: uid })`,
errors logged and swallowed.

`makePersistentChatUrlForConference(conferenceId)` — `` `${Site_Url}/conference/${conferenceId}` ``.

### 5.3 Adding participants — the two modes

**`createConferenceDiscussionWithParticipants(uid, conference, usernames)`** (no history):
1. Load `conference.rid` room (`t`, `usernames` projection) and the acting user.
2. `getRoomForDiscussion(baseRoom._id)` → resolve the top-level parent; get its discussion `type`
   via `roomCoordinator.getRoomDirectives(parent.t).getDiscussionType(parent)`.
3. Compute members = union of
   - `getUsernamesFromRoom(baseRoom)` — DM: `room.usernames`; otherwise subscriptions
     (`Subscriptions.findByRoomIdWhenUsernameExists`). **The conference's own `users` list is
     deliberately not used** — only app-based providers populate it.
   - current `discussionRid` subscribers (if any)
   - the newly selected `usernames`
4. `createRoom(type, Random.id(), user, members, false, false, { fname: name, prid: parent._id, encrypted: false }, { creator: user._id })`
   where `name = getDiscussionDisplayName()`.
5. `Message.saveSystemMessage('discussion-created', parent._id, name, user, { drid: discussion._id })`
   — leaves a pointer in the original room.
6. `assignDiscussionToConference(conference._id, discussion._id)` — the conference's `rid` **never
   changes**; only `discussionRid` moves.
7. `notifyUsersInvitedToConference(...)`.
8. Returns `discussion._id`.

**`addUsersToConferenceRoom(uid, conference, usernames)`** (keep history):
1. Target room = `conference.discussionRid || conference.rid`.
2. `addUsersToRoomMethod(uid, { rid, users: usernames }, user)`
   (import from `../../meteor-methods/rooms/addUsersToRoom`).
3. `notifyUsersInvitedToConference(...)`.
4. Returns `rid`.

**`notifyUsersInvitedToConference(inviter, usernames, callId, room)`** — for each invited user
(`Users.find({ username: { $in } }, { projection: { language: 1 } })`), broadcast
`notify.desktop` with:
- `title` = `room.fname || room.name`
- `text` = `i18n.t('You_were_invited_to_a_conference', { lng: invited.language })`
- `requireInteraction: true`
- `actions: [{ action: 'join', title: i18n.t('Join_call', { lng: invited.language }) }]`
- `payload: { _id: room._id, rid: room._id, sender, type: room.t, name: room.name, conferenceId: callId, message: { msg: text }, audioNotificationValue: '' }`

### 5.4 `assignDiscussionToConference` changes

- Projection widened to include `rid`.
- The existing user-subscription loop is wrapped in `try { … } finally { … }`, and the `finally`
  block **always**:
  - `api.broadcast('video-conference.discussionUpdated', { callId, discussionRid: rid })`
  - `this.notifyVideoConfUpdate(call.rid, callId)` — refreshes the in-room conference message block
    (`notify-room/videoconf`) so its "Join discussion" button appears.

### 5.5 Discussion-name extraction

- `getDiscussionDisplayName()` factored out of `maybeCreateDiscussion`: reads
  `VideoConf_Persistent_Chat_Discussion_Name` (fallback `i18n.t('[date] Video Call Chat')`),
  substitutes `[date]` with `new Date().toISOString().substring(0, 10)`, else prefixes the date.
- `createDiscussionForConferenceData(name, rid, createdBy): Promise<string>` extracted from
  `createDiscussionForConference` so the scheduled-conference path can create a discussion
  **before** the conference record exists. `createDiscussionForConference` now resolves the user,
  delegates, then calls `assignDiscussionToConference`.

### 5.6 `SKIP_DISCUSSIONS_ON_CHANNEL_CONFERENCES`

```ts
// temp fix for DMV project: skip Discussions when starting new conferences from rocket.chat
const SKIP_DISCUSSIONS_ON_CHANNEL_CONFERENCES = true;
```
Guards the `maybeCreateDiscussion` call in **both** `startDirect` and `startGroup`. **Decide
explicitly whether to carry this over** — as written it disables automatic discussion creation for
every new conference, so persistent chat only appears via add-participants or the scheduled path.

### 5.7 Join / URL customization

- `joinCall` becomes `public` (needed by `IVideoConfService`).
- `requireCallUrl(call)` — assertion helper narrowing to `RequiredField<ExternalVideoConference, 'url'>`.
- `getUrl` passes `options` through to the internal provider: `provider.customizeUrl(call, userData, options)`
  (previously the internal handler got no options — mic/cam state was dropped).
- `runOnUserJoinEvent` now calls `provider.onUserJoin(call, user)` for the internal provider
  instead of returning early.
- `getBlocks` signature tightened to `call: VideoConference`.
- `createMessage` signature relaxed to `AtLeast<VideoConference, '_id' | 'rid' | 'providerName'>`.

### 5.8 `apps/meteor/server/lib/videoConfProviders.ts`

`getProviderCapabilities('core.pexip')` now returns `this.getPexipHandler().capabilities` instead
of a hardcoded object. Plus a comment explaining that the internal pexip provider lives outside the
`providers` map.

### 5.9 Logging / error-wrapping noise — **safe to skip**

The bulk of the service diff wraps ~25 methods in `try/catch` + `logger.error({ msg: 'Error on VideoConf.X', err })`
(or `wrapExceptions(...).catch(...)`) and adds `logger.debug` entry lines. Methods touched:
`create`, `start`, `join`, `getInfo`, `cancel`, `get`, `getUnfiltered`, `list`, `setProviderData`,
`setEndedBy`, `setEndedAt`, `setStatus`, `addUser`, `listProviders`, `listProviderCapabilities`,
`listCapabilities`, `diagnoseProvider`, `validateAction`, `notifyUser`, `notifyVideoConfUpdate`,
`endCall`, `expireCall`, `endDirectCall`, `getTypeForNewVideoConference`, `createMessage`,
`startDirect`, `startGroup`, `joinCall`, `generateNewUrl`, `getUrl`, `runNewVideoConferenceEvent`,
`runOnUserJoinEvent`, `addUserToCall`, `updateDirectCall`, `maybeCreateDiscussion`,
`getRoomForDiscussion`, `createDiscussionForConference`, `assignDiscussionToConference`,
`addUserToDiscussion`. **No behaviour changes there** — port only if you want the observability.

---

## 6. `packages/pexip`

### 6.1 New `src/endpoints/endpoint.ts` — `PexipEndpoint` base class

Extracted so both endpoints share alias resolution:
- `getIdentificationFromAlias(alias)` — strips `sip:` prefix and `@domain` suffix (moved out of
  `serviceConfiguration.ts`).
- `normalizeSipExtension(identification)` — strips a leading `+`.
- `getCallByIdentification(identification)` — if the string is **all digits**, try
  `findOneByProviderNameAndSipAlias('core.pexip', identification)` first; otherwise (or on miss)
  fall back to `findOneById`.

`ServerConfigurationEndpoint` and `EventSinkEndpoint` both now `extends PexipEndpoint`.

### 6.2 `src/endpoints/serviceConfiguration.ts`

- Reads `protocol` off the request, logs `Processing Pexip Policy Server Request`.
- Resolves the call through `getCallByIdentification` (so a **SIP alias** resolves, not just a
  conference `_id`).

### 6.3 `src/endpoints/eventSink.ts`

`post()` becomes a switch:
- `conference_ended` → `processConferenceEnded(data)` (existing behaviour, comment notes a
  `// TODO: end call by sip alias`)
- `participant_connected` → `processParticipantConnected(data)` — **new**:
  - ignores events without `destination_alias` or with `call_direction !== 'in'`
  - resolves the identification from the destination alias
  - fire-and-forget `confirmParticipantConnected(identification, protocol, participantUri)`:
    - `WebRTC` → `VideoConferenceModel.increaseWebRTCParticipantCount(identification)`
    - `SIP` → `VideoConferenceModel.increaseSipParticipantCount(identification)`
    - logs an error if no conference matched

Requires `ConferenceEndedEventData` and `ParticipantStatusEventData` to be exported from
`../definition` (with at least `destination_alias`, `source_alias`, `protocol`, `call_direction`).

### 6.4 `src/videoConfProvider.ts` — significant simplification

- **Removed** the whole `getDiscussionUrl` / `getDiscussionRoute` / `joinUrlParams` /
  `joinUrlAndParams` / `getBaseURLWithoutTrailingSlash` machinery. `generateUrl` now just returns
  `` `${baseUrl}${relativeUrl}` `` with `{callId}` substituted — the `rid` query param is gone
  (the chat is now hosted by the RC page, not passed to Pexip).
- `customizeUrl(call, user, options?)` rewritten to use `URL`/`searchParams` instead of string
  concatenation, and now honours join options:
  - `name` ← `user.name`
  - `muteMicrophone=true` when `options.mic === false`
  - `muteCamera=true` when `options.cam === false`
  - `pin` ← `getPinForUser(...)`
  - signature narrows to `RequiredField<VideoConference, 'url'>`
- `getVideoConferenceInfo` now prints the **in-product** address
  `` `${siteUrl.replace(/\/+$/, '')}/conference/${call._id}` `` instead of the raw Pexip URL.
- New `onUserJoin(call, user?)` (debug-log only, but required by `runOnUserJoinEvent`).
- `packages/pexip/package.json` adds `@rocket.chat/core-typings: workspace:^` (+ `yarn.lock`).

---

## 7. Client — routing & the conference page

### 7.1 `client/startup/routes.tsx`

```tsx
element: appLayout.wrap(<ConferenceRoute />, { embedded: true })
```

### 7.2 `client/lib/appLayout.tsx`

`wrap(element, { embedded = false })` — when `embedded`, skip `<CloudAnnouncementsRegion />` and
`<BannerRegion />` so app-level banners (E2E password prompt, admin announcements) don't bleed
into the conference page.

### 7.3 `ConferenceRoute.tsx` (rewritten)

Reads `id` route param plus `callUrl` / `scheduled` query params:
- `callUrl` present → `<AuthenticationCheck><ConferenceRedirectPage callUrl={…} /></AuthenticationCheck>`
- `id` + `scheduled` → `<AuthenticationCheck guest={false}><ConferenceScheduledPage sipAlias={id} /></…>`
- `id` → `<AuthenticationCheck guest={false}><ConferenceEmbeddedPage callId={id} /></…>`
- else → `<ConferencePageError />`

> Note the old `ConferencePage.tsx` is **deleted** and its behaviour moves to
> `ConferenceRedirectPage`. Guest access is dropped (`guest={false}`).

### 7.4 `ConferenceRedirectPage.tsx` (new)

The old `ConferencePage` logic: appends the user's display name to `callUrl` (via
`useConferenceCallUrl`), `handleOpenCall(callUrl)`, then `defaultRoute.push()`.

### 7.5 `ConferenceScheduledPage.tsx` (new)

Wraps `useConferenceScheduled(sipAlias)`; renders `<ConferenceEmbeddedPage callId>` on success,
`<ConferencePageError />` on error, `<PageLoading />` while pending.

### 7.6 `ConferenceEmbeddedPage.tsx` (new) — the core page

- `useConferenceEmbedded(callId)` → `{ room, conference }`
- `useConfinedNavigation()` — pin the window to the call
- `useUserSubscription(room.rid)` → `hasUnread = subscription.unread > 0`
- `useBreakpoints()` → `overlayPanel = !breakpoints.includes('md')` (panel overlays on narrow)
- `activePanel` state, default `'chat'`; `togglePanel` toggles off when re-clicked
- `usePexipPlugin({ conferenceUrl, hasUnread, chatVisible, onToggleChat, onDisconnected })`
- Render order / guards:
  - `room.error` → `<ConferenceUnauthorizedPage />` (whole page, not a broken split)
  - `conference.loading` → `<PageLoading />`
  - `conference.error || !conference.url` → `<ConferencePageError />`
  - else: `<SideRail>` (rail button only when `!pluginConnected`, since the Pexip plugin renders
    its own chat toggle once connected) + `<SideRailPanel>` with `<ConferenceChat>`, next to a
    flex-grow `<ConferenceIframe>`
- `handleDisconnected` → opens `<ConferenceDisconnectedModal>`; its close path prefers
  `window.videoCallWindow.close()` (desktop: the conference is a main-process Electron window the
  renderer can't close) and falls back to `window.close()`.

### 7.7 `ConferenceIframe.tsx` (new)

Full-size iframe, `title='external-frame'`,
`allow='camera; microphone; display-capture; fullscreen; autoplay; speaker-selection; clipboard-write; clipboard-read; compute-pressure'`,
`allowFullScreen`, `referrerPolicy='strict-origin-when-cross-origin'`.

### 7.8 `ConferenceDisconnectedModal.tsx` (new)

10-second countdown after disconnect; "Keep open" cancels, "Close" (danger) closes immediately,
auto-closes at zero. Uses `Conference_will_close_in_seconds` with a `count` interpolation.

### 7.9 `ConferenceUnauthorizedPage.tsx` (rewritten/new)

States page. Deliberately uses the **raw `UserContext.logout`** rather than `useLogout` so the URL
stays on `/conference/:id` and re-login lands back on the conference. Falls back to a
"Back to login" action when not logged in.

### 7.10 `ConferencePageError.tsx`

`PageContent` centred; actions always rendered, with a `Close` action (`window.close()`) plus the
existing "Back to login" when logged out.

### 7.11 `components/SideRail/` (new)

- `SideRail` — flex row wrapper, `position='relative'`
- `SideRailActions` — 44px vertical `ButtonGroup` column, `surface-sidebar`, right border
- `SideRailAction` — small `IconButton` with `pressed` + `aria-label`
- `SideRailPanel` — 400px panel, width/min-width animate to 0 when hidden
  (`transition: width 200ms ease, min-width 200ms ease`), `position: absolute; z-index: 1` in
  overlay mode; inner box keeps `minWidth: 400` so content doesn't reflow while collapsing
- `index.ts` barrels + `components/index.ts`
- `SideRail.stories.tsx`, `SideRail.spec.tsx` (storyshots + `jest-axe` a11y), and the
  committed `__snapshots__/SideRail.spec.tsx.snap`

---

## 8. Client — hooks

### 8.1 `hooks/useConferenceCallUrl.ts` (new)

Returns a function that appends `?name=<display name>` to a call URL via `URL.searchParams`.

### 8.2 `hooks/useConferenceEmbedded.tsx` (new)

- Query `['conference-info', callId]` → `GET /v1/video-conference.info`, `retry: false`
- Query `['conference-embedded', callId]` → `POST /v1/video-conference.join` with
  `{ state: { mic: true, cam: false } }`
- Subscribes to `useStream('video-conference')` on `` `${callId}/discussionUpdated` `` and
  invalidates `['conference-info', callId]` so every participant's chat follows a re-pointed
  discussion.
- Returns `{ room: { rid: info?.discussionRid || info?.rid, loading, error }, conference: { url: getConferenceCallUrl(data.url), providerName, loading, error } }`

### 8.3 `hooks/useConferenceScheduled.tsx` (new)

Query `['conference-scheduled', sipAlias]` → `POST /v1/video-conference.join-scheduled`;
returns `{ loading, error, callId }`.

### 8.4 `hooks/useConfinedNavigation.ts` (new) — **with a 309-line spec file**

Keeps the conference window on the call. Two mechanisms:

**(a) Capture-phase `click` listener on `document`.** Bails out for: `defaultPrevented`,
non-primary button, any modifier key, no `a[href]` ancestor, a `target` that already opens
elsewhere, `download` links, non-http(s) protocols, and **same-path** URLs (so `?jump=<msgId>` and
`#hash` still work in place). Otherwise `preventDefault` + `stopPropagation` and:
- same origin → `openInOpenerOrTab(href)`
- cross origin → `window.open(href, '_blank', 'noopener')`

**(b) Monkey-patch of `router.navigate`** to catch programmatic navigation (mentions, room links).
Marked with a `_confined` flag so re-patching is a no-op, and cleanup only restores when the
wrapper is still the live one. Numeric deltas and same-path targets pass through untouched.

**`openInOpenerOrTab(href)`** resolution order:
1. Desktop: `window.videoCallWindow?.openInMainWindow(route)` (routes **and** focuses the main window)
2. Browser: `opener.postMessage({ type: NAVIGATE_TO_ROUTE_MESSAGE, path: route }, origin)`, then
   name the opener `rocketchat-main` (if unnamed) and `window.open('', opener.name)` to focus its
   tab without navigating — `opener.focus()` alone can't switch tabs
3. Fallback: `window.open(href, '_blank', 'noopener')`

### 8.5 `hooks/usePexipPlugin.ts` (new) — Pexip "external-chat" plugin bridge

Message namespace: `pexip:plugin:external-chat`. The plugin runs in a **sandboxed sub-frame** of
the Pexip iframe (opaque origin), so the listener accepts `event.origin === conferenceOrigin`
**or** `'null'`, and replies via the captured `event.source`.

Inbound actions:
- `ready` → push current `toggle-chat-button-state` + `toggle-chat-badge` state
- `connected` → `setConnected(true)` (host drops its own rail chat button)
- `disconnected` → `setConnected(false)`; fires `onDisconnected()` only if a `connected` was seen
- `toggle-chat` → `handleChatToggle(data.active === true)`
- `dial-out-success` → success toast `Calling__roomName__`
- `dial-out-error` → error toast

Outbound: `toggle-chat-button-state`, `toggle-chat-badge`, `dial-out`
(`{ role: 'GUEST', destination, protocol: 'auto', call_type: 'audio' }`).

Uses refs for `chatVisible` / `hasUnread` / `onDisconnected` so the listener isn't re-bound, plus
an effect syncing the unread badge. Returns `{ closeChat, dialOut, connected }`.

---

## 9. Client — the embedded chat room

### 9.1 `ConferenceChat.tsx` (new)

Header (`Chat` title, optional close `IconButton`, `Add_people` button opening
`<AddParticipantsModal>`) over `<ConferenceRoom rid>`, all inside `<ConferenceRoomPreload rid>`.
Renders `<PageLoading />` while loading and `<NotFoundPage />` without an `rid`.

### 9.2 `ConferenceRoomPreload.tsx` (new)

Bootstraps the minimal room state the standalone page needs (there's no sidebar/subscription
preload here):
- `GET /v1/rooms.info` → `mapRoomFromApi`, strip keys not in `roomFields`, `Rooms.state.store(roomData)`
- `GET /v1/subscriptions.getOne` → `SubscriptionsCachedStore.upsertSubscription(mapSubscriptionFromApi(...))`
- On settle, force `SubscriptionsCachedStore.setReady(true)` and `RoomsCachedStore.setReady(true)`
- Gates on `useMainReady()`; `<NotFoundPage />` on error, `<PageLoading />` while pending

### 9.3 `ConferenceRoom.tsx` (new)

- `useOpenRoomById(rid)`
- Provides `LayoutContext` with `isEmbedded: true` (memoised spread of the real layout context)
- Subscribes to `` `${uid}/subscriptions-changed` `` on `notify-user` and upserts into
  `SubscriptionsCachedStore` (ignoring `removed` and other rooms)
- Lazy `RoomProvider` / `Room` / `RoomNotFound` / `NotAuthorizedPage`, `RoomSkeleton` fallback;
  `NotAuthorizedError` → `NotAuthorizedPage`, other errors → `RoomNotFound`

### 9.4 `client/views/room/hooks/useOpenRoomById.tsx` (new)

Room-by-id counterpart to the existing name-based open hook. Notable details:
- `tryCacheShortcut()` used as `placeholderData` **and** first thing in `queryFn`; it refuses to
  shortcut when a subscription exists but is closed (`sub.open === false`), because `openRoom`
  must still run.
- Fetches `rooms.info`, strips non-`roomFields` keys, `Rooms.state.store`.
- **Subscription fallback**: `Subscriptions.state` can be empty when there's no pre-populating
  parent (i.e. under `ConferenceRoomPreload`), so it fetches `subscriptions.getOne` before
  deciding; a miss falls through to `NotSubscribedToRoomError` for public rooms without
  `preview-c-room`.
- `LegacyRoomManager.open({ typeName: room.t + openIdentifier, rid })` where
  `openIdentifier = room.t === 'd' ? rid : room.name` — **DMs must be opened by rid**, channels by
  name, or the composer hangs waiting on `streamActive`.
- `retry: 0`; throws `RoomNotFoundError` / `NotSubscribedToRoomError`.

### 9.5 `client/lib/utils/mapRoomFromApi.ts` (new)

Deserializes `Serialized<IRoom>` → `IRoom`: `_updatedAt`, `lm`, `ts`, `webRtcCallStartTime` to
`Date`, `lastMessage` via `mapMessageFromApi`, `usersWaitingForE2EKeys[].ts` to `Date`.

### 9.6 `RoomComposer.tsx`

Embedded composer styling: `padding: 0` → `padding: 4px`, and instead of hiding `.users-typing` /
`.formatting-tips` individually it hides `.rc-message-box__activity-wrapper` with `!important`.

### 9.7 Layout restructuring

- `MainLayout.tsx` wraps **both** the embedded and normal branches in `<LayoutWithSidebar>`.
- `TwoFactorAuthSetupCheck.tsx` stops wrapping in `<LayoutWithSidebar>` and just returns
  `children` (the wrapper moved up to `MainLayout`).

---

## 10. Client — add participants

`client/views/conference/AddParticipantsModal.tsx` (new, 286 lines)

- Props: `{ callId, rid, onClose, onDialOut? }`
- Reads the room from the `Rooms` store (already preloaded by `ConferenceRoomPreload`);
  `isPrivate = t === 'p'`, `isDirect = t === 'd'`
- `AutoComplete` over `GET /v1/users.autocomplete` with a **300ms debounce** and an `exceptions`
  list = existing members + already-selected, so current members can't be re-picked.
  Members come from `room.usernames` for DMs, else `GET /v1/groups.members` or
  `/v1/channels.members` (`count: 100`).
- **Phone-number affordance** (mirrors the VoIP widget's `PeerAutocomplete`): the typed text is
  prepended as a synthetic option keyed `rcx-first-option-<text>` rendered with a `phone-out` icon.
- Selected participants render as a removable list (avatar + `StatusBullet` for users, phone icon
  for numbers).
- `Keep_chat_history` checkbox (hidden for DMs, which always fork a discussion) chooses the mode.
- On submit:
  - each selected number → `onDialOut(number)` (Pexip plugin dial-out)
  - users → `POST /v1/video-conference.add-participants` with `keepHistory: mode === 'invite'`
  - in `discussion` mode, invalidate `['conference-info', callId]` so the chat panel switches
  - success toast `Users_added`, then `onClose()`

---

## 11. Client — call history contextual bar

### 11.1 `hooks/roomActions/useCallsRoomAction.ts`

`icon: 'phone' → 'history'`, `title: 'Calls' → 'Conference_call_history'`, `order: 999 → 8`.

### 11.2 `VideoConfList.tsx`

- `Virtuoso` → `GroupedVirtuoso`, split into **Ongoing calls** (`!endedAt`) and **Past calls**
  (`endedAt`) groups, each rendered with a `<VideoConfSectionDivider title count />`; empty groups
  are omitted.
- Pagination moves to a `Footer` component wrapping `<InfiniteListAnchor loadMore={loadMoreItems} />`
  (instead of `endReached`).
- Header icon/title match §11.1.
- Error/empty-state guard fixed: the block now renders on `total === 0 && error`, and the empty
  state requires `!error`.

### 11.3 `VideoConfListItem.tsx`

- Takes `VideoConferenceWithDiscussion`.
- **Drops the avatar/`MessageLeftContainer`** and the creator's display name; the title is now the
  **discussion title**, falling back to a name computed from
  `VideoConf_Persistent_Chat_Discussion_Name` (default `__param__Video_Call_Chat` with
  `param: '[date]'`) and `createdAt`, using the same `[date]` substitution rule as the server.
- `MessageBody` shows `discussionLastMessage?.msg`.
- Buttons: ongoing → primary `Join_call` with a `video` icon (+ the existing discussion
  `IconButton` when `discussionRid`); ended → `Call_chat` with a `discussion` icon, disabled
  without a `discussionRid`, navigating via `goToRoom(discussionRid)`.
- The overflow indicator becomes a bare `+N` instead of `__usersCount__joined` / `joined`.

### 11.4 New `VideoConfSectionDivider.tsx`

36px `backgroundColor='room'` header row, title left / count right, bottom border.

### 11.5 New `VideoConfList.stories.tsx` + `mocks.ts`

Storybook coverage for the grouped list.

---

## 12. Client — misc integrations

### 12.1 `OngoingConferenceBanner.tsx` (new) + `RoomBody.tsx`

Rendered in `RoomBody` as `{!isLayoutEmbedded && isDiscussion(room) && <OngoingConferenceBanner />}`
(just after the announcement). Uses `useVideoConfList({ roomId: room._id })` and finds a conference
where `discussionRid === room._id && status === STARTED && !endedAt`, rendering an
`<AnnouncementBanner>` with `Join_ongoing_call` that calls `useVideoConfJoinCall()`.

> Discussions created by add-participants don't carry the call's message block, hence the banner.
> It relies on the §1.3 `$or` match so it works for users with no access to the parent room.

### 12.2 `useVideoConfOpenCall.tsx` — single shared conference tab

- Module-level `conferenceWindow` reference + shared window name `rocketchat-conference`.
- For **same-origin** URLs: if the tracked window is alive and its `location.pathname` already
  matches the target, focus it with `window.open('', CONFERENCE_WINDOW_NAME)` — **no reload**.
  Otherwise `window.open(callUrl, CONFERENCE_WINDOW_NAME)` (opens or navigates the shared tab).
- External provider URLs keep opening in their own plain tab.
- Deliberately compares the live `pathname` rather than the URL string, because start vs. join
  paths produce different strings for the same conference.

### 12.3 `VideoConfProvider.tsx`

On `VideoConfManager` `call/join`, when `providerName === 'core.pexip'`, open the **in-product**
page instead of the provider URL:
```ts
handleOpenCall(absoluteUrl(router.buildRoutePath({ name: 'conference', params: { id: callId } })), providerName)
```

### 12.4 `MediaCallProvider.tsx`

`useCurrentRoutePath()`; the media-call (VoIP) provider is disabled when the path includes
`/conference`, so the conference window doesn't also run the voice stack.

### 12.5 `useMessageBlockContextValue.ts` + `UiKitContext` + `VideoConferenceBlock`

- `UiKitContextValue` gains `videoConfJoinDisabled?: boolean`.
- The hook computes `videoConfJoinDisabled = routeName === 'conference'` (via
  `useSyncExternalStore(router.subscribeToRouteChange, router.getRouteName)`) and both puts it in
  the context **and** short-circuits the `join` / `callBack` actions.
- `VideoConferenceBlock` reads it and passes `disabled` to the Join and Call-again/Call-back
  buttons; the "Join discussion" action becomes `primary`.

### 12.6 `useNotification.ts`

- `requireInteraction` becomes `notification.requireInteraction || userPreference`.
- Forwards `notification.actions` into `NotificationOptions` **only in the desktop app**
  (`window.RocketChatDesktop && notification.actions?.length`).
- When `payload.conferenceId` is set, adds an `action` listener that closes the notification,
  focuses the window and calls `useVideoConfJoinCall()(conferenceId)`.

### 12.7 `useExternalRouteNavigation.ts` (new) + `AppLayout.tsx`

Exports `NAVIGATE_TO_ROUTE_MESSAGE = 'rocketchat:navigate-to-route'`. Registers:
- `window.RocketChatDesktop?.onNavigateToRoute?.(path => router.navigate(path))`
- a same-origin-only `message` listener handling `{ type: NAVIGATE_TO_ROUTE_MESSAGE, path }`

Hooked into `AppLayout` next to the other desktop hooks. This is the receiving half of §8.4.

### 12.8 `client/definitions/global.d.ts`

```ts
videoCallWindow?: {
    openInMainWindow?: (path: string) => void;
    close?: () => void;
};
```
(injected into the desktop app's internal video-chat window; distinct from `RocketChatDesktop`,
which only exists in the main app webview).

### 12.9 `packages/desktop-api/src/index.ts`

`IRocketChatDesktop` gains optional
`onNavigateToRoute?: (cb: (path: string) => void) => void`.

### 12.10 `packages/ui-client/src/providers/TooltipProvider.tsx`

Close the tooltip when the anchor is an `IFRAME` (`!anchor || anchor.tagName === 'IFRAME'`) —
otherwise a stale tooltip sticks over the conference iframe.

---

## 13. i18n — `packages/i18n/src/locales/en.i18n.json` (+ matching `de`)

```
__param__Video_Call_Chat                             {{param}} Video Call Chat
Add_participants                                     Add participants
Call_chat                                            Call chat
Chat                                                 Chat
Conference_call_history                              Conference call history
Conference_started_by__name__                        Conference started by {{name}}
Conference_will_close_in_seconds                     This conference will close in {{count}} seconds.
Create_discussion                                    Create discussion
Join_ongoing_call                                    Join ongoing call
Keep_chat_history                                    Keep chat history
Keep_open                                            Keep open
Ongoing_calls                                        Ongoing calls
Past_calls                                           Past calls
Pexip_Integration_PersistentChat                     Persistent Chat
Pexip_Integration_PersistentChat_ExternalRoom        Parent Room for External Conferences
Pexip_Integration_PersistentChat_ExternalRoom_Description
                                                     Define a room to use as parent when a conference is created automatically.
Pexip_Integration_SIP                                SIP
Pexip_Integration_SIP_AddAlias                       Add Numeric Alias to Conferences
Pexip_Integration_SIP_AddAlias_Description           Creates an alias for every new conference, using only numeric digits
Pexip_Integration_SIP_Host                           SIP Host
Pexip_Integration_SIP_Host_Description               The host that should be used when transferring users to a conference through SIP.
Pexip_Integration_SIP_Port                           SIP Port
Pexip_Integration_SIP_Port_Description               The port that should be used when transferring users to a conference through SIP.
Unable_to_start_video_call                           Unable to start video call.
You_have_been_disconnected                           You have been disconnected
You_were_invited_to_a_conference                     You were invited to a conference
```

Reused existing keys worth checking: `Calling__roomName__`, `Enter_username_or_number`,
`Users_added`, `Add_people`, `Join_call`, `Join_discussion`, `No_history`,
`You_are_not_authorized_to_view_this_page`, `You_are_logged_in_as`.

Note `Conference_started_by__name__`, `Create_discussion` and `Unable_to_start_video_call` are
added but appear unused in this commit's diff — likely leftovers.

---

## 14. Tests / stories added

- `client/views/conference/hooks/useConfinedNavigation.spec.ts` (309 lines)
- `client/views/conference/components/SideRail/SideRail.spec.tsx` + `.stories.tsx` +
  committed snapshot
- `client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfList.stories.tsx` +
  `mocks.ts`

---

## 15. State of the new base (`feat/pexip-integration`) — overlaps & divergences

**Already present on the new base** (the merged Persistent Chat), so expect real overlap rather
than a clean port:

- `client/views/conference/`: `ConferenceChat.tsx` (+ spec/snapshot), `ConferenceRoomPanel.tsx`,
  `ConferenceStartPage.tsx`, `ConferenceThreadChat.tsx`, `ConferenceThreadOverRoom.tsx`,
  `ConferenceUnauthorizedPage.tsx`, `components/ConferenceRoomError|ConferenceRoomSkeleton|ConferenceUserPicker`,
  and hooks `useConferenceEmbedded`, **`useConfinedNavigation` (+ its own spec)**,
  `useConferencePresenceLease`, `useConferenceSubscription`, `useJoinOrSwitchCallModal`,
  `useJoinableCalls`, `useLeaveConferenceOnClose`, `useRoomSubscriptionQuery`,
  `useStartConference`, `useVideoConferenceInfo`, `lib/callWindow.ts`,
  `providers/ConferenceProvider.tsx`, `providers/OngoingCallsProvider.tsx`
- `client/views/room/hooks/useOpenRoomById.tsx` and `client/lib/utils/mapRoomFromApi.ts`
- `packages/rest-typings/src/v1/videoConference/VideoConfAddParticipantsProps.ts` (plus new
  `VideoConfCallIdProps`, `VideoConfRenameProps`, `VideoConfRingProps`, `VideoConfShareChatProps`)
- `useNotification.ts` already imports `useVideoConfJoinCall`
- `videoConfProviders.getPexipHandler()` exists

**Genuinely absent from the new base** (28 files — the real net-new surface):

```
client/views/conference/AddParticipantsModal.tsx
client/views/conference/ConferenceDisconnectedModal.tsx
client/views/conference/ConferenceEmbeddedPage.tsx
client/views/conference/ConferenceIframe.tsx
client/views/conference/ConferenceRedirectPage.tsx
client/views/conference/ConferenceRoom.tsx
client/views/conference/ConferenceRoomPreload.tsx
client/views/conference/ConferenceScheduledPage.tsx
client/views/conference/components/{index.ts,SideRail/*}
client/views/conference/hooks/useConferenceCallUrl.ts
client/views/conference/hooks/useConferenceScheduled.tsx
client/views/conference/hooks/usePexipPlugin.ts
client/views/room/OngoingConferenceBanner/OngoingConferenceBanner.tsx
client/views/room/contextualBar/VideoConference/VideoConfList/{VideoConfSectionDivider.tsx,VideoConfList.stories.tsx,mocks.ts}
client/views/root/hooks/useExternalRouteNavigation.ts
packages/pexip/src/endpoints/endpoint.ts
packages/rest-typings/src/v1/videoConference/VideoConfJoinScheduledProps.ts
```

**Known API divergence to reconcile:** `useVideoConfList` on the new base is an
`useInfiniteQuery` returning pages of `{ items, itemCount }` (mapped through
`mapVideoConfFromApi`), not the `{ videoConfs, total }` shape this commit's
`OngoingConferenceBanner` and `VideoConfList` assume. Both consumers need rewriting against the
new hook.

**Decisions to make before porting:**
1. Keep or drop `SKIP_DISCUSSIONS_ON_CHANNEL_CONFERENCES` (§5.6) — it disables automatic
   discussion creation entirely.
2. `ConferenceRoute` drops guest access (`guest={false}`); confirm that's still wanted given the
   new base's `ConferenceStartPage` flow.
3. Whether to port the §5.9 logging/error-wrapping at all.
4. `useConfinedNavigation` exists on both sides with different implementations — diff them rather
   than replacing.
