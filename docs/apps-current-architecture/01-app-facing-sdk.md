# Apps v1 — The App-Facing SDK (`@rocket.chat/apps-engine`)

> Snapshot of the **current** implementation, written to ground the v2 design discussion in
> `docs/apps-v2-sdk-design.md`. This document describes *what exists today*, not what we want.
>
> All paths below are under `packages/apps-engine/src/definition/`.

## 0. What `apps-engine` actually is

A crucial structural fact: **`@rocket.chat/apps-engine` ships only `src/definition/`** — pure
TypeScript type definitions and a handful of small value classes/enums. See
`packages/apps-engine/package.json` (`"files": ["definition/**"]`).

It is **the public contract** an app author compiles against: the `App` base class, the accessor
interfaces (`IRead`/`IModify`/…), the event handler interfaces, the contribution interfaces
(slashcommands/api/settings/…), the manifest types, and the exceptions.

The *runtime* that implements all of these interfaces lives in a different package,
`@rocket.chat/apps` (documented in `02-engine-architecture-and-state.md` and
`03-runtime-and-bridges.md`). Apps never import from `@rocket.chat/apps`.

This split is itself relevant to the v2 discussion: the "SDK" the design doc wants to rewrite is
really *two* artifacts — the type surface (`apps-engine`) and the engine (`apps`).

---

## 1. The App authoring shape

### 1.1 The `App` abstract class — `App.ts:22`

Every app **must** export a class extending `App`. The constructor receives the framework's plumbing;
the app forwards it to `super`:

```typescript
constructor(
  private readonly info: IAppInfo,
  private readonly logger: ILogger,
  private readonly accessors?: IAppAccessors,
)
```

Responsibilities baked into the base class:

- **Metadata getters** (`getID`, `getName`, `getNameSlug`, `getVersion`, `getInfo`,
  `getRequiredApiVersion`, `getAuthorInfo`) — `App.ts:54-132`.
- **Status** — `getStatus()` (`App.ts:45`) and protected `setStatus()` (`App.ts:252`).
- **Framework handles** — `getLogger()`, `getAccessors()` (`App.ts:139-149`).
- **Lifecycle hooks** apps override (all optional, default to no-op / `true`):
  - `initialize(configurationExtend, environmentRead)` — `App.ts:155`; set up settings, commands,
    api, scheduler. Throwing aborts load.
  - `onEnable(): Promise<boolean>` — `App.ts:168`; returning `false` keeps the app disabled.
  - `onDisable()` — `App.ts:176`.
  - `onInstall(context: IAppInstallationContext, …)` — `App.ts:197`; runs exactly once.
  - `onUninstall(...)` — `App.ts:184`.
  - `onUpdate(context: IAppUpdateContext, …)` — `App.ts:210`.
  - `onSettingUpdated(...)` / `onPreSettingUpdate(...)` — `App.ts:221-239`.
  - `extendConfiguration(...)` — historic configuration hook.

The interface counterpart is `IApp.ts:7`.

> **v2 friction (from the design doc):** "apps must implement a class." This is where that starts —
> there is no functional/registration entry point; the class *is* the app.

### 1.2 `AppStatus` — `AppStatus.ts:1`

The full lifecycle state enum. This is the v1 status model the v2 reconciler discussion replaces:

| Value | Meaning |
|---|---|
| `UNKNOWN` | not constructed properly |
| `CONSTRUCTED` | constructor done |
| `INITIALIZED` | `initialize()` returned |
| `AUTO_ENABLED` | enabled automatically on startup |
| `MANUALLY_ENABLED` | enabled by a user action |
| `COMPILER_ERROR_DISABLED` | failed to compile |
| `INVALID_LICENSE_DISABLED` | license invalid |
| `INVALID_INSTALLATION_DISABLED` | signature/installation invalid |
| `INVALID_SETTINGS_DISABLED` | required settings missing |
| `ERROR_DISABLED` | unrecoverable runtime error |
| `MANUALLY_DISABLED` | disabled by a user |
| `DISABLED` | disabled, other circumstances |

