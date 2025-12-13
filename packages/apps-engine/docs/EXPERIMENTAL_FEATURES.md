# Experimental Features in Rocket.Chat Apps

> ⚠️ **Warning**: Experimental features are unstable and may change or be removed without notice. Use at your own risk.

## Table of Contents

1. [What are Experimental Features?](#what-are-experimental-features)
2. [Why Use Experimental Features?](#why-use-experimental-features)
3. [Risks and Considerations](#risks-and-considerations)
4. [How to Use Experimental Features](#how-to-use-experimental-features)
5. [Permission Requirements](#permission-requirements)
6. [Available Experimental Features](#available-experimental-features)
7. [Best Practices](#best-practices)
8. [FAQ](#faq)
9. [Support Policy](#support-policy)

---

## What are Experimental Features?

Experimental features are APIs and functionalities that are:

- **In active development**: Still being refined and improved
- **Subject to change**: May have breaking API changes between versions
- **Not yet stable**: May contain bugs or performance issues
- **Potentially temporary**: May be removed if they don't meet requirements
- **Early access**: Available before official release

Experimental features live in the **ExperimentalBridge** and are clearly marked with `@experimental` tags in documentation.

### Feature Lifecycle

```
Proposal → Alpha → Beta → Stable (or Removed)
   ↓         ↓       ↓         ↓
 Design   Unstable  Mostly  Production
          Breaking  Stable   Ready
          Changes
```

**Minimum timeline**: 4+ versions from Alpha introduction to removal

---

## Why Use Experimental Features?

### Benefits

✅ **Early Access**: Try new capabilities before general release  
✅ **Influence Development**: Provide feedback to shape the final API  
✅ **Competitive Advantage**: Build features competitors can't yet  
✅ **Innovation**: Experiment with cutting-edge functionality  

### Use Cases

- **Prototyping**: Testing new app concepts
- **Pilot Programs**: Limited rollout to specific users
- **Research & Development**: Exploring new possibilities
- **Beta Testing**: Early adopters helping validate features

---

## Risks and Considerations

### ⚠️ Breaking Changes

Experimental features can have breaking changes in **any version update**:

- Method signatures may change
- Return types may be modified
- Behavior may be altered
- Features may be removed entirely

### 🔧 Stability

- May contain bugs
- Performance not optimized
- Error handling may be incomplete
- Documentation may be limited

### 📦 Support

- **Community support only** during Alpha/Beta
- **Not covered by SLAs**
- **No guaranteed migration path** if removed
- **Your responsibility to monitor changes**

### 🏢 Production Use

**Not recommended for production apps** unless:

- You have a fallback plan
- You actively monitor release notes
- You can update your app quickly
- Users are aware of potential issues

---

## How to Use Experimental Features

### Step 1: Declare Experimental Usage in app.json

```json
{
  "id": "your-app-id",
  "name": "Your App Name",
  "version": "1.0.0",
  "requiredApiVersion": "^1.56.0",
  "permissions": [
    {
      "name": "experimental.access"
    },
    {
      "name": "experimental.feature-alpha"
    }
  ],
  "experimental": {
    "features": ["feature-alpha"],
    "acknowledgedRisks": true,
    "version": "1.56.0"
  }
}
```

### Step 2: Access Experimental APIs in Your Code

```typescript
import {
    IApp,
    IRead,
    IModify,
    IHttp,
    IPersistence,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';

export class YourApp extends App {
    public async executeCommand(
        context: ISlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<void> {
        // Access experimental features
        const experimental = modify.getExperimental();
        
        try {
            // Use experimental feature
            const result = await experimental.executeFeatureAlpha({
                param1: 'value1',
                param2: 'value2',
            });
            
            // Handle result
            console.log('Experimental feature result:', result);
        } catch (error) {
            if (error.name === 'ExperimentalFeatureDisabledError') {
                // Feature is disabled in system settings
                console.error('Experimental features are disabled');
                // Implement fallback behavior
            } else if (error.name === 'PermissionDeniedError') {
                // Missing required permission
                console.error('Missing experimental permission');
            } else {
                // Other errors
                console.error('Error using experimental feature:', error);
            }
        }
    }
}
```

### Step 3: Handle Errors Gracefully

Always implement proper error handling:

```typescript
async function useExperimentalFeature(modify: IModify) {
    const experimental = modify.getExperimental();
    
    // Check if feature is available
    const isAvailable = await experimental.isFeatureAvailable('feature-alpha');
    
    if (!isAvailable) {
        // Feature not available - use fallback
        return await fallbackImplementation();
    }
    
    try {
        return await experimental.executeFeatureAlpha(data);
    } catch (error) {
        // Log error
        console.error('Experimental feature failed:', error);
        
        // Use fallback
        return await fallbackImplementation();
    }
}

async function fallbackImplementation() {
    // Implement alternative using stable APIs
    // ...
}
```

---

## Permission Requirements

### Base Permission

**All experimental features require**:

```json
{
  "name": "experimental.access",
  "required": true
}
```

This is the gateway permission. Without it, no experimental features can be used.

### Feature-Specific Permissions

Each experimental feature has its own permission:

```json
{
  "permissions": [
    { "name": "experimental.access" },
    { "name": "experimental.feature-alpha" },
    { "name": "experimental.feature-beta" }
  ]
}
```

### Permission Checking

Permissions are checked at **runtime** for every API call:

1. ✅ `experimental.access` - Gateway permission
2. ✅ `experimental.feature-X` - Feature-specific permission
3. ✅ System settings - Global and per-feature toggles
4. ✅ Feature availability - Version compatibility

**All checks must pass** for the API call to succeed.

---

## Available Experimental Features

> 📝 This section is updated with each Apps-Engine release

### Currently Available

#### feature-alpha (Status: Alpha)

**Introduced**: v1.56.0  
**Permission**: `experimental.feature-alpha`  
**Status**: 🔬 Alpha - Unstable, breaking changes expected

**Description**: [Brief description of what this feature does]

**API**:
```typescript
interface IExperimentalModify {
    executeFeatureAlpha(params: FeatureAlphaParams): Promise<FeatureAlphaResult>;
}

interface FeatureAlphaParams {
    // Parameters
}

interface FeatureAlphaResult {
    // Result structure
}
```

**Example**:
```typescript
const result = await modify.getExperimental().executeFeatureAlpha({
    // params
});
```

**Known Issues**:
- Issue 1
- Issue 2

**Breaking Changes**:
- v1.58.0: Changed parameter structure
- v1.57.0: Initial release

---

#### feature-beta (Status: Beta)

**Introduced**: v1.57.0  
**Permission**: `experimental.feature-beta`  
**Status**: ⚠️ Beta - Mostly stable, minor changes possible

**Description**: [Brief description of what this feature does]

**API**:
```typescript
interface IExperimentalModify {
    executeFeatureBeta(params: FeatureBetaParams): Promise<FeatureBetaResult>;
}
```

**Graduation Timeline**: Expected stable in v1.62.0

---

### Deprecated Features

#### feature-old (Status: Deprecated)

**Introduced**: v1.50.0  
**Deprecated**: v1.58.0  
**Removal**: v1.62.0  
**Replaced By**: Standard API in MessageBridge

**Migration Guide**: [Link to migration documentation]

---

### Removed Features

Features removed in recent versions:

| Feature ID | Removed In | Replacement |
|-----------|-----------|-------------|
| feature-experimental-1 | v1.55.0 | MessageBridge.sendMessage() |

---

## Best Practices

### 1. Always Have a Fallback

```typescript
async function robustFeatureUsage(modify: IModify) {
    try {
        // Try experimental feature
        if (await modify.getExperimental().isFeatureAvailable('feature-alpha')) {
            return await modify.getExperimental().executeFeatureAlpha(data);
        }
    } catch (error) {
        console.warn('Experimental feature failed, using fallback', error);
    }
    
    // Fallback to stable APIs
    return await stableImplementation();
}
```

### 2. Check Feature Availability

```typescript
// Check before using
const available = await read.getExperimental().isFeatureAvailable('feature-alpha');

if (available) {
    // Use feature
} else {
    // Use alternative
}
```

### 3. Monitor Your App's Logs

Experimental API calls are logged. Monitor these logs to:
- Track usage patterns
- Detect errors early
- Identify deprecation warnings

### 4. Stay Updated

- **Subscribe to release notes**
- **Monitor the Apps-Engine changelog**
- **Join community discussions**
- **Test against beta releases**

### 5. Communicate with Users

If your app uses experimental features:

```typescript
// In your app's README or description
/**
 * ⚠️ EXPERIMENTAL FEATURES
 * 
 * This app uses experimental Rocket.Chat APIs that may change.
 * 
 * Experimental features used:
 * - feature-alpha: Advanced search capabilities
 * - feature-beta: Real-time analytics
 * 
 * These features may break in future updates.
 */
```

### 6. Version Pinning

Consider pinning your `requiredApiVersion` to avoid automatic breakage:

```json
{
  "requiredApiVersion": "^1.56.0"  // ✅ Allows minor updates
  // vs
  "requiredApiVersion": "~1.56.0"  // ⚠️ More restrictive
}
```

### 7. Comprehensive Error Handling

```typescript
try {
    const result = await experimental.executeFeatureAlpha(data);
    return result;
} catch (error) {
    switch (error.name) {
        case 'ExperimentalFeatureDisabledError':
            // Admin disabled experimental features
            return handleDisabledFeature();
            
        case 'PermissionDeniedError':
            // Missing permission
            return handleMissingPermission();
            
        case 'FeatureDeprecatedError':
            // Feature is deprecated
            console.warn('Feature deprecated:', error.message);
            return await fallbackImplementation();
            
        case 'FeatureRemovedError':
            // Feature was removed
            return await fallbackImplementation();
            
        default:
            // Unexpected error
            console.error('Unexpected error:', error);
            throw error;
    }
}
```

---

## FAQ

### Q: Can I use experimental features in production?

**A**: While technically possible, it's **not recommended** unless:
- You actively monitor release notes
- You can update your app quickly
- You have fallback mechanisms
- Your users are aware of the risks

### Q: Will experimental features ever become stable?

**A**: Some will, some won't. Features that prove valuable and stable will graduate to stable APIs. Others may be removed if they don't meet requirements.

### Q: What happens if an experimental feature is removed?

**A**: 
1. Feature is marked as deprecated (min. 2 versions warning)
2. Admin notifications are sent
3. Feature continues to work but logs warnings
4. After grace period, feature returns error
5. Apps using the feature will break unless updated

### Q: How do I know when experimental features change?

**A**: 
- **Release notes**: Every version includes experimental API changes
- **Deprecation warnings**: Logged when you use deprecated features
- **Admin notifications**: Sent when features are deprecated/removed
- **Community forums**: Announcements posted

### Q: Can I propose new experimental features?

**A**: Yes! Submit an RFC (Request for Comments) to the Rocket.Chat Apps team via:
- GitHub Discussions
- Community Forums
- Developer Chat Channels

### Q: What if my app breaks due to experimental changes?

**A**: 
- **Check release notes** for breaking changes
- **Update your app** to use new API
- **Use fallback** to stable APIs if available
- **Contact support** if you need help migrating

### Q: Are experimental features available in all Rocket.Chat installations?

**A**: They can be **disabled by admins** via system settings. Always check availability at runtime.

### Q: Do experimental features affect Marketplace approval?

**A**: Apps using experimental features may:
- Require additional review
- Have special badges/warnings
- Need extra documentation
- Face stricter update policies

### Q: How do I migrate from experimental to stable?

**A**: When a feature graduates:

1. **Old experimental API** remains available (deprecated)
2. **New stable API** is introduced
3. **Migration guide** is published
4. **Grace period** of 2+ versions
5. **Experimental API** is removed

Example migration:
```typescript
// Old (experimental, deprecated)
await modify.getExperimental().executeFeatureAlpha(data);

// New (stable)
await modify.getCreator().executeFeatureAlpha(data);
```

---

## Support Policy

### Alpha Features

- ❌ No official support
- ❌ No SLA
- ❌ No guaranteed stability
- ✅ Community support
- ✅ Best-effort bug fixes

### Beta Features

- ⚠️ Limited official support
- ❌ No SLA
- ✅ Stability expected
- ✅ Bug fixes prioritized
- ✅ Community + team support

### Stable Features

- ✅ Full official support
- ✅ SLA coverage
- ✅ Guaranteed stability
- ✅ Deprecation policy protection
- ✅ Migration assistance

### Getting Help

1. **Documentation**: Check API docs and examples
2. **Community Forums**: Ask the community
3. **GitHub Issues**: Report bugs
4. **Developer Chat**: Real-time help
5. **Enterprise Support**: (If applicable) Contact support team

---

## Version History

| Version | Changes |
|---------|---------|
| 1.56.0  | Introduced experimental features framework |
| 1.57.0  | Added feature-beta |
| 1.58.0  | Breaking changes to feature-alpha |

---

## Additional Resources

- [Full API Documentation](./API.md)
- [Experimental API Diagrams](../../../EXPERIMENTAL_API_DIAGRAMS.md)
- [Implementation Plan](../../../EXPERIMENTAL_API_FRAMEWORK_PLAN.md)
- [Migration Guides](./migrations/)
- [Example Apps](./examples/experimental/)

---

**Last Updated**: 2025-10-13  
**Applies to**: Apps-Engine v1.56.0+  
**Feedback**: Submit via GitHub Issues or Community Forums
