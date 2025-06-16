# App State Management in Multi-Instance Environments

## Problem Statement

App management in Rocket.Chat's multi-instance cluster environments has proven to be problematic. The primary issue is that apps that should be "enabled" across all server instances in a cluster occasionally show up as "disabled" in some instances while remaining "enabled" in others. This creates inconsistent behavior and makes it difficult to:

1. **Debug app state issues** - When an app shows different states across instances, it's challenging to determine the root cause
2. **Ensure consistent app behavior** - Users may experience different functionality depending on which instance serves their request
3. **Manage app lifecycle reliably** - Administrative actions may not propagate correctly across all instances
4. **Monitor app health** - Current status reporting doesn't clearly distinguish between intended state and actual runtime state

The current single `status` field in the `IAppStorageItem` interface conflates two distinct concepts:
- The **intended state** of the app (what administrators want)
- The **actual runtime state** of the app (what's currently happening in each instance)

## Proposed Solution: Dual-Status Architecture

We propose splitting the current app status field into two distinct fields:

### 1. Desired Status (`desiredStatus`)
- Represents the target state as expressed by users/administrators
- Controlled by administrative actions (install, enable, disable, uninstall)
- Shared across all instances in the cluster
- Persisted in the app metadata storage
- Values: `enabled`, `disabled`, `uninstalled`

### 2. Initialization Status (`initStatus`) 
- Represents the actual runtime executability state of the app in each instance
- Reflects the real-time status of app initialization, compilation, and execution
- Instance-specific (can vary between cluster nodes)
- Updated by the apps engine during runtime operations
- Retains current detailed status values: `UNKNOWN`, `CONSTRUCTED`, `INITIALIZED`, `AUTO_ENABLED`, `MANUALLY_ENABLED`, `COMPILER_ERROR_DISABLED`, `INVALID_LICENSE_DISABLED`, etc.

### Benefits

1. **Clear separation of concerns** - Administrative intent vs. runtime reality
2. **Better debugging** - Easy to identify when desired state doesn't match actual state
3. **Improved monitoring** - Dashboard can show both intended and actual states
4. **Reconciliation capabilities** - System can automatically attempt to align actual state with desired state
5. **Audit trails** - Track when and why states diverge across instances

## Architectural Overview

### Current Architecture
```
IAppStorageItem {
  status: AppStatus  // Single field for both intent and runtime state
  // ... other fields
}
```

### Proposed Architecture
```
IAppStorageItem {
  desiredStatus: AppDesiredStatus  // Administrative intent
  initStatus: AppStatus           // Runtime state per instance
  // ... other fields
}

AppDesiredStatus {
  ENABLED = 'enabled'
  DISABLED = 'disabled'  
  UNINSTALLED = 'uninstalled'
}
```

### State Management Flow

1. **Administrative Actions** (install, enable, disable)
   - Update `desiredStatus` in storage
   - Broadcast desired state change to all instances
   - Each instance attempts to achieve desired state
   - Each instance updates its local `initStatus` based on results

2. **Instance Startup**
   - Read `desiredStatus` from storage
   - Attempt to initialize app according to desired state
   - Set `initStatus` based on initialization results
   - Report status to cluster coordination system

3. **Status Reconciliation**
   - Periodic background process compares `desiredStatus` vs `initStatus`
   - Attempts to resolve discrepancies
   - Logs and alerts on persistent mismatches

### API Changes

The existing cluster status reporting will be enhanced to show both statuses:

```typescript
type AppStatusReport = {
  [appId: string]: {
    instanceId: string;
    desiredStatus: AppDesiredStatus;
    initStatus: AppStatus;
  }[];
};
```

## Implementation Tasks

### Phase 1: Core Infrastructure (2-3 sprints)

#### APPS-001: Define New Status Types
- **Story**: As a developer, I need new type definitions for the dual-status system
- **Tasks**:
  - Create `AppDesiredStatus` enum with `ENABLED`, `DISABLED`, `UNINSTALLED`
  - Update `IAppStorageItem` interface to include both `desiredStatus` and `initStatus`
  - Create migration utilities for existing data
- **AC**: New types are defined and exported from apps-engine

#### APPS-002: Database Schema Migration
- **Story**: As a system administrator, I need existing app data migrated to the new dual-status format
- **Tasks**:
  - Create database migration script to add `desiredStatus` field
  - Map existing `status` values to appropriate `desiredStatus` values
  - Preserve existing `status` as `initStatus`
  - Add database indexes for new fields
- **AC**: All existing app installations have both status fields populated correctly

#### APPS-003: Update AppManager Core Logic
- **Story**: As a developer, I need AppManager to handle dual-status fields correctly
- **Tasks**:
  - Update `AppManager.add()` to set both status fields
  - Update `AppManager.enable()` to modify `desiredStatus`
  - Update `AppManager.disable()` to modify `desiredStatus`
  - Update status checking methods to use appropriate field
- **AC**: Basic app operations work with new status system

### Phase 2: Instance Management (2-3 sprints)

#### APPS-004: Instance-Specific Status Tracking
- **Story**: As a system administrator, I need to see the actual status of apps on each instance
- **Tasks**:
  - Update `ProxiedApp.setStatus()` to modify `initStatus`
  - Modify startup processes to set `initStatus` based on initialization results
  - Update status persistence to save instance-specific init status
- **AC**: Each instance correctly tracks its own app initialization status

#### APPS-005: Cluster Status Reporting Enhancement
- **Story**: As a system administrator, I need to see both desired and actual status for each app across all instances
- **Tasks**:
  - Update `AppStatusReport` type to include both status fields
  - Modify `getAppsStatusInInstances()` to return dual status
  - Update REST API endpoints to expose both statuses
  - Update admin UI to display both statuses clearly
- **AC**: Admin interface shows both desired and actual status for all apps

#### APPS-006: Status Broadcasting System
- **Story**: As a system administrator, I need desired status changes to propagate to all instances
- **Tasks**:
  - Implement event system for desired status changes
  - Add listeners in each instance to respond to desired status changes
  - Create retry mechanism for failed status propagation
- **AC**: Desired status changes are reliably communicated to all instances

### Phase 3: Reconciliation and Monitoring (2 sprints)

#### APPS-007: Status Reconciliation Service
- **Story**: As a system administrator, I need the system to automatically attempt to resolve status mismatches
- **Tasks**:
  - Create background service to compare desired vs actual status
  - Implement retry logic for failed initialization attempts
  - Add configurable reconciliation intervals
  - Create metrics for reconciliation success/failure rates
- **AC**: System automatically attempts to resolve status discrepancies

#### APPS-008: Enhanced Monitoring and Alerting
- **Story**: As a system administrator, I need to be alerted when apps are not in their desired state
- **Tasks**:
  - Add monitoring dashboards for app status health
  - Create alerts for persistent status mismatches
  - Add logging for status reconciliation activities
  - Create troubleshooting documentation
- **AC**: Administrators receive actionable alerts about app status issues

### Phase 4: API and UI Updates (1-2 sprints)

#### APPS-009: REST API Compatibility
- **Story**: As an API consumer, I need existing endpoints to continue working while providing new status information
- **Tasks**:
  - Maintain backward compatibility for existing status field
  - Add new optional fields for detailed status information
  - Update API documentation
  - Create client migration guide
- **AC**: Existing API clients continue to work without changes

#### APPS-010: Admin UI Enhancements
- **Story**: As a system administrator, I need clear visibility into app status across the cluster
- **Tasks**:
  - Update app management UI to show both statuses
  - Add visual indicators for status mismatches
  - Create troubleshooting tools for status issues
  - Add bulk reconciliation actions
- **AC**: Admin UI provides clear insight into app status health

## Testing Strategy

### Unit Tests
- Status transition logic in AppManager
- Status comparison and reconciliation algorithms
- Event broadcasting and handling

### Integration Tests
- Multi-instance status propagation
- Database migration correctness
- API endpoint responses with new status fields

### E2E Tests
- Complete app lifecycle with dual status tracking
- Cluster failover scenarios
- Status reconciliation after network partitions

## Risk Analysis

### High Risk
- **Data migration complexity**: Existing installations have diverse status combinations
- **Backward compatibility**: Existing API clients and integrations must continue working

### Medium Risk  
- **Performance impact**: Additional status checks and reconciliation processes
- **Complexity increase**: More complex state management logic

### Mitigation Strategies
- Comprehensive testing in staging environments
- Gradual rollout with feature flags
- Detailed monitoring and rollback procedures
- Clear documentation and training materials

## Alternative Approaches

### Alternative 1: Status History Log
Instead of dual status fields, maintain a chronological log of status changes with timestamps and reasons. This would provide:
- **Pros**: Complete audit trail, easier debugging of status changes
- **Cons**: More complex queries, higher storage requirements, doesn't solve the fundamental problem of conflating intent with state

### Alternative 2: Instance-Specific Status Storage
Store status separately for each instance rather than having a shared desired status:
- **Pros**: More granular control per instance
- **Cons**: More complex administrative interface, harder to enforce consistent policies across cluster

### Alternative 3: External State Management
Use an external system (Redis, etcd) for app state coordination:
- **Pros**: Battle-tested distributed state management
- **Cons**: Additional infrastructure dependency, complexity in deployment and maintenance

### Alternative 4: Event Sourcing Pattern
Implement full event sourcing for app state changes:
- **Pros**: Complete audit trail, ability to replay state changes, natural fit for distributed systems
- **Cons**: Significant architectural changes required, complexity in implementation and debugging

The proposed dual-status approach provides the best balance of solving the immediate problem while maintaining reasonable implementation complexity and backward compatibility.