Helper predicates `AppStatusUtils.isEnabled/isDisabled/isError` (`AppStatus.ts:34-65`). Note there is
**no single `enabled`/`disabled` pair** — "enabled" is two values, "disabled" is seven. The v2 doc's
"two desired states + reconciler" is a direct reaction to this sprawl, which conflates *desired
state*, *error cause*, and *transition origin* into one enum.

---

## 2. The accessor SDK — how apps read and write

Handlers never touch the database. They receive **accessor objects** as arguments and go through them.
There are two top-level read/write hubs plus configuration/HTTP/persistence accessors.

### 2.1 The root: `IAppAccessors` — `accessors/IAppAccessors.ts:5`

```typescript
export interface IAppAccessors {
  readonly environmentReader: IEnvironmentRead;
  readonly environmentWriter: IEnvironmentWrite;
  readonly reader: IRead;
  readonly http: IHttp;
  readonly providedApiEndpoints: Array<IApiEndpointMetadata>;
}
```

### 2.2 Reads: `IRead` + per-entity readers — `accessors/IRead.ts:22`

`IRead` is a **factory of readers**; each reader exposes mostly `getById`-style methods:

```typescript
interface IRead {
  getMessageReader(): IMessageRead;
  getRoomReader(): IRoomRead;
  getUserReader(): IUserRead;
  getThreadReader(): IThreadRead;
  getUploadReader(): IUploadRead;
  getRoleReader(): IRoleRead;
  getPersistenceReader(): IPersistenceRead;
  getNotifier(): INotifier;
  getLivechatReader(): ILivechatRead;
  getCloudWorkspaceReader(): ICloudWorkspaceRead;
  getVideoConferenceReader(): IVideoConferenceRead;
  getOAuthAppsReader(): IOAuthAppsReader;
  getContactReader(): IContactRead;
  getExperimentalReader(): IExperimentalRead;
  // …
}
```

The canonical access shape is therefore **`read.get<Entity>Reader().getById(id)`** — the exact
"bureaucratic" pattern called out in the design doc. Example reader surfaces:

- `IMessageRead` (`IMessageRead.ts:9`): `getById`, `getSenderUser`, `getRoom`.
- `IRoomRead` (`IRoomRead.ts:10`): `getById`, `getByName`, `getMembers`, `getMessages`,
  `getModerators`/`getOwners`/`getLeaders`, `getAllRooms(filters, options)`, …
- `IUserRead` (`IUserRead.ts:7`): `getById`, `getByUsername`, `getAppUser`, `getUserRoomIds`, …

There is **no general query/paging primitive** on most readers — `getById` dominates. `IRoomRead`
has bespoke list methods (`getAllRooms`, `getMessages`) but no uniform cursor. (This is the gap the
v2 "Repository pattern with paging" is meant to close.)

### 2.3 Writes: `IModify` + creators/updaters/extenders/deleters — `accessors/IModify.ts:11`

```typescript
interface IModify {
  getCreator(): IModifyCreator;
  getUpdater(): IModifyUpdater;
  getExtender(): IModifyExtender;
  getDeleter(): IModifyDeleter;
  getNotifier(): INotifier;
  getUiController(): IUIController;
  getScheduler(): ISchedulerModify;
  getOAuthAppsModifier(): IOAuthAppsModify;
  getModerationModifier(): IModerationModify;
}
```

The dominant write idiom is the **builder + `finish`** dance:

```typescript
// create
const builder = modify.getCreator().startMessage()   // → IMessageBuilder
  .setRoom(room).setText('hi').setSender(user);
await modify.getCreator().finish(builder);            // → persisted id

// update (note: returns a builder via a Promise, seeded from the live entity)
const b = await modify.getUpdater().message(msgId, editor);
b.setText('edited');
await modify.getUpdater().finish(b);
```

