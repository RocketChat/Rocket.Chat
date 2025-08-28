# Updated Slash Command Lifecycle in Rocket.Chat Apps Engine

This flowchart documents the **modified** behavior of slash commands registered by Rocket.Chat apps, where commands become visible immediately upon installation and remain visible even when apps are disabled.

## Key Changes Made

1. **Commands register during installation** - not during app enabling
2. **Commands remain visible when apps are disabled** - they don't get unregistered
3. **Commands are only removed during app uninstallation**
4. **Disabled apps can still execute commands** - they should handle their disabled state gracefully

## Modified Mermaid Flowchart

```mermaid
graph TD
    subgraph "App Installation Phase"
        A[App Installed] --> B[App.initialize called]
        B --> C[App calls addCommand via ConfigurationExtend]
        C --> D{Command Valid?}
        D -->|No| E[CommandAlreadyExistsError or CommandHasAlreadyBeenTouchedError]
        D -->|Yes| F[Command stored in providedCommands Map]
        F --> G[AppSlashCommand created with isRegistered=false, isEnabled=false, isDisabled=false]
        G --> H[CommandManager.registerCommands called IMMEDIATELY]
        H --> I[Bridge.doRegisterCommand called]
        I --> J[Command registered in Rocket.Chat system]
        J --> K[AppSlashCommand.hasBeenRegistered called]
        K --> L[isRegistered=true, isEnabled=true, isDisabled=false]
        L --> M[Command becomes visible to users IMMEDIATELY]
    end

    subgraph "App Enabling Phase"
        N[App Enable Requested] --> O[App.onEnable called]
        O --> P{onEnable returns true?}
        P -->|No| Q[App remains disabled - BUT commands stay visible]
        P -->|Yes| R[AppManager.enableApp called]
        R --> S[Other components registered - APIs, listeners, etc.]
        S --> T[App status = ENABLED]
        
        %% Status change notification
        R --> U[ProxiedApp.setStatus called]
        U --> V[AppActivationBridge.doAppStatusChanged called]
        V --> W[External systems notified of app status change]
    end

    subgraph "Command Execution with Disabled Apps"
        M --> X{User executes command}
        X --> Y[CommandManager.executeCommand called]
        Y --> Z{App exists?}
        Z -->|No| AA[Command execution aborted]
        Z -->|Yes| BB{App Status Check}
        BB -->|Enabled| CC[Normal command execution]
        BB -->|Disabled| DD[App receives execution request but is disabled]
        DD --> EE[App can check its own status and respond appropriately]
        EE --> FF[App may show disabled message or handle gracefully]
        CC --> GG[Command execution result returned to user]
        FF --> GG
    end

    subgraph "App Disabling Phase - COMMANDS REMAIN VISIBLE"
        HH[App Disable Requested] --> II[AppManager.disable called]
        II --> JJ[Other components unregistered - APIs, listeners, etc.]
        JJ --> KK[App status = DISABLED]
        KK --> LL[Commands REMAIN registered and visible]
        LL --> MM[Users can still see and execute commands]
        
        %% Status change notification
        II --> NN[ProxiedApp.setStatus called]
        NN --> OO[AppActivationBridge.doAppStatusChanged called]
        OO --> PP[External systems notified of app status change]
    end

    subgraph "App Update Phase"
        QQ[App Update Requested] --> RR[Existing commands unregistered temporarily]
        RR --> SS[App updated with new code]
        SS --> TT[CommandManager.registerCommands called]
        TT --> UU[New/updated commands registered immediately]
        UU --> VV[Commands visible with updated behavior]
    end

    subgraph "App Removal Phase - ONLY TIME COMMANDS ARE REMOVED"
        WW[App Uninstall Requested] --> XX[AppManager.remove called]
        XX --> YY[App disabled if enabled]
        YY --> ZZ[CommandManager.unregisterCommands called]
        ZZ --> AAA[Commands removed from Rocket.Chat system]
        AAA --> BBB[Commands no longer visible to users]
        BBB --> CCC[AppActivationBridge.doAppRemoved called]
        CCC --> DDD[External systems notified of app removal]
        DDD --> EEE[App completely removed from system]
    end

    subgraph "Bridge Events & Notifications"
        FFF[App Added] --> GGG[AppActivationBridge.doAppAdded]
        HHH[App Updated] --> III[AppActivationBridge.doAppUpdated]
        JJJ[App Status Changed] --> KKK[AppActivationBridge.doAppStatusChanged]
        LLL[App Removed] --> MMM[AppActivationBridge.doAppRemoved]
    end

    %% Connect the phases
    M --> N
    M --> HH
    LL --> WW
    
    %% Connect notifications
    A --> FFF
    R --> JJJ
    II --> JJJ
    QQ --> HHH
    XX --> LLL

    %% Styling
    classDef appPhase fill:#e1f5fe
    classDef commandState fill:#f3e5f5
    classDef bridgeEvent fill:#fff3e0
    classDef errorState fill:#ffebee
    classDef newBehavior fill:#e8f5e8
    
    class A,B,C,N,O,R,HH,II,WW,XX appPhase
    class F,G,L,M,LL,BBB commandState
    class GGG,III,KKK,MMM,W,PP,DDD bridgeEvent
    class E,Q errorState
    class H,I,J,K,DD,EE,FF,TT,UU,ZZ,AAA newBehavior
```

## Summary of Changes Made

### 1. Modified Files and Methods

#### AppManager.ts
- **`add()` method**: Added `await this.commandManager.registerCommands(app.getID());` after installation
- **`purgeAppConfig()` method**: Commented out `await this.commandManager.unregisterCommands(app.getID());`
- **`enableApp()` method**: Commented out command registration (now happens during installation)
- **`removeLocal()` method**: Added explicit command unregistration during app removal
- **`updateAndStartupLocal()` and `updateAndInitializeLocal()` methods**: Added command registration after updates

#### AppSlashCommandManager.ts
- **`executeCommand()` method**: Removed app disabled check - now allows execution for disabled apps
- **`getPreviews()` method**: Removed app disabled check - now allows preview generation for disabled apps
- **`executePreview()` method**: Removed app disabled check - now allows preview execution for disabled apps
- **`shouldCommandFunctionsRun()` method**: Updated comments to clarify that this checks command-level disable, not app status disable

### 2. New Behavior Summary

| Event | Old Behavior | New Behavior |
|-------|-------------|-------------|
| **App Installation** | Commands stored but not visible | Commands immediately registered and visible |
| **App Enabling** | Commands registered and become visible | Commands already visible, only other components registered |
| **App Disabling** | Commands unregistered and hidden | Commands remain visible and executable |
| **App Execution (Disabled)** | Commands not executable | Commands executable, app handles disabled state |
| **App Uninstallation** | Commands unregistered | Commands unregistered (only time they're removed) |

### 3. Benefits of New Approach

1. **Better User Experience**: Commands are immediately available after app installation
2. **Consistency**: Commands remain available even if app is temporarily disabled
3. **Graceful Degradation**: Apps can handle their disabled state and inform users appropriately
4. **Simpler State Management**: Commands lifecycle is decoupled from app enable/disable lifecycle

### 4. App Developer Considerations

Apps should now:
- Check their own status when commands are executed
- Provide appropriate feedback when disabled (e.g., "This app is currently disabled")
- Handle graceful degradation in their command handlers
- Be aware that commands remain visible even when the app is disabled

The modified implementation provides a more user-friendly experience where slash commands remain consistently available while still allowing apps to handle their disabled state appropriately.