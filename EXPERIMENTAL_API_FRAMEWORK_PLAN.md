# Experimental API Framework - Planning Document

## Executive Summary

This document outlines the design and implementation plan for introducing experimental APIs to the `packages/apps-engine`. The framework will enable Rocket.Chat to introduce new, potentially unstable API features that can evolve, break, or be removed without following standard deprecation cycles.

## Current Architecture Overview

### Apps-Engine Bridge Pattern

The apps-engine uses an abstract bridge pattern where:

1. **Apps-Engine Package** (`packages/apps-engine`):
   - Defines abstract bridges (e.g., `MessageBridge`, `RoomBridge`, `UserBridge`)
   - Each bridge extends `BaseBridge`
   - Bridges are aggregated in the `AppBridges` class
   - Permission checking happens at the bridge level using `AppPermissionManager`

2. **Meteor App Implementation** (`apps/meteor/app/apps/server/bridges`):
   - Implements concrete bridges (e.g., `AppMessageBridge`, `AppRoomBridge`)
   - `RealAppBridges` class extends `AppBridges` and instantiates all concrete bridges

3. **Permission System**:
   - Permissions defined in `AppPermissions` object with hierarchical structure
   - Apps declare required permissions in their `IAppInfo.permissions` array
   - `AppPermissionManager.hasPermission()` validates access
   - Missing permissions trigger `PermissionDeniedError`

## Proposed Architecture

### 1. Experimental Bridge

#### Purpose
A dedicated bridge to contain all experimental methods, isolating them from stable APIs.

#### Key Features
- Single bridge for all experimental features
- Version-aware API methods
- Explicit experimental markers
- Enhanced error messaging
- Deprecation tracking

#### Structure

```
packages/apps-engine/src/server/bridges/ExperimentalBridge.ts
packages/apps-engine/src/definition/accessors/IExperimentalRead.ts
packages/apps-engine/src/definition/accessors/IExperimentalModify.ts
apps/meteor/app/apps/server/bridges/experimental.ts (implementation)
```

### 2. Experimental Permissions

#### Permission Hierarchy

```typescript
AppPermissions = {
  // ... existing permissions
  'experimental': {
    'access': { name: 'experimental.access', required: true },
    'feature-alpha': { name: 'experimental.feature-alpha' },
    'feature-beta': { name: 'experimental.feature-beta' },
    // Individual experimental features get their own permissions
  }
}
```

#### Permission Rules
1. **Base Permission**: `experimental.access` - Required to use any experimental feature
2. **Feature-Specific Permissions**: Individual permissions for each experimental API
3. **Explicit Declaration**: Apps must explicitly list experimental permissions
4. **No Default Permissions**: Experimental permissions are NEVER in `defaultPermissions`

### 3. Experimental Feature Metadata

#### App Manifest Extension

```typescript
interface IAppInfo {
  // ... existing fields
  permissions?: Array<IPermission>;
  experimental?: {
    features: Array<string>;           // List of experimental features used
    acknowledgedRisks: boolean;        // Explicit risk acknowledgment
    version: string;                   // Apps-engine version compatibility
  };
}
```

#### Experimental Feature Registry

```typescript
interface IExperimentalFeature {
  id: string;                          // e.g., 'feature-alpha'
  name: string;                        // Human-readable name
  introducedIn: string;                // Apps-engine version
  status: 'alpha' | 'beta' | 'deprecated' | 'removed';
  deprecatedIn?: string;               // Version when deprecated
  removedIn?: string;                  // Version when removed
  replacedBy?: string;                 // Replacement feature/API
  breakingChanges?: Array<{
    version: string;
    description: string;
  }>;
}
```

### 4. User Notification Mechanism

#### Multiple Notification Channels

##### A. Installation/Update Warnings
- **When**: During app installation or update
- **What**: Modal dialog highlighting experimental feature usage
- **Content**: 
  - List of experimental features
  - Warning about potential breaking changes
  - Option to proceed or cancel

##### B. Admin Dashboard Indicators
- **Where**: Apps administration page
- **Visual**: 
  - Badge/icon on apps using experimental features
  - Color-coded risk levels (alpha=red, beta=orange)
  - Tooltip with feature details

