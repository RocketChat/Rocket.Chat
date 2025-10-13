# Experimental Features - Administrator Guide

> 📋 This guide is for Rocket.Chat workspace administrators managing apps with experimental features.

## Table of Contents

1. [Overview](#overview)
2. [System Settings](#system-settings)
3. [Managing Experimental Features](#managing-experimental-features)
4. [Monitoring and Alerts](#monitoring-and-alerts)
5. [Security Considerations](#security-considerations)
6. [Troubleshooting](#troubleshooting)
7. [Risk Management](#risk-management)

---

## Overview

### What Are Experimental Features?

Experimental features are unstable APIs that Rocket.Chat Apps can use to access functionality that:

- Is still under development
- May change without notice
- May be removed in future versions
- Has not been fully tested in production

### Why Allow Experimental Features?

**Benefits**:
- Access to cutting-edge functionality
- Early access to new capabilities
- Ability to provide feedback to Rocket.Chat team
- Competitive advantage for your workspace

**Risks**:
- Apps may break after updates
- Potential stability issues
- Limited support
- Security concerns with untested code

### Default Configuration

By default, experimental features are **ENABLED** to maintain backward compatibility. You can disable them at any time.

---

## System Settings

### Accessing Settings

Navigate to: **Administration → Apps → Experimental Features**

### Available Settings

#### 1. Enable Experimental App Features

**Setting**: `Apps_Experimental_Enabled`  
**Type**: Boolean  
**Default**: `true`

**Description**: Global kill switch for all experimental features.

**When disabled**:
- ❌ All experimental API calls will fail
- ❌ Apps using experimental features will have reduced functionality
- ✅ Existing apps continue to run (stable features work)
- ✅ New apps can be installed (but experimental features won't work)

**Use case**: 
- Production environments requiring maximum stability
- After experiencing issues with experimental features
- Compliance requirements prohibiting untested features

**Impact**:
```
High Impact ⚠️
- May break functionality in apps that rely on experimental features
- Users may see errors or missing features
- Some apps may stop working entirely if they depend heavily on experimental APIs
```

---

#### 2. Allowed Experimental Features

**Setting**: `Apps_Experimental_AllowedFeatures`  
**Type**: Multi-select  
**Default**: `[]` (empty = all features allowed)

**Description**: Whitelist specific experimental features.

**Configuration**:

- **Empty list** (default): All experimental features are allowed
- **With entries**: Only listed features are allowed

**Example configurations**:

```yaml
# Allow all features (default)
Apps_Experimental_AllowedFeatures: []

# Allow only specific features
Apps_Experimental_AllowedFeatures: 
  - feature-alpha
  - feature-beta

# Allow none (alternative to global disable)
Apps_Experimental_AllowedFeatures: [] # but set to prevent any additions
```

**Use case**:
- Granular control over which features to enable
- Allowing only well-tested experimental features
- Gradually rolling out new features

**Impact**:
```
Medium Impact ⚠️
- Affects only experimental features not in the list
- More granular than global disable
- Easier to troubleshoot specific feature issues
```

---

#### 3. Log Experimental Feature Usage

**Setting**: `Apps_Experimental_LogUsage`  
**Type**: Boolean  
**Default**: `true`

**Description**: Log all experimental API calls to database and log files.

**When enabled**:
- ✅ All experimental API calls are logged
- ✅ Usage statistics are collected
- ✅ Audit trail is maintained
- ✅ Can identify which apps use which features

**When disabled**:
- ❌ No usage tracking
- ❌ Harder to audit experimental feature usage
- ✅ Slightly better performance
- ✅ Less database storage used

**Use case**:
- Compliance requirements for audit trails
- Understanding which apps use experimental features
- Troubleshooting issues
- Performance optimization (disable if needed)

**Impact**:
```
Low Impact ℹ️
- Minimal performance overhead
- Recommended to keep enabled for production
```

---

#### 4. Notify Admins of Experimental Usage

**Setting**: `Apps_Experimental_NotifyAdmins`  
**Type**: Boolean  
**Default**: `true`

**Description**: Send notifications to admins when experimental features are used.

**Notifications include**:
- 📧 First use of an experimental feature by an app
- ⚠️ Deprecation warnings
- 🚨 Removal notices
- 📊 Weekly usage summaries (optional)

**When enabled**:
- ✅ Admins are informed about experimental usage
- ✅ Early warning about deprecations
- ✅ Can proactively manage risks

**When disabled**:
- ❌ No automatic notifications
- ✅ Reduces notification fatigue
- ⚠️ May miss important deprecation warnings

**Use case**:
- Active monitoring of experimental features
- Large workspaces with dedicated app administrators
- Disable if notification volume is too high

**Impact**:
```
Low Impact ℹ️
- Only affects notifications
- Does not impact functionality
- Recommended to keep enabled
```

---

## Managing Experimental Features

### Installation Workflow

When a user attempts to install an app using experimental features:

#### Step 1: Warning Modal

A modal dialog appears showing:

```
⚠️ Experimental Features Warning

This app uses experimental features:
• feature-alpha (Alpha - Unstable)
• feature-beta (Beta - Mostly stable)

⚠️ Important:
• These features may break in future updates
• They may be removed without notice
• Limited support is available
• Your workspace stability may be affected

[ ] I understand the risks and want to proceed

[Cancel]  [Install Anyway]
```

#### Step 2: Settings Check

System checks:
1. ✅ Are experimental features enabled globally?
2. ✅ Are the specific features in the allowed list?
3. ✅ Does the app have required permissions?

If any check fails, installation is blocked with an error message.

#### Step 3: Installation

If approved:
- App is installed
- Experimental usage is marked in the database
- Admin notification is sent (if enabled)
- Badge appears on the app in the admin panel

### Identifying Apps Using Experimental Features

#### In the Admin Panel

Apps using experimental features display a badge:

```
[App Icon] My Cool App  v1.2.0
           🔬 Experimental Features

Hover for details:
• feature-alpha (Alpha)
• feature-beta (Beta)
```

Badge colors:
- 🔴 **Red (Alpha)**: Unstable, breaking changes expected
- 🟠 **Orange (Beta)**: Mostly stable, minor changes possible
- 🟡 **Yellow (Deprecated)**: Feature being removed

#### Via API

Query apps using experimental features:

```javascript
// Get all apps with experimental features
const appsWithExperimental = Apps.find({ 
    uses_experimental: true 
}).fetch();

// Get usage details
const usage = AppsExperimentalUsage.find({
    app_id: 'some-app-id'
}).fetch();
```

#### In Logs

Search logs for experimental usage:

```bash
# In server logs
grep "EXPERIMENTAL" logs/server.log

# In app-specific logs
# Administration → Apps → [App Name] → Logs
# Filter by "EXPERIMENTAL"
```

---

## Monitoring and Alerts

### Built-in Monitoring

#### Usage Dashboard

Navigate to: **Administration → Apps → Experimental Features → Usage**

View:
- 📊 Total experimental API calls
- 📱 Apps using experimental features
- 🔧 Most-used experimental features
- 📈 Usage trends over time

#### Alerts

Automatic alerts for:

1. **New Experimental Usage**
   - When: An app first uses an experimental feature
   - Who: All workspace admins
   - Where: Admin panel notification + email (optional)

2. **Deprecation Warnings**
   - When: An experimental feature is deprecated
   - Who: Admins and app owners
   - Where: Admin panel banner + email

3. **Removal Notices**
   - When: An experimental feature is removed
   - Who: All workspace admins
   - Where: Admin panel alert + email
   - Content: List of affected apps

4. **Breaking Changes**
   - When: Apps-Engine is updated with breaking changes
   - Who: Admins and app owners
   - Where: Update screen warning

### External Monitoring

#### Webhook Integration

Configure webhooks to receive notifications:

```javascript
// Administration → Integrations → Webhooks
// Create webhook for experimental feature events

{
  "event": "experimental-feature-deprecated",
  "feature_id": "feature-alpha",
  "deprecated_in": "1.62.0",
  "removal_in": "1.66.0",
  "affected_apps": ["app-1", "app-2"]
}
```

#### API Access

Query experimental usage via REST API:

```bash
# Get experimental usage statistics
GET /api/v1/apps/experimental/usage
Authorization: Bearer YOUR_TOKEN

# Get apps using experimental features
GET /api/v1/apps?experimental=true
Authorization: Bearer YOUR_TOKEN
```

---

## Security Considerations

### Risk Assessment

Experimental features may:

- ❌ Have undiscovered security vulnerabilities
- ❌ Lack proper input validation
- ❌ Have insufficient access controls
- ❌ Expose sensitive data unintentionally

### Security Best Practices

#### 1. Principle of Least Privilege

Only enable experimental features when necessary:

```yaml
# Start restrictive
Apps_Experimental_Enabled: false

# Enable only when needed
Apps_Experimental_Enabled: true
Apps_Experimental_AllowedFeatures: [feature-beta] # Only allow tested features
```

#### 2. Regular Audits

Periodically review:
- Which apps use experimental features
- Usage frequency and patterns
- Any suspicious activity
- Apps that haven't been updated in a while

```bash
# Monthly audit checklist
□ Review apps with experimental features
□ Check for deprecated features still in use
□ Verify all apps are up to date
□ Review experimental usage logs
□ Check for security advisories
```

#### 3. Testing in Non-Production

Before enabling experimental features in production:

1. Test in staging environment
2. Monitor for issues
3. Verify app behavior
4. Check performance impact
5. Review logs for errors

#### 4. Access Control

Limit who can install apps with experimental features:

```yaml
# Administration → Permissions → Apps
# Restrict "Install App" permission to trusted users only
```

#### 5. Network Isolation

If possible, isolate apps using experimental features:

- Separate workspace for testing
- Limited access to production data
- Restricted network access

---

## Troubleshooting

### Common Issues

#### Issue 1: App Stopped Working After Update

**Symptoms**:
- App errors after Apps-Engine update
- Features missing or broken
- Error logs show experimental feature failures

**Diagnosis**:
```bash
# Check app logs
Administration → Apps → [App Name] → Logs
Filter: "EXPERIMENTAL" or "ERROR"

# Check which features the app uses
Apps.findOne({id: 'app-id'}).experimental.features
```

**Solution**:
1. Check release notes for breaking changes
2. Contact app developer for update
3. Temporarily disable experimental features for this app
4. Roll back to previous Apps-Engine version (if critical)

---

#### Issue 2: Cannot Install App with Experimental Features

**Symptoms**:
- Installation blocked
- Error: "Experimental features disabled"

**Diagnosis**:
```bash
# Check settings
Administration → Apps → Experimental Features

# Verify:
Apps_Experimental_Enabled: ?
Apps_Experimental_AllowedFeatures: ?
```

**Solution**:
1. Enable experimental features globally, OR
2. Add required features to allowed list

---

#### Issue 3: Too Many Notifications

**Symptoms**:
- Notification overload
- Email spam about experimental usage

**Solution**:

**Option A**: Disable notifications
```yaml
Apps_Experimental_NotifyAdmins: false
```

**Option B**: Configure notification filters
```yaml
# Only notify for:
# - Deprecations
# - Removals
# - Critical issues
# (not for regular usage)
```

---

#### Issue 4: Performance Degradation

**Symptoms**:
- Slow response times
- High database load
- Server resource usage increased

**Diagnosis**:
```bash
# Check experimental usage logging
Apps_Experimental_LogUsage: ?

# Check database size
db.apps_experimental_usage.stats()

# Check most active features
db.apps_experimental_usage.aggregate([
  {$group: {_id: "$feature_id", count: {$sum: "$call_count"}}},
  {$sort: {count: -1}}
])
```

**Solution**:
1. Disable usage logging if not needed
2. Archive old usage data
3. Optimize database indexes
4. Disable specific high-usage features

---

### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `ExperimentalFeatureDisabledError` | Experimental features disabled globally | Enable in settings or contact admin |
| `PermissionDeniedError: experimental.access` | App missing base permission | Grant permission or reinstall app |
| `FeatureNotAllowedError` | Feature not in allowed list | Add feature to allowed list |
| `FeatureDeprecatedError` | Using deprecated feature | Update app or prepare for migration |
| `FeatureRemovedError` | Feature has been removed | Update app or uninstall |

---

## Risk Management

### Risk Levels

#### Low Risk ✅

- **Scenario**: Using Beta experimental features in testing environment
- **Controls**: 
  - Enabled: `Apps_Experimental_Enabled: true`
  - Monitoring: `Apps_Experimental_LogUsage: true`
  - Notifications: `Apps_Experimental_NotifyAdmins: true`
- **Recommendation**: Safe to proceed

#### Medium Risk ⚠️

- **Scenario**: Using Beta experimental features in production
- **Controls**:
  - Allowed list: Only specific features
  - Active monitoring
  - Backup and rollback plan
  - Regular app updates
- **Recommendation**: Acceptable with proper monitoring

#### High Risk 🔴

- **Scenario**: Using Alpha experimental features in production
- **Controls**:
  - Very limited allowed list
  - Constant monitoring
  - Immediate rollback capability
  - Dedicated support resources
  - User communication plan
- **Recommendation**: Avoid unless critical business need

#### Critical Risk 🚨

- **Scenario**: Using deprecated experimental features in production
- **Controls**:
  - **IMMEDIATE ACTION REQUIRED**
  - Develop migration plan
  - Schedule app updates
  - Communicate with users
  - Prepare for feature removal
- **Recommendation**: Migrate away immediately

---

### Risk Mitigation Strategies

#### Strategy 1: Staged Rollout

```
Phase 1: Testing
├─ Enable in test workspace
├─ Monitor for 2 weeks
└─ Verify stability

Phase 2: Limited Production
├─ Enable for specific teams
├─ Monitor for 1 month
└─ Gather feedback

Phase 3: Full Production
├─ Enable globally
└─ Continue monitoring
```

#### Strategy 2: Feature-Specific Enablement

```yaml
# Start with empty allowed list
Apps_Experimental_AllowedFeatures: []

# Add features one at a time
# Week 1: Add feature-beta (more stable)
Apps_Experimental_AllowedFeatures: [feature-beta]

# Week 4: Add feature-alpha (if feature-beta is stable)
Apps_Experimental_AllowedFeatures: [feature-beta, feature-alpha]
```

#### Strategy 3: Automated Monitoring and Alerting

```javascript
// Set up automated checks
const checkExperimentalFeatures = async () => {
  const apps = await Apps.find({ uses_experimental: true });
  
  for (const app of apps) {
    // Check if app is up to date
    // Check if features are deprecated
    // Alert if action needed
  }
};

// Run daily
cron.schedule('0 9 * * *', checkExperimentalFeatures);
```

---

## Best Practices Checklist

### Before Enabling Experimental Features

- [ ] Review which apps need experimental features
- [ ] Understand the risks and benefits
- [ ] Test in non-production environment first
- [ ] Ensure monitoring is in place
- [ ] Enable logging and notifications
- [ ] Have rollback plan ready
- [ ] Communicate with stakeholders

### After Enabling Experimental Features

- [ ] Monitor usage regularly
- [ ] Review logs weekly
- [ ] Keep apps up to date
- [ ] Watch for deprecation notices
- [ ] Audit quarterly
- [ ] Review security advisories
- [ ] Update documentation

### During Apps-Engine Updates

- [ ] Read release notes carefully
- [ ] Check for breaking changes
- [ ] Test in staging first
- [ ] Verify affected apps
- [ ] Plan for migration if needed
- [ ] Communicate with users
- [ ] Have rollback plan

---

## Additional Resources

- [Developer Documentation](./EXPERIMENTAL_FEATURES.md)
- [Implementation Plan](../../../EXPERIMENTAL_API_FRAMEWORK_PLAN.md)
- [API Diagrams](../../../EXPERIMENTAL_API_DIAGRAMS.md)
- [Security Guidelines](./SECURITY.md)
- [Support Portal](https://rocket.chat/support)

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-13  
**For**: Rocket.Chat Workspace Administrators  
**Applies to**: Apps-Engine v1.56.0+
