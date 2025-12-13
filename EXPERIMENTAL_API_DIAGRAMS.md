# Experimental API Framework - Diagrams and Workflows

This document contains visual diagrams to help understand the experimental API framework architecture and workflows.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Permission Flow](#permission-flow)
3. [API Call Sequence](#api-call-sequence)
4. [Installation Workflow](#installation-workflow)
5. [Settings Enforcement](#settings-enforcement)
6. [Notification System](#notification-system)
7. [Feature Lifecycle](#feature-lifecycle)

---

## Architecture Overview

```mermaid
graph TB
    subgraph "Rocket.Chat App"
        APP[App Code]
    end
    
    subgraph "Apps-Engine - Accessors Layer"
        MODIFY[IExperimentalModify]
        READ[IExperimentalRead]
        APP --> MODIFY
        APP --> READ
    end
    
    subgraph "Apps-Engine - Server Layer"
        EXPBRIDGE[ExperimentalBridge<br/>Abstract]
        REGISTRY[ExperimentalFeatureRegistry]
        PERMMGR[AppPermissionManager]
        
        MODIFY --> EXPBRIDGE
        READ --> EXPBRIDGE
        EXPBRIDGE --> REGISTRY
        EXPBRIDGE --> PERMMGR
    end
    
    subgraph "Meteor App - Implementation"
        APPEXPBRIDGE[AppExperimentalBridge<br/>Concrete Implementation]
        SETTINGS[System Settings]
        NOTIFICATIONS[Notification Service]
        DB[(Usage Tracking DB)]
        
        EXPBRIDGE -.implements.-> APPEXPBRIDGE
        APPEXPBRIDGE --> SETTINGS
        APPEXPBRIDGE --> NOTIFICATIONS
        APPEXPBRIDGE --> DB
    end
    
    subgraph "Admin Interface"
        ADMINDASH[Admin Dashboard]
        SETTINGSUI[Settings UI]
        ALERTS[Alert System]
        
        ADMINDASH --> SETTINGS
        SETTINGSUI --> SETTINGS
        NOTIFICATIONS --> ALERTS
    end
    
    style EXPBRIDGE fill:#ff9999
    style REGISTRY fill:#ff9999
    style APPEXPBRIDGE fill:#99ccff
    style SETTINGS fill:#99ff99
```

---

## Permission Flow

```mermaid
flowchart TD
    START([App calls experimental API])
    
    CHECK_GLOBAL{Global setting:<br/>Experimental enabled?}
    CHECK_FEATURE{Feature in<br/>allowed list?}
    CHECK_BASE_PERM{Has experimental.access<br/>permission?}
    CHECK_FEATURE_PERM{Has feature-specific<br/>permission?}
    TRACK[Track usage in DB]
    LOG[Log API call]
    EXECUTE[Execute experimental method]
    END_SUCCESS([Return result])
    
    ERROR_GLOBAL[Throw: ExperimentalFeatureDisabledError<br/>Reason: Global setting]
    ERROR_FEATURE[Throw: ExperimentalFeatureDisabledError<br/>Reason: Feature not allowed]
    ERROR_BASE[Throw: PermissionDeniedError<br/>Missing: experimental.access]
    ERROR_FEATURE_PERM[Throw: PermissionDeniedError<br/>Missing: feature permission]
    END_ERROR([Return error])
    
    START --> CHECK_GLOBAL
    
    CHECK_GLOBAL -->|No| ERROR_GLOBAL
    CHECK_GLOBAL -->|Yes| CHECK_FEATURE
    
    CHECK_FEATURE -->|No| ERROR_FEATURE
    CHECK_FEATURE -->|Yes| CHECK_BASE_PERM
    
    CHECK_BASE_PERM -->|No| ERROR_BASE
    CHECK_BASE_PERM -->|Yes| CHECK_FEATURE_PERM
    
    CHECK_FEATURE_PERM -->|No| ERROR_FEATURE_PERM
    CHECK_FEATURE_PERM -->|Yes| TRACK
    
    TRACK --> LOG
    LOG --> EXECUTE
    EXECUTE --> END_SUCCESS
    
    ERROR_GLOBAL --> END_ERROR
    ERROR_FEATURE --> END_ERROR
    ERROR_BASE --> END_ERROR
    ERROR_FEATURE_PERM --> END_ERROR
    
    style START fill:#90EE90
    style END_SUCCESS fill:#90EE90
    style END_ERROR fill:#FFB6C6
    style ERROR_GLOBAL fill:#FFB6C6
    style ERROR_FEATURE fill:#FFB6C6
    style ERROR_BASE fill:#FFB6C6
    style ERROR_FEATURE_PERM fill:#FFB6C6
    style EXECUTE fill:#87CEEB
```

---

## API Call Sequence

```mermaid
sequenceDiagram
    participant App as Rocket.Chat App
    participant Accessor as IExperimentalModify
    participant Bridge as ExperimentalBridge
    participant PermMgr as AppPermissionManager
    participant Registry as FeatureRegistry
    participant Impl as AppExperimentalBridge
    participant Settings as System Settings
    participant DB as Usage Tracking DB
    participant Logger as App Logger
    
    App->>Accessor: executeFeatureAlpha(data)
    Accessor->>Bridge: doExperimentalFeatureAlpha(data, appId)
    
    Bridge->>Bridge: checkExperimentalAccess(featureId, appId)
    
    Bridge->>Settings: get('Apps_Experimental_Enabled')
    Settings-->>Bridge: true
    
    Bridge->>Settings: get('Apps_Experimental_AllowedFeatures')
    Settings-->>Bridge: ['feature-alpha', 'feature-beta']
    
    Bridge->>Bridge: validateFeatureInAllowlist()
    
    Bridge->>PermMgr: hasPermission(appId, 'experimental.access')
    PermMgr-->>Bridge: Permission granted
    
    Bridge->>PermMgr: hasPermission(appId, 'experimental.feature-alpha')
    PermMgr-->>Bridge: Permission granted
    
    Bridge->>Registry: isFeatureAvailable('feature-alpha', version)
    Registry-->>Bridge: true
    
    Bridge->>Impl: executeFeatureAlpha(data, appId)
    
    Impl->>DB: trackExperimentalUsage(appId, featureId)
    DB-->>Impl: Tracked
    
    Impl->>Logger: log('EXPERIMENTAL: feature-alpha used')
    Logger-->>Impl: Logged
    
    Impl->>Impl: Execute actual feature logic
    Impl-->>Bridge: result
    
    Bridge-->>Accessor: result
    Accessor-->>App: result
    
    Note over App,Logger: Success Path
    
    rect rgb(255, 200, 200)
        Note over Bridge,Settings: Error Path (if experimental disabled)
        Bridge->>Settings: get('Apps_Experimental_Enabled')
        Settings-->>Bridge: false
        Bridge-->>App: ExperimentalFeatureDisabledError
    end
```

---

## Installation Workflow

```mermaid
flowchart TD
    START([User uploads/installs app])
    
    PARSE[Parse app.json]
    CHECK_EXP{Has experimental<br/>features?}
    
    SHOW_WARNING[Show warning modal]
    WARNING_CONTENT["⚠️ Experimental Features Warning<br/><br/>This app uses experimental features:<br/>- feature-alpha (Alpha)<br/>- feature-beta (Beta)<br/><br/>⚠️ Important:<br/>• May break in future updates<br/>• May be removed without notice<br/>• Not covered by standard support<br/><br/>Continue installation?"]
    
    USER_CHOICE{User accepts<br/>risks?}
    
    VALIDATE_PERMS[Validate permissions]
    CHECK_SETTINGS{Experimental features<br/>enabled in settings?}
    
    CHECK_ALLOWED{Features in<br/>allowed list?}
    
    INSTALL[Install app]
    MARK_EXPERIMENTAL[Mark app as using experimental features]
    NOTIFY_ADMIN[Notify admins]
    ADD_BADGE[Add experimental badge in UI]
    LOG_INSTALL[Log installation with experimental flag]
    
    SUCCESS([Installation complete])
    
    CANCEL[Cancel installation]
    ERROR_DISABLED[Show error: Experimental features disabled]
    ERROR_NOT_ALLOWED[Show error: Some features not allowed]
    
    FAIL([Installation failed])
    
    START --> PARSE
    PARSE --> CHECK_EXP
    
    CHECK_EXP -->|No| VALIDATE_PERMS
    CHECK_EXP -->|Yes| SHOW_WARNING
    
    SHOW_WARNING --> WARNING_CONTENT
    WARNING_CONTENT --> USER_CHOICE
    
    USER_CHOICE -->|No| CANCEL
    USER_CHOICE -->|Yes| VALIDATE_PERMS
    
    VALIDATE_PERMS --> CHECK_SETTINGS
    
    CHECK_SETTINGS -->|No| ERROR_DISABLED
    CHECK_SETTINGS -->|Yes| CHECK_ALLOWED
    
    CHECK_ALLOWED -->|No| ERROR_NOT_ALLOWED
    CHECK_ALLOWED -->|Yes| INSTALL
    
    INSTALL --> MARK_EXPERIMENTAL
    MARK_EXPERIMENTAL --> NOTIFY_ADMIN
    NOTIFY_ADMIN --> ADD_BADGE
    ADD_BADGE --> LOG_INSTALL
    LOG_INSTALL --> SUCCESS
    
    CANCEL --> FAIL
    ERROR_DISABLED --> FAIL
    ERROR_NOT_ALLOWED --> FAIL
    
    style START fill:#90EE90
    style SUCCESS fill:#90EE90
    style FAIL fill:#FFB6C6
    style WARNING_CONTENT fill:#FFE4B5
    style SHOW_WARNING fill:#FFE4B5
    style ERROR_DISABLED fill:#FFB6C6
    style ERROR_NOT_ALLOWED fill:#FFB6C6
    style INSTALL fill:#87CEEB
```

---

## Settings Enforcement

```mermaid
flowchart LR
    subgraph "System Settings"
        GLOBAL[Apps_Experimental_Enabled<br/>Boolean: true/false]
        ALLOWED[Apps_Experimental_AllowedFeatures<br/>Array: feature IDs or empty]
        LOG_USAGE[Apps_Experimental_LogUsage<br/>Boolean: true/false]
        NOTIFY[Apps_Experimental_NotifyAdmins<br/>Boolean: true/false]
    end
    
    subgraph "Runtime Enforcement"
        CHECK_GLOBAL{Global enabled?}
        CHECK_ALLOWED{Feature in<br/>allowed list OR<br/>list is empty?}
        
        ALLOW[Allow API call]
        DENY[Deny API call]
    end
    
    subgraph "Side Effects"
        DO_LOG{Logging<br/>enabled?}
        DO_NOTIFY{Notify<br/>enabled?}
        
        LOG_DB[(Log to DB)]
        LOG_FILE[Log to file]
        SEND_ALERT[Send admin alert]
        SKIP_LOG[Skip logging]
        SKIP_NOTIFY[Skip notification]
    end
    
    GLOBAL --> CHECK_GLOBAL
    CHECK_GLOBAL -->|No| DENY
    CHECK_GLOBAL -->|Yes| CHECK_ALLOWED
    
    ALLOWED --> CHECK_ALLOWED
    CHECK_ALLOWED -->|No| DENY
    CHECK_ALLOWED -->|Yes| ALLOW
    
    ALLOW --> DO_LOG
    ALLOW --> DO_NOTIFY
    
    LOG_USAGE --> DO_LOG
    DO_LOG -->|Yes| LOG_DB
    DO_LOG -->|Yes| LOG_FILE
    DO_LOG -->|No| SKIP_LOG
    
    NOTIFY --> DO_NOTIFY
    DO_NOTIFY -->|Yes| SEND_ALERT
    DO_NOTIFY -->|No| SKIP_NOTIFY
    
    style GLOBAL fill:#99ff99
    style ALLOWED fill:#99ff99
    style LOG_USAGE fill:#99ff99
    style NOTIFY fill:#99ff99
    style ALLOW fill:#90EE90
    style DENY fill:#FFB6C6
```

---

## Notification System

```mermaid
graph TB
    subgraph "Trigger Events"
        INSTALL[App Installation]
        UPDATE[App Update]
        FIRST_USE[First API Use]
        DEPRECATE[Feature Deprecated]
        REMOVE[Feature Removed]
    end
    
    subgraph "Notification Router"
        ROUTER{Notification Type}
    end
    
    subgraph "Notification Channels"
        MODAL[Modal Dialog]
        BADGE[UI Badge/Icon]
        BANNER[Admin Banner]
        EMAIL[Email Alert]
        LOG[System Log]
        WEBHOOK[Webhook]
    end
    
    subgraph "Notification Content"
        INSTALL_MSG["App X uses experimental features:<br/>• feature-alpha (Alpha)<br/>• feature-beta (Beta)"]
        
        DEPRECATE_MSG["⚠️ Deprecation Warning<br/><br/>Feature 'feature-alpha' is deprecated<br/>and will be removed in version X.X.X<br/><br/>Affected apps:<br/>• App A<br/>• App B<br/><br/>Migration guide: [link]"]
        
        REMOVE_MSG["🚨 Breaking Change<br/><br/>Feature 'feature-alpha' has been removed<br/><br/>Affected apps will no longer function:<br/>• App A<br/>• App B<br/><br/>Action required: Update or uninstall"]
    end
    
    INSTALL --> ROUTER
    UPDATE --> ROUTER
    FIRST_USE --> ROUTER
    DEPRECATE --> ROUTER
    REMOVE --> ROUTER
    
    ROUTER -->|Install/Update| MODAL
    ROUTER -->|Install/Update| BADGE
    ROUTER -->|First Use| LOG
    ROUTER -->|Deprecate| BANNER
    ROUTER -->|Deprecate| EMAIL
    ROUTER -->|Remove| BANNER
    ROUTER -->|Remove| EMAIL
    ROUTER -->|Remove| WEBHOOK
    
    MODAL -.-> INSTALL_MSG
    BANNER -.-> DEPRECATE_MSG
    EMAIL -.-> REMOVE_MSG
    
    style INSTALL fill:#87CEEB
    style DEPRECATE fill:#FFE4B5
    style REMOVE fill:#FFB6C6
    style MODAL fill:#DDA0DD
    style BADGE fill:#DDA0DD
    style BANNER fill:#DDA0DD
    style EMAIL fill:#DDA0DD
```

---

## Feature Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Proposal
    
    Proposal --> Development: Approved
    Proposal --> [*]: Rejected
    
    Development --> Alpha: Initial Implementation
    
    Alpha --> Beta: Stabilized
    Alpha --> Removed: Failed/Abandoned
    
    Beta --> StableCandidate: Production Ready
    Beta --> Alpha: Major Issues Found
    Beta --> Removed: Failed
    
    StableCandidate --> Stable: Graduated
    StableCandidate --> Beta: Issues Found
    
    Stable --> Deprecated: Better Alternative Available
    Stable --> [*]: Permanent Feature
    
    Deprecated --> Removed: After Grace Period
    
    Removed --> [*]
    
    note right of Proposal
        • RFC/Design Document
        • Team Review
        • Risk Assessment
    end note
    
    note right of Alpha
        • Experimental Bridge
        • Breaking changes allowed
        • Minimal documentation
        • Limited testing
        • Permission: experimental.feature-X
    end note
    
    note right of Beta
        • Feature mostly stable
        • Breaking changes discouraged
        • Full documentation
        • Comprehensive testing
        • Broader adoption encouraged
    end note
    
    note right of StableCandidate
        • No breaking changes
        • Production-grade testing
        • Performance validation
        • Security audit
        • Migration plan prepared
    end note
    
    note right of Stable
        • Moved to permanent bridge
        • Standard deprecation policy
        • Full support
        • Breaking changes require RFC
    end note
    
    note right of Deprecated
        • Deprecation notice (min 2 versions)
        • Migration guide published
        • Warnings in logs
        • Admin notifications
    end note
    
    note right of Removed
        • API returns error
        • Apps using feature break
        • Clear error messages
        • Migration resources available
    end note
```

---

## App Usage Badge System

```mermaid
graph LR
    subgraph "App Card in Admin UI"
        APP_ICON[App Icon]
        APP_NAME[App Name]
        APP_VERSION[Version 1.0.0]
        BADGES[Badges Area]
    end
    
    subgraph "Badge Logic"
        CHECK{Uses experimental<br/>features?}
        LEVEL{Most severe<br/>feature status?}
    end
    
    subgraph "Badge Variants"
        NONE[No Badge]
        ALPHA[🔬 Alpha Features]
        BETA[⚠️ Beta Features]
        DEPRECATED[⚠️ Deprecated Features]
    end
    
    subgraph "Tooltip Details"
        TOOLTIP["Experimental Features Used:<br/><br/>🔬 feature-alpha (Alpha)<br/>  Introduced: v1.56.0<br/>  Status: Unstable<br/><br/>⚠️ feature-beta (Beta)<br/>  Introduced: v1.57.0<br/>  Status: Mostly stable<br/><br/>⚠️ These features may change<br/>or be removed without notice."]
    end
    
    BADGES --> CHECK
    CHECK -->|No| NONE
    CHECK -->|Yes| LEVEL
    
    LEVEL -->|Has Alpha| ALPHA
    LEVEL -->|Has Beta only| BETA
    LEVEL -->|Has Deprecated| DEPRECATED
    
    ALPHA -.hover.-> TOOLTIP
    BETA -.hover.-> TOOLTIP
    DEPRECATED -.hover.-> TOOLTIP
    
    APP_ICON --- APP_NAME
    APP_NAME --- APP_VERSION
    APP_VERSION --- BADGES
    
    style ALPHA fill:#ff9999
    style BETA fill:#ffcc99
    style DEPRECATED fill:#ffeb99
    style TOOLTIP fill:#f0f0f0
```

---

## Migration Path Example

```mermaid
flowchart TD
    subgraph "Version 1.56.0"
        V156_NEW[New Experimental Feature:<br/>experimental.advancedSearch]
        V156_STATUS[Status: Alpha]
    end
    
    subgraph "Version 1.58.0"
        V158_IMPROVE[Feature Improvements:<br/>• Performance optimizations<br/>• Breaking API changes<br/>• Bug fixes]
        V158_STATUS[Status: Alpha]
    end
    
    subgraph "Version 1.60.0"
        V160_STABLE[Feature Stabilized:<br/>• API frozen<br/>• Full tests<br/>• Documentation]
        V160_STATUS[Status: Beta]
    end
    
    subgraph "Version 1.62.0"
        V162_GRAD[Feature Graduated:<br/>• Moved to SearchBridge<br/>• Standard permissions<br/>• Long-term support]
        V162_STATUS[Status: Stable]
        V162_OLD[Legacy experimental API:<br/>Still works but deprecated]
    end
    
    subgraph "Version 1.64.0"
        V164_WARN[Deprecation Warnings:<br/>• Console warnings<br/>• Admin notifications<br/>• Migration guide]
        V164_STATUS[Status: Deprecated]
    end
    
    subgraph "Version 1.66.0"
        V166_REMOVE[Experimental API Removed:<br/>• Returns error<br/>• Apps must use stable API]
        V166_STATUS[Status: Removed]
    end
    
    V156_NEW --> V156_STATUS
    V156_STATUS -->|2 versions| V158_IMPROVE
    V158_IMPROVE --> V158_STATUS
    V158_STATUS -->|2 versions| V160_STABLE
    V160_STABLE --> V160_STATUS
    V160_STATUS -->|2 versions| V162_GRAD
    V162_GRAD --> V162_STATUS
    V162_GRAD --> V162_OLD
    V162_OLD -->|2 versions| V164_WARN
    V164_WARN --> V164_STATUS
    V164_STATUS -->|2 versions| V166_REMOVE
    V166_REMOVE --> V166_STATUS
    
    style V156_NEW fill:#ff9999
    style V158_IMPROVE fill:#ff9999
    style V160_STABLE fill:#ffcc99
    style V162_GRAD fill:#90EE90
    style V164_WARN fill:#ffeb99
    style V166_REMOVE fill:#FFB6C6
    
    note1["⚠️ Breaking changes<br/>allowed in Alpha"]
    note2["🎯 Minimum 4 versions<br/>from Alpha to Removal"]
    
    V158_STATUS -.-> note1
    V166_STATUS -.-> note2
```

---

## Error Handling Flow

```mermaid
flowchart TD
    ERROR{Error Type}
    
    DISABLED[ExperimentalFeatureDisabledError]
    PERMISSION[PermissionDeniedError]
    DEPRECATED[FeatureDeprecatedError]
    REMOVED[FeatureRemovedError]
    RUNTIME[RuntimeError]
    
    ERROR --> DISABLED
    ERROR --> PERMISSION
    ERROR --> DEPRECATED
    ERROR --> REMOVED
    ERROR --> RUNTIME
    
    subgraph "Response - ExperimentalFeatureDisabledError"
        DIS_LOG[Log to app logs]
        DIS_RETURN[Return error to app:<br/>• Error code: 403<br/>• Message: 'Experimental features disabled'<br/>• Hint: 'Contact admin to enable']
        DIS_UI[Show in admin UI:<br/>'App requires experimental features']
    end
    
    subgraph "Response - PermissionDeniedError"
        PERM_LOG[Log to app logs]
        PERM_RETURN[Return error to app:<br/>• Error code: 403<br/>• Message: 'Missing permission'<br/>• Required: 'experimental.feature-X']
        PERM_UI[Show in install UI:<br/>'Grant required permissions']
    end
    
    subgraph "Response - FeatureDeprecatedError"
        DEP_LOG[Log warning]
        DEP_RETURN[Execute but log warning:<br/>• Warning: 'Feature deprecated'<br/>• Removal version: 'X.X.X'<br/>• Migration: [link]]
        DEP_NOTIFY[Notify app developer<br/>via admin panel]
    end
    
    subgraph "Response - FeatureRemovedError"
        REM_LOG[Log error]
        REM_RETURN[Return error to app:<br/>• Error code: 410<br/>• Message: 'Feature removed'<br/>• Alternative: [link]]
        REM_DISABLE[Optionally disable app<br/>if critical]
    end
    
    DISABLED --> DIS_LOG --> DIS_RETURN --> DIS_UI
    PERMISSION --> PERM_LOG --> PERM_RETURN --> PERM_UI
    DEPRECATED --> DEP_LOG --> DEP_RETURN --> DEP_NOTIFY
    REMOVED --> REM_LOG --> REM_RETURN --> REM_DISABLE
    
    style DISABLED fill:#FFB6C6
    style PERMISSION fill:#FFB6C6
    style DEPRECATED fill:#FFE4B5
    style REMOVED fill:#FFB6C6
    style RUNTIME fill:#FFB6C6
```

---

## Database Schema

```mermaid
erDiagram
    APPS ||--o{ EXPERIMENTAL_USAGE : tracks
    APPS ||--o{ EXPERIMENTAL_FEATURES_USED : uses
    EXPERIMENTAL_FEATURES ||--o{ EXPERIMENTAL_FEATURES_USED : referenced_by
    EXPERIMENTAL_FEATURES ||--o{ FEATURE_DEPRECATIONS : has
    
    APPS {
        string id PK
        string name
        string version
        boolean uses_experimental
        timestamp installed_at
    }
    
    EXPERIMENTAL_FEATURES {
        string id PK
        string name
        string status "alpha|beta|deprecated|removed"
        string introduced_in
        string deprecated_in
        string removed_in
        string replaced_by
        json breaking_changes
    }
    
    EXPERIMENTAL_USAGE {
        string id PK
        string app_id FK
        string feature_id FK
        timestamp first_used
        timestamp last_used
        integer call_count
        json metadata
    }
    
    EXPERIMENTAL_FEATURES_USED {
        string app_id FK
        string feature_id FK
        boolean acknowledged
        timestamp added_at
    }
    
    FEATURE_DEPRECATIONS {
        string id PK
        string feature_id FK
        string version
        string description
        timestamp announced_at
        timestamp effective_at
    }
```

---

## Summary

These diagrams illustrate:

1. **Architecture**: Overall structure of the experimental API framework
2. **Permission Flow**: How permissions are checked at runtime
3. **API Call Sequence**: Detailed interaction between components
4. **Installation Workflow**: How apps with experimental features are installed
5. **Settings Enforcement**: How system settings control experimental features
6. **Notification System**: How users are notified about experimental feature usage
7. **Feature Lifecycle**: Complete lifecycle from proposal to removal
8. **Badge System**: How experimental features are visually indicated
9. **Migration Path**: Example of how a feature graduates from experimental to stable
10. **Error Handling**: How different error scenarios are handled
11. **Database Schema**: Data model for tracking experimental feature usage

All diagrams use Mermaid format and can be rendered in any Markdown viewer that supports Mermaid diagrams (GitHub, GitLab, VS Code with plugins, etc.).

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-13  
**Related**: EXPERIMENTAL_API_FRAMEWORK_PLAN.md