- `IModifyCreator` (`IModifyCreator.ts:18`): `startMessage`/`startRoom`/`startDiscussion`/
  `startLivechatMessage`/`startVideoConference`/`startBotUser` → builders, then one overloaded
  `finish(builder)`. Plus sub-creators: `getLivechatCreator`, `getUploadCreator`, `getEmailCreator`,
  `getContactCreator`.
- `IModifyUpdater` (`IModifyUpdater.ts:8`): `message(id, updater)`, `room(id, updater)` → builder;
  `finish(builder)`. Sub-updaters `getUserUpdater`, `getMessageUpdater`, `getLivechatUpdater`.
- `IModifyExtender` (`IModifyExtender.ts:6`): **non-destructive** add-only — `extendMessage`/
  `extendRoom`/`extendVideoConference` → extender; `finish(extender)`.
- `IModifyDeleter` (`IModifyDeleter.ts:4`): `deleteRoom`, `deleteMessage`, `removeUsersFromRoom`,
  `deleteUsers`.

The builders are large fluent surfaces — `IMessageBuilder` (`IMessageBuilder.ts:14`) has ~40
get/set/add methods; `IRoomBuilder` (`IRoomBuilder.ts:10`) similar. Each entity has **three** write
shapes (builder for create, builder for update, extender for add-only), all distinct from the read
shape and from core's shape.

> **v2 friction:** this is the "writes go through `modify.getCreator().start[Entity]()` → builder →
> `finish(builder)`" the design doc wants to collapse into a single batched `update`-style call.

### 2.4 Fine-grained domain operations

Sensitive/semantic mutations are **not** done through generic builders — they're explicit methods,
foreshadowing the v2 "expose sensitive fields only as domain operations" decision:

- `IUserUpdater` (`IUserUpdater.ts:12`): `updateStatusText`, `updateStatus`, `updateBio`,
  `updateCustomFields`, `deactivate`, `setActiveState`/`endActiveState`.
- `IMessageUpdater` (`IMessageUpdater.ts:3`): `addReaction`, `removeReaction`.
- `INotifier` (`INotifier.ts:31`): `notifyUser`, `notifyRoom`, `typing(...)`.
- `IUIController` (`IUIController.ts:10`): `openSurfaceView`/`updateSurfaceView`/`setViewError`
  (+ deprecated modal/contextualbar variants).

### 2.5 Persistence — `accessors/IPersistence.ts:8` / `IPersistenceRead.ts:8`

A per-app key/value store keyed by generated id **or** by *associations* to system entities:

```typescript
interface IPersistence {
  create(data): Promise<string>;
  createWithAssociation(data, assoc): Promise<string>;
  createWithAssociations(data, assocs): Promise<string>;
  update(id, data, upsert?): Promise<string>;
  updateByAssociation(assoc, data, upsert?): Promise<string>;
  remove(id) / removeByAssociation(assoc) / removeByAssociations(assocs);
}
interface IPersistenceRead {
  read(id): Promise<object>;
  readByAssociation(assoc): Promise<Array<object>>;
}
```

Associations: `RocketChatAssociationRecord(model, id)` over
`RocketChatAssociationModel` (`ROOM | DISCUSSION | MESSAGE | LIVECHAT_MESSAGE | USER | FILE | MISC |
VIDEO_CONFERENCE`) — `metadata/RocketChatAssociations.ts:12`.

### 2.6 HTTP & environment

- `IHttp` (`IHttp.ts:8`): `get/post/put/del/patch`. Outbound calls; domains gated by the
  `networking` permission.
- `IEnvironmentRead` (`IEnvironmentRead.ts:10`): `getSettings()` (app settings), `getServerSettings()`,
  `getEnvironmentVariables()` (both restricted).

### 2.7 Entity types — bespoke, **eager-resolved**

The SDK defines its *own* entity types, distinct from core-typings, and they **eager-resolve
relationships**:

