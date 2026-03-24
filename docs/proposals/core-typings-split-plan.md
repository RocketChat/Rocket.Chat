# core-typings Split Plan

## Problem

`@rocket.chat/core-typings` has **201 TypeScript files** and **33 dependent packages**. Any modification invalidates the build cache for practically the entire monorepo, causing unnecessary rebuilds across unrelated domains.

## Current State

### Dependent Packages (33)

**Apps:**
- `apps/meteor`, `apps/meteor/ee/server/services`, `apps/uikit-playground`

**EE Apps:**
- `ee/apps/account-service`, `ee/apps/authorization-service`, `ee/apps/ddp-streamer`, `ee/apps/omnichannel-transcript`, `ee/apps/presence-service`, `ee/apps/queue-worker`

**EE Packages:**
- `ee/packages/abac`, `ee/packages/federation-matrix`, `ee/packages/license`, `ee/packages/media-calls`, `ee/packages/omnichannel-services`, `ee/packages/pdf-worker`, `ee/packages/presence`

**Community Packages:**
- `packages/api-client`, `packages/apps`, `packages/core-services`, `packages/cron`, `packages/ddp-client`, `packages/fuselage-ui-kit`, `packages/gazzodown`, `packages/http-router`, `packages/livechat`, `packages/message-types`, `packages/model-typings`, `packages/rest-typings`, `packages/ui-avatar`, `packages/ui-client`, `packages/ui-contexts`, `packages/ui-voip`, `packages/web-ui-registration`

### Domain Analysis

| Domain | Files | Existing Subdir | Likely Dependents |
|--------|-------|-----------------|-------------------|
| Omnichannel/Livechat | ~22 | `omnichannel/` + root `ILivechat*.ts` + `IOmnichannel*.ts` | livechat, omnichannel-services, omnichannel-transcript, meteor |
| Message | ~28 | `IMessage/` | gazzodown, message-types, meteor |
| License | 12 | `license/` | ee/license, meteor |
| Import | 13 | `import/` | meteor |
| LDAP | 7 | `ldap/` | meteor |
| Federation | 6 | `federation/` | federation-matrix, meteor |
| Cloud | 6 | `cloud/` | meteor |
| Media Calls | 4 | `mediaCalls/` | media-calls, ui-voip |
| Search | 3 | `search/` | meteor |
| User/Auth | ~15 | root (scattered) | almost all |
| Room/Subscription | ~5 | root | almost all |
| Settings | ~3 | root | almost all |

## Strategy

### Phase 1 — Isolated Domains (low risk, high gain)

Domains already organized in subdirectories with few dependents. Best candidates to start.

| New Package | Source Files | Dependents to Migrate |
|-------------|-------------|----------------------|
| `@rocket.chat/omnichannel-typings` | `omnichannel/`, `ILivechat*.ts`, `IOmnichannel*.ts`, `OmichannelRoutingConfig.ts`, `OmnichannelSortingMechanismSettingType.ts` | livechat, omnichannel-services, omnichannel-transcript, core-services, meteor |
| `@rocket.chat/license-typings` | `license/` | ee/license, meteor |
| `@rocket.chat/import-typings` | `import/` | meteor |
| `@rocket.chat/federation-typings` | `federation/` | federation-matrix, meteor |
| `@rocket.chat/ldap-typings` | `ldap/` | meteor |

### Phase 2 — Shared Domains (moderate risk)

Domains with more dependents but still well-scoped.

| New Package | Source Files | Dependents to Migrate |
|-------------|-------------|----------------------|
| `@rocket.chat/message-typings` | `IMessage/` | gazzodown, message-types, fuselage-ui-kit, meteor |
| `@rocket.chat/cloud-typings` | `cloud/`, `ICloud.ts` | meteor |
| `@rocket.chat/media-typings` | `mediaCalls/`, `IVideoConference.ts`, `VideoConferenceCapabilities.ts`, `ICallHistoryItem.ts` | media-calls, ui-voip, meteor |

### Phase 3 — Core Residual

After phases 1 and 2, `core-typings` shrinks to the fundamental types used by nearly every package:

- `IRocketChatRecord.ts` — base record type
- `IUser.ts`, `IUserStatus.ts`, `IMeApiUser.ts`, `IUserSession.ts` — user types
- `IRoom.ts`, `RoomType.ts`, `ISubscription.ts` — room types
- `ISetting.ts` — settings
- `IRole.ts`, `IPermission.ts` — authorization
- `UserStatus.ts`, `utils.ts` — shared utilities

This becomes a ~30-file "minimum core" that rarely changes.

## Migration Approach

For each domain being extracted:

### Step 1 — Create the new package

```
packages/<domain>-typings/
  package.json
  tsconfig.json
  src/
    index.ts
    <moved files>
```

### Step 2 — Move types

Move the relevant files from `core-typings/src/` to the new package.

### Step 3 — Backwards compatibility re-export

In `core-typings/src/index.ts`, replace direct exports with re-exports:

```ts
// Before
export * from './ILivechatAgent';
export * from './ILivechatVisitor';

// After (temporary, for backwards compat)
export * from '@rocket.chat/omnichannel-typings';
```

This ensures no downstream package breaks immediately.

### Step 4 — Migrate dependents

Update each dependent package to import from the new specific package instead of `core-typings`. This can be done incrementally, one package at a time.

### Step 5 — Remove re-exports

Once all dependents are migrated, remove the re-export from `core-typings`.

## Expected Impact

### Before
```
Change in ILivechatAgent.ts → core-typings invalidated → 33 packages rebuild
```

### After
```
Change in ILivechatAgent.ts → omnichannel-typings invalidated → 4-5 packages rebuild
```

### Build Cache Efficiency

| Phase | core-typings files | Packages affected by omnichannel change | Packages affected by license change |
|-------|-------------------|----------------------------------------|-------------------------------------|
| Current | 201 | 33 | 33 |
| After Phase 1 | ~140 | 5 | 2 |
| After Phase 2 | ~70 | 5 | 2 |
| After Phase 3 | ~30 | 5 | 2 |

## Risks and Considerations

- **Circular dependencies**: Some types reference each other across domains (e.g., `IRoom` references `IUser`). These cross-references need to be mapped before splitting.
- **model-typings coupling**: `packages/model-typings` defines MongoDB collection types using `core-typings`. It will need to depend on the specific domain packages.
- **rest-typings coupling**: API endpoint types reference many domain types. Will need multiple specific dependencies.
- **Incremental approach**: The re-export strategy ensures zero breaking changes during migration. Each phase can be shipped independently.