##### C. App Logs
- **What**: Log entries when experimental APIs are called
- **Level**: INFO with "EXPERIMENTAL" prefix
- **Content**: Feature name, app ID, timestamp

##### D. System Notifications
- **When**: Experimental feature is deprecated or removed
- **Who**: Workspace administrators
- **Content**: Affected apps, migration guidance

##### E. Audit Trail
- **Purpose**: Track experimental feature usage
- **Storage**: New collection `apps_experimental_usage`
- **Data**: App ID, feature ID, first used, last used, call count

### 5. System Settings for Experimental Features

#### Global Settings Structure

```typescript
Settings = {
  'Apps_Experimental_Enabled': {
    type: 'boolean',
    default: true,
    section: 'Apps',
    group: 'Experimental Features',
    i18nLabel: 'Enable_Experimental_App_Features',
    i18nDescription: 'Enable_Experimental_App_Features_Description',
    alert: 'Warning: Disabling this will prevent apps using experimental features from functioning'
  },
  'Apps_Experimental_LogUsage': {
    type: 'boolean',
    default: true,
    section: 'Apps',
    group: 'Experimental Features',
    i18nLabel: 'Log_Experimental_Feature_Usage'
  },
  'Apps_Experimental_NotifyAdmins': {
    type: 'boolean',
    default: true,
    section: 'Apps',
    group: 'Experimental Features',
    i18nLabel: 'Notify_Admins_Experimental_Usage'
  },
  'Apps_Experimental_AllowedFeatures': {
    type: 'multiSelect',
    default: [],  // Empty = all allowed
    section: 'Apps',
    group: 'Experimental Features',
    i18nLabel: 'Allowed_Experimental_Features',
    i18nDescription: 'Leave_empty_to_allow_all'
  }
}
```

#### Settings Enforcement

1. **Global Kill Switch**: `Apps_Experimental_Enabled = false`
   - All experimental API calls return `ExperimentalFeatureDisabledError`
   - Apps continue to run but experimental features are no-ops
   
2. **Feature-Level Control**: `Apps_Experimental_AllowedFeatures`
   - Whitelist specific experimental features
   - More granular control than global switch

3. **Runtime Checking**:
   ```typescript
   // In ExperimentalBridge
   protected async checkExperimentalAccess(featureId: string, appId: string): Promise<void> {
     // Check global setting
     if (!settings.get('Apps_Experimental_Enabled')) {
       throw new ExperimentalFeatureDisabledError('Experimental features disabled globally');
     }
     
     // Check feature-specific allowlist
     const allowedFeatures = settings.get('Apps_Experimental_AllowedFeatures');
     if (allowedFeatures.length > 0 && !allowedFeatures.includes(featureId)) {
       throw new ExperimentalFeatureDisabledError(`Feature ${featureId} not allowed`);
     }
     
     // Check permission
     if (!AppPermissionManager.hasPermission(appId, AppPermissions.experimental.access)) {
       throw new PermissionDeniedError(...);
     }
   }
   ```

### 6. Implementation Components

#### Component Breakdown

##### 6.1 ExperimentalBridge (apps-engine)

**File**: `packages/apps-engine/src/server/bridges/ExperimentalBridge.ts`

```typescript
export abstract class ExperimentalBridge extends BaseBridge {
  /**
   * Registers usage of an experimental feature
   * Logs usage and performs permission checks
   */
  protected abstract trackFeatureUsage(
    featureId: string, 
    appId: string
  ): Promise<void>;
  
  /**
   * Checks if a feature is available
   */
  protected abstract isFeatureEnabled(
    featureId: string
  ): Promise<boolean>;
  
  /**
   * Example experimental method
   */
  public async doExperimentalFeatureAlpha(
    data: any, 
    appId: string
  ): Promise<any> {
    await this.checkExperimentalAccess('feature-alpha', appId);
    return this.executeFeatureAlpha(data, appId);
  }
  
  protected abstract executeFeatureAlpha(
    data: any, 
    appId: string
  ): Promise<any>;
}
```

##### 6.2 ExperimentalRegistry

**File**: `packages/apps-engine/src/server/managers/ExperimentalFeatureRegistry.ts`