- `IMessage` (`messages/IMessage.ts:11`): `room: IRoom` and `sender: IUser` are **full objects**.
- `IRoom` (`rooms/IRoom.ts:6`): `creator: IUser`, `parentRoom?: IRoom` — full objects.
- `IUser` (`users/IUser.ts:7`).

There are also **`*Raw` variants** that *don't* eager-resolve — `IMessageRaw`
(`messages/IMessageRaw.ts:19`) carries `roomId: string` + `sender: IUserLookup` (id/username only),
and `IRoomRaw` (`rooms/IRoomRaw.ts:11`) uses `IUserLookup`. These raw types are returned by the
bulk/list readers (`getMessages`, `getAllRooms`) precisely because eager resolution is too costly
there.

> **v2 note (already captured in the design doc):** eager resolution (`IMessage.sender: IUser`) is an
> apps-engine *invention*; core's `IMessage` already carries an unresolved `u: Pick<IUser,…>`. The
> coexistence of `IMessage` vs `IMessageRaw` is direct evidence of the problem.

---

## 3. The event / listener model

### 3.1 Declaration: `implements` + `AppInterface`

An app declares which events it handles by listing `AppInterface` enum values in its manifest's
`implements` array (`metadata/AppInterface.ts:1`). The string names *are* the interface names, e.g.
`'IPreMessageSentModify'`, `'IPostMessageSent'`, `'IPostRoomCreate'`.

### 3.2 The naming scheme: timing × context × check/execute

Each event interface name encodes **two axes**, and each carries **two methods**:

- **Timing prefix:** `IPre…` (before the action, can influence it) vs `IPost…` (after, observe-only).
- **Context suffix** on `pre` events: `…Prevent` (return `boolean` to block), `…Extend`
  (receive an extender, add-only), `…Modify` (receive a builder, full rewrite).
- **`check*` + `execute*` duality:** an optional `check*` predicate gates the required `execute*`.

Example — message-sent has *three* separate pre-interfaces:

```typescript
// messages/IPreMessageSentPrevent.ts
checkPreMessageSentPrevent?(message, read, http): Promise<boolean>;
executePreMessageSentPrevent(message, read, http, persistence): Promise<boolean>; // true ⇒ block

// messages/IPreMessageSentExtend.ts
executePreMessageSentExtend(message, extend: IMessageExtender, read, http, persistence): Promise<IMessage>;

// messages/IPreMessageSentModify.ts
executePreMessageSentModify(message, builder: IMessageBuilder, read, http, persistence): Promise<IMessage>;

// messages/IPostMessageSent.ts
executePostMessageSent(message, read, http, persistence, modify): Promise<void>;
```

The dispatched method names live in `AppMethod` (`metadata/AppMethod.ts:1`), e.g.
`CHECKPREMESSAGESENTPREVENT` / `EXECUTEPREMESSAGESENTPREVENT`.

> **v2 friction (verbatim from design doc):** "events carry timing prefixes, context suffixes and two
> methods each (`check*`/`execute*`)." The v2 model replaces all of this with `app.on('message:pre',…)`
> returning a `Decision` (`continue`/`prevent`/`patch`).

### 3.3 Catalogue of events (by family)

**Messages** (`definition/messages/`): pre sent (Prevent/Extend/Modify), post sent, post system
message sent, pre delete (Prevent), post deleted, pre update (Prevent/Extend/Modify), post updated,
post reacted/followed/pinned/starred/reported, post sent-to-bot.

**Rooms** (`definition/rooms/`): pre create (Prevent/Extend/Modify), post create, pre delete
(Prevent), post deleted, pre/post user-joined, pre/post user-leave.

**Users** (`definition/users/`): post created/updated/deleted, post logged-in/logged-out,
post status-changed. (These use computed `[AppMethod.EXECUTE_POST_USER_*]` method keys.)

