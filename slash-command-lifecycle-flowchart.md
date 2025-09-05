# Slash Command Lifecycle in Rocket.Chat Apps Engine

This flowchart documents the possible transitions and states of slash commands registered by Rocket.Chat apps, based on analysis of the `packages/apps-engine` codebase.

## Mermaid Flowchart

```mermaid
graph TD
    subgraph "App Installation Phase"
        A[App Installed] --> B[App.initialize called]
        B --> C[App calls addCommand via ConfigurationExtend]
        C --> D{Command Valid?}
        D -->|No| E[CommandAlreadyExistsError or CommandHasAlreadyBeenTouchedError]
        D -->|Yes| F[Command stored in providedCommands Map]
        F --> G[AppSlashCommand created with isRegistered=false, isEnabled=false, isDisabled=false]
    end

    subgraph "App Enabling Phase"
        H[App Enable Requested] --> I[App.onEnable called]
        I --> J{onEnable returns true?}
        J -->|No| K[App remains disabled - commands not registered]
        J -->|Yes| L[AppManager.enableApp called]
        L --> M[CommandManager.registerCommands called]
        M --> N[For each non-disabled command]
        N --> O[Bridge.doRegisterCommand called]
        O --> P[Command registered in Rocket.Chat system]
        P --> Q[AppSlashCommand.hasBeenRegistered called]
        Q --> R[isRegistered=true, isEnabled=true, isDisabled=false]
        R --> S[Command becomes visible to users]
        
        %% Status change notification
        L --> T[ProxiedApp.setStatus called]
        T --> U[AppActivationBridge.doAppStatusChanged called]
        U --> V[External systems notified of app status change]
    end

    subgraph "Command State Management"
        S --> W{Command Operation}
        W -->|User executes command| X[CommandManager.executeCommand]
        W -->|App calls enableCommand| Y[Command enabled if not already registered]
        W -->|App calls disableCommand| Z[Command disabled if app owns it]
        W -->|App calls modifyCommand| AA[Command modified if app owns it or it's a system command]
        
        X --> BB[App.runExecutorOrPreviewer called]
        BB --> CC[Command execution result returned to user]
    end

    subgraph "App Disabling Phase"
        DD[App Disable Requested] --> EE[AppManager.disable called]
        EE --> FF[CommandManager.unregisterCommands called]
        FF --> GG[For each registered command]
        GG --> HH[Bridge.doUnregisterCommand called]
        HH --> II[Command removed from Rocket.Chat system]
        II --> JJ[AppSlashCommand.isRegistered=false]
        JJ --> KK[Command no longer visible to users]
        
        %% Status change notification
        EE --> LL[ProxiedApp.setStatus called]
        LL --> MM[AppActivationBridge.doAppStatusChanged called]
        MM --> NN[External systems notified of app status change]
    end

    subgraph "App Removal Phase"
        OO[App Uninstall Requested] --> PP[AppManager.remove called]
        PP --> QQ[App disabled if enabled]
        QQ --> RR[CommandManager.unregisterCommands called]
        RR --> SS[All commands unregistered]
        SS --> TT[AppActivationBridge.doAppRemoved called]
        TT --> UU[External systems notified of app removal]
        UU --> VV[App completely removed from system]
    end

    subgraph "Bridge Events & Notifications"
        WW[App Added] --> XX[AppActivationBridge.doAppAdded]
        YY[App Updated] --> ZZ[AppActivationBridge.doAppUpdated]
        AAA[App Status Changed] --> BBB[AppActivationBridge.doAppStatusChanged]
        CCC[App Removed] --> DDD[AppActivationBridge.doAppRemoved]
    end

    %% Connect the phases
    G --> H
    K --> DD
    S --> DD
    
    %% Connect notifications
    A --> WW
    L --> AAA
    EE --> AAA
    PP --> CCC

    %% Styling
    classDef appPhase fill:#e1f5fe
    classDef commandState fill:#f3e5f5
    classDef bridgeEvent fill:#fff3e0
    classDef errorState fill:#ffebee
    
    class A,B,C,H,I,L,DD,EE,OO,PP appPhase
    class F,G,R,S,JJ,KK commandState
    class XX,ZZ,BBB,DDD,V,NN,UU bridgeEvent
    class E,K errorState
```

## Key Findings

### 1. When are slash commands registered in Rocket.Chat?

Slash commands become visible to users through this sequence:

1. **App Installation**: Commands are added during `App.initialize()` via `ConfigurationExtend.slashCommands.provideSlashCommand()`
2. **Storage Phase**: Commands are stored in `AppSlashCommandManager.providedCommands` but **NOT yet registered** in the Rocket.Chat system
3. **App Enabling**: When `App.onEnable()` returns `true`, `AppManager.enableApp()` calls `CommandManager.registerCommands()`
4. **Bridge Registration**: `CommandBridge.doRegisterCommand()` is called for each non-disabled command
5. **Visibility**: Only after successful bridge registration do commands become visible and executable by users

**Critical Point**: Commands are **NOT** visible to users immediately upon installation. They only become visible after the app is successfully enabled and the bridge registration completes.

### 2. Bridge Activation Events

The apps engine triggers these notifications through `AppActivationBridge`:

| App Lifecycle Event | Bridge Method Called | When It Occurs |
|-------------------|---------------------|----------------|
| App Installation | `doAppAdded(app)` | After app is installed and stored |
| App Update | `doAppUpdated(app)` | After app is updated |
| App Status Change | `doAppStatusChanged(app, status)` | When app is enabled/disabled/status changes |
| App Removal | `doAppRemoved(app)` | When app is uninstalled |

**Note**: The apps-engine framework does **NOT** have specific `command/added` or `command/removed` events. Instead, command lifecycle is tied to app lifecycle events through the `AppActivationBridge`.

### 3. Command States

Each `AppSlashCommand` has three key states:

- **`isRegistered`**: Whether the command is registered in the Rocket.Chat system
- **`isEnabled`**: Whether the command is enabled (can be set even if not registered)
- **`isDisabled`**: Whether the command is disabled (can be set even if not registered)

State transitions:
- **Initial**: `isRegistered=false, isEnabled=false, isDisabled=false`
- **After successful registration**: `isRegistered=true, isEnabled=true, isDisabled=false`
- **After unregistration**: `isRegistered=false` (other states may persist)

### 4. Command Ownership and Touch Rules

- Apps can only modify commands they "own" or system commands not touched by other apps
- First app to touch a command gets exclusive control
- Commands can be provided, modified, enabled, or disabled by the owning app
- Modified system commands are tracked separately from provided commands