```typescript
export class ExperimentalFeatureRegistry {
  private static features: Map<string, IExperimentalFeature> = new Map();
  
  public static register(feature: IExperimentalFeature): void {
    this.features.set(feature.id, feature);
  }
  
  public static getFeature(id: string): IExperimentalFeature | undefined {
    return this.features.get(id);
  }
  
  public static getAllFeatures(): IExperimentalFeature[] {
    return Array.from(this.features.values());
  }
  
  public static getActiveFeatures(): IExperimentalFeature[] {
    return this.getAllFeatures().filter(
      f => f.status === 'alpha' || f.status === 'beta'
    );
  }
  
  public static isFeatureAvailable(id: string, appsEngineVersion: string): boolean {
    const feature = this.getFeature(id);
    if (!feature) return false;
    if (feature.status === 'removed') return false;
    // Check version compatibility
    return semver.gte(appsEngineVersion, feature.introducedIn);
  }
}
```

##### 6.3 Accessor Interfaces

**File**: `packages/apps-engine/src/definition/accessors/IExperimentalRead.ts`

```typescript
export interface IExperimentalRead {
  /**
   * Check if an experimental feature is available
   * @experimental This API may change without notice
   */
  isFeatureAvailable(featureId: string): Promise<boolean>;
  
  /**
   * Get information about an experimental feature
   * @experimental This API may change without notice
   */
  getFeatureInfo(featureId: string): Promise<IExperimentalFeature | undefined>;
}
```

**File**: `packages/apps-engine/src/definition/accessors/IExperimentalModify.ts`

```typescript
export interface IExperimentalModify {
  /**
   * Execute experimental feature alpha
   * @experimental This API is in alpha and may change or be removed
   * @since 1.56.0
   * @permission experimental.feature-alpha
   */
  executeFeatureAlpha(data: any): Promise<any>;
  
  /**
   * Execute experimental feature beta
   * @experimental This API is in beta and may have breaking changes
   * @since 1.57.0
   * @permission experimental.feature-beta
   */
  executeFeatureBeta(data: any): Promise<any>;
}
```

##### 6.4 Meteor App Implementation

**File**: `apps/meteor/app/apps/server/bridges/experimental.ts`

```typescript
import { ExperimentalBridge } from '@rocket.chat/apps-engine/server/bridges/ExperimentalBridge';
import { settings } from '../../../settings/server';

export class AppExperimentalBridge extends ExperimentalBridge {
  constructor(private readonly orch) {
    super();
  }
  
  protected async trackFeatureUsage(featureId: string, appId: string): Promise<void> {
    // Log to app logs
    this.orch.debugLog(`App ${appId} using experimental feature: ${featureId}`);
    
    // Track in database
    await Apps.getModel().trackExperimentalUsage(appId, featureId);
    
    // Notify if enabled
    if (settings.get('Apps_Experimental_NotifyAdmins')) {
      await this.notifyAdmins(appId, featureId);
    }
  }
  
  protected async isFeatureEnabled(featureId: string): Promise<boolean> {
    if (!settings.get('Apps_Experimental_Enabled')) {
      return false;
    }
    
    const allowedFeatures = settings.get('Apps_Experimental_AllowedFeatures') || [];
    return allowedFeatures.length === 0 || allowedFeatures.includes(featureId);
  }
  
  protected async executeFeatureAlpha(data: any, appId: string): Promise<any> {
    // Actual implementation
    // ...
  }
}
```

##### 6.5 Update AppBridges

**File**: `packages/apps-engine/src/server/bridges/AppBridges.ts`

```typescript
export abstract class AppBridges {
  // ... existing bridges
  
  public abstract getExperimentalBridge(): ExperimentalBridge;
}
```

**File**: `apps/meteor/app/apps/server/bridges/bridges.js`

```typescript
export class RealAppBridges extends AppBridges {
  constructor(orch) {
    super();
    
    // ... existing bridges
    this._experimentalBridge = new AppExperimentalBridge(orch);
  }
  
  getExperimentalBridge() {
    return this._experimentalBridge;
  }
}
```

### 7. Documentation

#### 7.1 Developer Documentation

**File**: `packages/apps-engine/docs/EXPERIMENTAL_FEATURES.md`

**Content**: See separate file (to be created)

#### 7.2 API Documentation

- JSDoc comments with `@experimental` tag
- TypeDoc generation with experimental warnings
- Examples showing proper usage