**Livechat** (`definition/livechat/`): post room started/closed, pre room-create (Prevent), post
agent assigned/unassigned, post room transferred, post guest/room saved, post department
disabled/removed.

**Uploads / Email** (`definition/uploads`, `definition/email`): `IPreFileUpload`,
`IPreEmailSent` (modify the descriptor or throw to block).

**External components** (`definition/externalComponent/`): post opened/closed.

**UIKit** (`definition/uikit/`): `IUIKitInteractionHandler` —
block action / view submit / view close / action button (plus a livechat variant).

### 3.4 How "prevent" is signaled today

Two different mechanisms coexist (a v2 simplification target):

1. `…Prevent` handlers return `boolean` (`true` ⇒ block).
2. Some handlers **throw** typed exceptions to block: `UserNotAllowedException` (room join),
   `FileUploadNotAllowedException` (uploads), `AppsEngineException` (livechat pre-create).

---

## 4. Contributions / extension points

Beyond event listeners, apps register capabilities during `initialize()` via the
`IConfigurationExtend` accessor (`accessors/IConfigurationExtend.ts:15`), which exposes:
`settings`, `slashCommands`, `api`, `externalComponents`, `scheduler`, `ui`, `videoConfProviders`,
`outboundCommunication`, `http`.

| Contribution | Interface | Registration | Handler entry points |
|---|---|---|---|
| Slash command | `ISlashCommand` (`slashcommands/`) | `configuration.slashCommands.provideSlashCommand()` | `executor`, optional `previewer` + `executePreviewItem` |
| HTTP endpoint | `IApi` / `IApiEndpoint` (`api/`) | `configuration.api.provideApi()` | `get/post/put/delete/head/options/patch` |
| Setting | `ISetting` (`settings/`) | `configuration.settings.provideSetting()` | n/a (data) |
| UIKit interactions | `IUIKitInteractionHandler` (`uikit/`) | via `implements` | block action / view submit / view close / action button |
| UI action button | `IUIActionButtonDescriptor` (`ui/`) | `configuration.ui.registerActionButton()` | declarative + handled through UIKit |
| Scheduler job | `IProcessor` (`scheduler/`) | `configuration.scheduler.registerProcessors()` | `processor(jobContext, …)` |
| Video conf provider | `IVideoConfProvider` (`videoConfProviders/`) | `configuration.videoConfProviders…` | `generateUrl`, `customizeUrl`, lifecycle hooks |
| Outbound comms | `IOutboundCommsProvider` (`outboundCommunication/`) | `configuration.outboundCommunication…` | `sendOutboundMessage` |
| OAuth2 client | `IOAuth2Client` (`oauth2/`) | `setup(configuration)` | authorize / token / refresh / revoke |

Notable details:
- **Slash commands** (`slashcommands/ISlashCommand.ts:8`): `command`, `i18nDescription`,
  `i18nParamsExample`, optional `permission`, `providesPreview`, plus the executor/previewer methods.
- **API** (`api/IApi.ts`): `visibility` (`PUBLIC` fixed URL vs `PRIVATE` hashed URL) and `security`
  (`UNSECURE`); endpoints declare `authRequired`.
- **Settings** (`settings/ISetting.ts:3`): 10 `SettingType`s
  (boolean/code/color/font/int/select/string/multiSelect/password/roomPick); `public`/`hidden`/
  `required`/`section`/`i18n*`.
- **UI buttons** (`ui/`): five `UIActionButtonContext`s (message / room / message-box / user-dropdown
  / room-sidebar) with a declarative `when` visibility filter (room types, permissions, roles).

---

## 5. Manifest & permissions

### 5.1 `IAppInfo` — `metadata/IAppInfo.ts:5`

```typescript
interface IAppInfo {
  id: string;                       // UUID v4
  name: string; nameSlug: string; version: string; description: string;
  requiredApiVersion: string;       // semver range against the engine
  author: IAppAuthorInfo;           // name / support / homepage
  classFile: string;                // entry .ts
  iconFile: string;
  implements: Array<AppInterface>;  // declared event interfaces
  essentials?: Array<AppInterface>; // events that MUST have this app
  permissions?: Array<IPermission>;
  addon?: string;
}
```

Validated by `definition/app-schema.json`. The manifest has **no version discriminator** today
(every app is "v1") — the v2 design doc's "manifest envelope contract / `engineVersion` field" is a
new requirement, not an existing one.

### 5.2 Permissions — `permissions/IPermission.ts:1`, `metadata/AppPermissions.ts:19`

`IPermission { name; required? }`, with specialized variants: `INetworkingPermission { domains[] }`,
`IWorkspaceTokenPermission { scopes[] }`, `IReadSettingPermission { hiddenSettings[] }`.

`AppPermissions` is a fixed catalogue of scopes, **largely already shaped as `read`/`write` × entity
type** — `user.{read,write}`, `room.{read,write,system-view-all}`, `message.{read,write}`,
`role.{read,write}`, `upload.{read,write}`, plus capability scopes (`networking`, `persistence`,
`scheduler`, `apis`, `ui.interaction`, `email.send`, livechat.*, `videoConference.*`, etc.).

> **v2 note:** the design doc's "coarse `read`/`write` × entity" permission model is close to what
> already exists here; the gap is *enforcement* — see the enforcement gap in
> `03-runtime-and-bridges.md`.

### 5.3 Exceptions — `definition/exceptions/`

- `AppsEngineException` (`AppsEngineException.ts:14`) — base; defines `JSONRPC_ERROR_CODE = -32070`
  (the value bridged back across the runtime boundary).
- `UserNotAllowedException`, `FileUploadNotAllowedException`, `InvalidSettingValueException`,
  `EssentialAppDisabledException`.

> **v2 friction:** "denied calls log to console but throw nothing." There is **no
> `PermissionDeniedError`** in this list — the absence is the problem the v2 doc flags under
> "Permissions insufficient."

---

## 6. End-to-end: what writing a v1 app looks like

```typescript
export class MyApp extends App implements IPreMessageSentModify {
  constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
    super(info, logger, accessors);
  }

  // contributions registered imperatively at init
  protected async extendConfiguration(config: IConfigurationExtend) {
    await config.slashCommands.provideSlashCommand(new MyCommand());
    await config.settings.provideSetting({ id: 'token', type: SettingType.PASSWORD, /* … */ });
  }

  // event handler: timing(pre) × context(modify) × the execute half of check/execute
  async executePreMessageSentModify(
    message: IMessage, builder: IMessageBuilder,
    read: IRead, http: IHttp, persistence: IPersistence,
  ): Promise<IMessage> {
    return builder.setText(`${message.text} — checked`).getMessage();
  }
}
```

Contrast this with the v2 sketch in `docs/apps-v2-sdk-design.md` §"Sketch of the intended app shape"
(`Engine.createApp()` + `app.on('message:pre', …)` returning `ctx.patch(message)`).

---

## 7. Summary of v1 SDK characteristics (for the v2 discussion)

- **Class-based**, single entry class extending `App`; contributions registered imperatively.
- **Accessor indirection** for every read (`read.get*Reader().getById`) and write
  (`modify.get*().start*()…finish()`); three write shapes per entity (create-builder, update-builder,
  extender) plus domain ops for sensitive fields.
- **Bespoke eager-resolved entity types**, with parallel `*Raw` types where eager resolution is too
  expensive — evidence the eager model doesn't scale.
- **Event interfaces** encode timing × context in the *name* and split into `check*`/`execute*`;
  prevention is signaled inconsistently (boolean return *or* thrown exception).
- **12-state `AppStatus`** conflating desired state, transition origin, and error cause.
- **Permissions catalogue** already roughly `read`/`write` × entity, but **no runtime denial error**.
- **No manifest version discriminator** — everything is implicitly v1.