#### 7.3 Admin Documentation

- System settings guide
- Risk mitigation strategies
- Troubleshooting experimental features

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Create `ExperimentalBridge` abstract class
- [ ] Create `ExperimentalFeatureRegistry`
- [ ] Update `AppBridges` to include experimental bridge
- [ ] Add experimental permissions to `AppPermissions`
- [ ] Create accessor interfaces

### Phase 2: Meteor Implementation (Week 2-3)
- [ ] Implement `AppExperimentalBridge`
- [ ] Add to `RealAppBridges`
- [ ] Create database schema for tracking usage
- [ ] Implement usage logging

### Phase 3: Settings & Controls (Week 3-4)
- [ ] Add system settings
- [ ] Implement settings enforcement
- [ ] Create admin UI for managing experimental features
- [ ] Add feature allowlist/blocklist controls

### Phase 4: Notifications (Week 4-5)
- [ ] Installation/update warnings
- [ ] Admin dashboard indicators
- [ ] System notifications for deprecations
- [ ] Email notifications (optional)

### Phase 5: Documentation (Week 5-6)
- [ ] Developer documentation
- [ ] API documentation
- [ ] Admin guide
- [ ] Migration guides
- [ ] Best practices

### Phase 6: Testing & Polish (Week 6-7)
- [ ] Unit tests for ExperimentalBridge
- [ ] Integration tests
- [ ] E2E tests for admin controls
- [ ] Performance testing
- [ ] Security review

## Migration Strategy

### For Existing Features

If we want to move existing stable features to experimental:

1. **Add experimental flag**: Mark the feature in registry
2. **Dual implementation**: Keep both old and new for one version
3. **Deprecation notice**: Warn users in advance
4. **Migration period**: Give 2-3 versions for migration
5. **Removal**: Remove old implementation

### For New Features

All new experimental features:

1. **Start in ExperimentalBridge**
2. **Graduate to stable** after proven
3. **Move to appropriate bridge** when stable
4. **Maintain for 3+ versions** before any breaking changes

## Security Considerations

1. **Permission Isolation**: Experimental features have separate permissions
2. **Audit Trail**: All experimental API usage is logged
3. **Rate Limiting**: Consider rate limits on experimental features
4. **Validation**: Extra input validation for experimental endpoints
5. **Opt-in Model**: Explicit consent required

## Performance Considerations

1. **Lazy Loading**: Only load experimental bridge when needed
2. **Caching**: Cache feature availability checks
3. **Async Operations**: All experimental operations should be async
4. **Graceful Degradation**: If experimental feature fails, app should continue

## Backwards Compatibility

1. **Existing Apps**: Continue to work without changes
2. **New Permission Model**: Apps without experimental permissions can't access experimental APIs
3. **Settings Default**: Experimental features enabled by default (to not break existing behavior)
4. **Gradual Adoption**: Apps can opt-in progressively

## Questions for Discussion

1. **Naming Convention**: Should we use a prefix for experimental methods? (e.g., `experimental_`, `x_`, or rely on bridge separation?)

2. **Versioning Strategy**: How do we handle apps built against experimental APIs that change?

3. **Marketplace Policy**: Should apps using experimental features have special marketplace badges/warnings?

4. **Testing Requirements**: Should apps with experimental features require additional testing/review?

5. **Support Policy**: What's the support policy for apps using experimental features?

6. **Graduation Criteria**: What criteria must an experimental feature meet to graduate to stable?

7. **Deprecation Timeline**: What's the minimum notice period before removing an experimental feature?

8. **Feature Flags**: Should we support per-workspace feature flags for experimental features?

## Success Metrics

1. **Adoption Rate**: % of apps using experimental features
2. **Stability**: Number of breaking changes per experimental feature
3. **Graduation Rate**: % of experimental features that graduate to stable
4. **Developer Satisfaction**: Feedback scores from app developers
5. **Issue Count**: Number of issues related to experimental features

## Next Steps

1. Review this plan with the team
2. Gather feedback and answer outstanding questions
3. Finalize the technical approach
4. Create detailed implementation tickets
5. Begin Phase 1 development

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-13  
**Author**: Background Agent  
**Status**: Draft - Pending Review
