# Medsense Webchat – Quick Dev & Deploy Notes

## Local Dev (WSL)
- Start local Mongo/NATS (WSL-backed, ports on localhost):  
  `cd ~/medsense.webchat`  
  `docker compose -f deployment/docker-compose.localdeps.yml up -d`
- Run the app (from repo root):  
  ```
  cd ~/medsense.webchat
  MONGO_URL="mongodb://127.0.0.1:27017/rocketchat?replicaSet=rs0" \
  MONGO_OPLOG_URL="mongodb://127.0.0.1:27017/local?replicaSet=rs0" \
  TRANSPORTER="monolith+nats://127.0.0.1:4222" \
  yarn dsv
  ```
- If Mongo errors about `ENOTFOUND mongo`, reconfig RS host inside Mongo:  
  `sudo docker exec -it deployment-mongo-1 mongosh --quiet --eval 'cfg=rs.conf(); cfg.members[0].host="127.0.0.1:27017"; rs.reconfig(cfg,{force:true});'`

## CI/CD (essentials)
- Build app image (from repo root):  
  `docker build -f Dockerfile.medsense-final -t dockerfriend1234/medsense-pharmacy-chat:sha-<gitsha> .`
- Push to Docker Hub:  
  `docker push dockerfriend1234/medsense-pharmacy-chat:sha-<gitsha>`
- Deploy to droplet (only restart app, keep Mongo/NATS):  
  `ssh <droplet>`  
  `cd /opt/rocketchat/rocketchat-compose/generated`  
  ```
  docker login -u dockerfriend1234
  docker compose -p rocketchat-compose pull rocketchat
  docker compose -p rocketchat-compose up -d --no-deps rocketchat
  ```
  (Deploy script `deploy-to-droplet.sh` can do the same; it now uses `docker compose` + `--no-deps`.)

## Private App (Clinical Actions)
- Updated package with role gating (admin/manager/agent only): `D:\medsense-chat-local\clinical-actions-app\dist\clinical-actions_0.0.15.zip`
- Install via Admin → Apps → Upload; only allowed roles will see/use the UI.

---

## Native Meteor App Flow (RC Source of Truth)
- **UI**: Use the native Rocket.Chat Meteor web app (regular rooms), not the livechat widget.
- **Message flow**:
  1) User sends message in RC room
  2) RC **Outgoing Webhook** posts payload to orchestrator (not Omnichannel webhook)
  3) Orchestrator replies via RC REST API (`/api/v1/chat.postMessage`)
  4) RC room shows the bot response (web app displays it naturally)
- **Key rule**: **Do not** use orchestrator `/send_message` from the web app when RC is the source of truth.
- **Loop prevention**: Orchestrator must ignore messages from `RC_BOT_USERNAME`.
- **Typing indicator**: Emit `user-activity` with `user-typing` for the bot (DDP `stream-notify-room` or internal endpoint) to show native typing dots.
- **Custom QA boxes**: Use Apps-Engine + UI Kit blocks in room messages for buttons/selects; app forwards answers to orchestrator.

---

## Rocket.Chat Telemetry & Branding Assessment

**Assessment Date**: 2025-12-19
**Codebase**: `/home/builder/medsense.webchat` (WSL Ubuntu)
**Version**: Rocket.Chat v7.14.0-develop monorepo

### TELEMETRY SYSTEMS IDENTIFIED

#### 1. External Data Transmission
- **Endpoint**: `https://collector.rocket.chat/`
- **File**: `apps/meteor/app/statistics/server/functions/sendUsageReport.ts`
- **Method**: POST with Bearer token authentication
- **Data**: User counts, room stats, deployment info, system version
- **Auth**: `apps/meteor/app/cloud/server/functions/getWorkspaceAccessToken.ts`

#### 2. REST API Telemetry Endpoints
- `POST /v1/statistics.telemetry` - Client telemetry submission (`apps/meteor/app/api/server/v1/stats.ts`)
- `GET /v1/statistics` - Current server statistics
- `GET /v1/statistics.list` - Historical statistics with pagination

#### 3. Telemetry Event System
- **Interface**: `packages/core-services/src/types/ITelemetryEvent.ts`
- **Handler**: `apps/meteor/app/statistics/server/lib/telemetryEvents.ts` (lines 9-19)
- **Event Types**:
  - `otrStats` - OTR encryption tracking (`apps/meteor/app/statistics/server/functions/otrStats.ts`)
  - `slashCommandsStats` - Slash command usage (`apps/meteor/app/statistics/server/functions/slashCommandsStats.ts`)
  - `updateCounter` - Settings counters (`apps/meteor/app/statistics/server/functions/updateStatsCounter.ts`)

#### 4. Statistics Collection
- **File**: `apps/meteor/app/statistics/server/lib/statistics.ts`
- **Collects**: User counts, room stats, language prefs, deployment fingerprint, workspace registration

#### 5. Analytics Database (MongoDB)
- **Model**: `packages/models/src/models/Analytics.ts`
- **Collection**: `analytics`
- **Tracks**: Message sending, user activity, message deletion
- **Logging**:
  - Messages: `apps/meteor/ee/server/lib/engagementDashboard/messages.ts`
  - Users: `apps/meteor/ee/server/lib/engagementDashboard/users.ts`

#### 6. Client-Side Telemetry
- **Hook**: `apps/meteor/client/views/root/hooks/useAnalyticsEventTracking.ts`
- **Integrations**: Piwik (`_paq`), Google Analytics (`ga`)
- **Events**: Page views, login/logout, messages, room changes, user registration, status changes
- **Mutation**: `apps/meteor/client/views/audit/hooks/useSendTelemetryMutation.ts`
- **Client Calls**:
  - `apps/meteor/client/lib/chats/flows/processSlashCommand.ts`
  - `apps/meteor/client/views/omnichannel/contactInfo/AdvancedContactModal.tsx`
  - `apps/meteor/client/views/admin/users/AdminUserForm.tsx`
  - `apps/meteor/client/views/admin/engagementDashboard/EngagementDashboardRoute.tsx`

#### 7. OpenTelemetry Distributed Tracing
- **File**: `packages/tracing/src/index.ts`
- **Config**: `TRACING_ENABLED` env var (accepts 'yes' or 'true')
- **Exporter**: OTLP gRPC
- **DB Tracing**: `packages/tracing/src/traceDatabaseCalls.ts` - MongoDB instrumentation
- **Standard**: W3C trace context propagation

#### 8. Omnichannel Analytics
- **Interface**: `packages/core-services/src/types/IOmnichannelAnalyticsService.ts`
- **Metrics**: Response times, reaction times, first response, service duration, chat duration, visitor inactivity
- **Model**: `packages/models/dist/models/LivechatRooms.js/.ts`

#### 9. Telemetry Settings
- `Analytics_features_messages` - Message tracking toggle
- `Analytics_features_rooms` - Room event tracking toggle
- `Analytics_features_users` - User event tracking toggle
- `Livechat_enabled` - Livechat analytics toggle
- **Types**: `packages/rest-typings/src/v1/statistics.ts`

### BRANDING ELEMENTS IDENTIFIED

#### 1. Primary Branding
- **README**: `/home/builder/medsense.webchat/README.md` (122 lines)
  - Project name: "Rocket.Chat"
  - Logo: `https://github.com/RocketChat/Rocket.Chat.Artwork/raw/master/Logos/2020/png/logo-horizontal-red.png`
  - Description: "Open-source, secure, fully customizable communications platform"
  - Customers: Deutsche Bahn, US Navy, Credit Suisse

#### 2. Project Configuration
- **package.json**: Name "rocket.chat", v7.14.0-develop
  - Homepage: `https://github.com/RocketChat/Rocket.Chat#readme`
  - Repo: `git+https://github.com/RocketChat/Rocket.Chat.git`
- **Rocket.Chat.sublime-project**: Sublime Text workspace (55 lines)

#### 3. Public HTML
- **Livechat**: `apps/meteor/public/livechat/index.html` - Title: "Livechat - Rocket.Chat"

#### 4. Domain References
- **Main**: `rocket.chat`
- **Docs**: `docs.rocket.chat`, `developer.rocket.chat`
- **Trust**: `trust.rocket.chat`
- **Community**: `open.rocket.chat`
- **Telemetry**: `collector.rocket.chat`
- **GitHub**: `github.com/RocketChat/Rocket.Chat`

#### 5. App Stores
- **iOS**: Rocket.Chat (id1148741252)
- **Android**: chat.rocket.android
- **Mac**: id1086818840
- **Windows**: 9nblggh52jv6
- **Snapcraft**: rocketchat-desktop

#### 6. Social Media
- **Twitter**: @RocketChat
- **Facebook**: RocketChatApp
- **LinkedIn**: Company page

#### 7. NPM Packages (~50 in monorepo)
- `@rocket.chat/meteor`, `@rocket.chat/core-typings`, `@rocket.chat/icons`
- `@rocket.chat/fuselage-ui-kit`, `@rocket.chat/ui-client`, `@rocket.chat/models`, etc.

### KEY OBSERVATIONS

1. **Codebase**: Official Rocket.Chat v7.14.0-develop monorepo (not white-labeled)
2. **Telemetry Flow**:
   - Client Events → POST `/v1/statistics.telemetry` → Event handlers → MongoDB
   - Server Stats → POST `https://collector.rocket.chat/` (Bearer token)
   - Traces → OpenTelemetry → OTLP gRPC exporter
3. **Auth Requirement**: Workspace registration needed for telemetry transmission

### CRITICAL FILES FOR REMOVAL

#### External Telemetry:
1. `apps/meteor/app/statistics/server/functions/sendUsageReport.ts` - Main sender
2. `apps/meteor/app/cloud/server/functions/getWorkspaceAccessToken.ts` - Token system
3. `apps/meteor/app/api/server/v1/stats.ts` - REST endpoints
4. `apps/meteor/client/views/root/hooks/useAnalyticsEventTracking.ts` - Client tracking
5. `apps/meteor/client/views/audit/hooks/useSendTelemetryMutation.ts` - Client telemetry
6. `packages/tracing/src/index.ts` - OpenTelemetry

#### Branding:
1. `README.md` - Primary docs
2. `package.json` - Package metadata
3. `apps/meteor/public/livechat/index.html` - Public widget
4. All `@rocket.chat/*` package names

#### Database Collections:
- `analytics`, `statistics`, settings with telemetry toggles

### RECOMMENDATIONS (Priority Order)

1. **P1**: Disable `collector.rocket.chat` transmission (data privacy)
2. **P2**: Remove Piwik/Google Analytics integrations
3. **P3**: Update public-facing branding (livechat widget, README)
4. **P4**: Decide on internal analytics database (keep for own use?)
5. **P5**: Consider renaming `@rocket.chat/*` packages (full rebrand)

---

## MedSense Rebranding Implementation Plan

**Date**: 2025-12-19
**Scope**: Remove Rocket.Chat telemetry, rebrand UI to "MedSense", bypass license checks
**Timeline**: 23-35 hours (3-4.5 days)

### Phase 1: Telemetry Removal (2-4 hours) ✅

**Files to Modify**:
1. `apps/meteor/app/statistics/server/functions/sendUsageReport.ts` - Add early return
2. `apps/meteor/app/cloud/server/functions/getWorkspaceAccessToken.ts` - Return null
3. `apps/meteor/client/views/root/hooks/useAnalyticsEventTracking.ts` - Disable Piwik/GA
4. `packages/tracing/src/index.ts` - Disable OpenTelemetry

**Implementation**:
```bash
# Create branch
wsl bash -c "cd ~/medsense.webchat && git checkout -b medsense-rebranding"
```

**Verification**:
- [ ] No requests to `collector.rocket.chat`
- [ ] No Piwik/GA in browser console
- [ ] No OpenTelemetry exports
- [ ] **NOTE**: Engagement/statistics dashboards will show empty data (expected - external reporting disabled)
- [ ] REST endpoints `/v1/statistics` still respond (for internal queries if needed)

---

### Phase 2: UI Text Rebranding (8-16 hours) ✅

**Replacement**: "Rocket.Chat" → "MedSense"

**⚠️ SCOPE**: English UI only. 50+ non-English locales will keep "Rocket.Chat" (accepted limitation).

**Critical Files**:
1. `packages/i18n/src/locales/en.i18n.json` - ~128 instances (manual edit)
2. `packages/livechat/src/i18n/en.json` - 1 instance
3. `packages/web-ui-registration/src/components/RegisterTitle.tsx` - Fallback default
4. `packages/livechat/dist/index.html` - Title (verify exists)
5. `apps/meteor/public/livechat/index.html` - Title (verify exists)
6. `packages/livechat/widget-demo.html` - Welcome title
7. Check JSX/TSX for hardcoded strings in: Header stories, integration examples, welcome screens

**Commands**:
```bash
cd ~/medsense.webchat

# 1. Verify file paths exist
ls packages/livechat/src/i18n/en.json
ls packages/livechat/dist/index.html 2>/dev/null || echo "dist/index.html not found"
ls apps/meteor/public/livechat/index.html 2>/dev/null || echo "public/livechat not found"

# 2. Livechat i18n
wsl bash -c "cd ~/medsense.webchat && sed -i 's/Powered by Rocket\.Chat/Powered by MedSense/g' packages/livechat/src/i18n/en.json"

# 3. HTML titles (only if files exist)
wsl bash -c "cd ~/medsense.webchat && find packages/livechat/dist apps/meteor/public/livechat -name 'index.html' -exec sed -i 's/Livechat - Rocket\.Chat/Livechat - MedSense/g' {} \; 2>/dev/null"

# 4. Main i18n - MANUAL EDIT REQUIRED
# File: packages/i18n/src/locales/en.i18n.json
# Use editor to replace ~128 instances, prioritize:
#   High: Admin messages, "Powered by", installation prompts
#   Med: Cloud integration, feature names
#   Low: Example URLs, technical error messages

# 5. Component fallback - MANUAL EDIT
# File: packages/web-ui-registration/src/components/RegisterTitle.tsx
# Line: const siteName = useSetting('Site_Name', 'Rocket.Chat');
# Change to: const siteName = useSetting('Site_Name', 'MedSense');

# 6. Search for remaining hardcoded strings
wsl bash -c "cd ~/medsense.webchat && grep -r 'Rocket\.Chat' --include='*.tsx' --include='*.jsx' apps/meteor/client/views/ | grep -v node_modules | head -20"

# 7. Rebuild (regenerates all 50+ language files from source)
wsl bash -c "cd ~/medsense.webchat && yarn workspace @rocket.chat/i18n build"
```

**Verification**:
- [ ] Login page: "MedSense" (not "Rocket.Chat")
- [ ] Registration: Default shows "MedSense"
- [ ] Admin messages: "Your MedSense administrator..."
- [ ] Livechat widget title: "Livechat - MedSense"
- [ ] Livechat footer: "Powered by MedSense"
- [ ] Welcome/home screen: No "Rocket.Chat"
- [ ] Sidebar/footer links: No rocket.chat domains
- [ ] Grep check: `grep "Rocket\.Chat" packages/i18n/src/locales/en.i18n.json | wc -l` → 0 or minimal
- [ ] **ACCEPTED**: Non-English languages still show "Rocket.Chat"
- [ ] No translation errors in console

---

### Phase 3: Visual Branding (4-6 hours) ✅

**Files to Modify**:
1. `README.md` - Title, description, logo
2. `package.json` - Name, homepage, repository (optional)
3. `Rocket.Chat.sublime-project` - Project name
4. Favicon/logo assets (if available)

**Implementation**:
```bash
cd ~/medsense.webchat
# Manual edits to README.md and package.json
```

**Verification**:
- [ ] README shows correct branding
- [ ] Browser tab title correct
- [ ] No broken image links

---

### Phase 4: License Bypass (1-2 hours) ✅

**File**: `ee/packages/license/src/license.ts`

**Implementation**:
Add to license.ts:
```typescript
hasModule(module: string): boolean {
  return true; // Bypass: Always grant access
}

async shouldPreventAction(
  action: LicenseLimitKind,
  extraCount = 0
): Promise<boolean> {
  return false; // Bypass: Never prevent actions
}
```

**Verification**:
- [ ] Enterprise features accessible
- [ ] No license warnings in logs
- [ ] Admin panel no license errors
- [ ] All livechat features work

---

### Build & Deploy

**Development Test**:
```bash
cd ~/medsense.webchat
yarn install && yarn build
MONGO_URL="mongodb://127.0.0.1:27017/rocketchat?replicaSet=rs0" \
  MONGO_OPLOG_URL="mongodb://127.0.0.1:27017/local?replicaSet=rs0" \
  TRANSPORTER="monolith+nats://127.0.0.1:4222" \
  yarn dsv
```

**Production Deploy**:
```bash
# Build
cd ~/medsense.webchat
GIT_SHA=$(git rev-parse --short HEAD)
docker build -f Dockerfile.medsense-final \
  -t dockerfriend1234/medsense-pharmacy-chat:sha-${GIT_SHA} \
  -t dockerfriend1234/medsense-pharmacy-chat:latest .

# Push
docker push dockerfriend1234/medsense-pharmacy-chat:sha-${GIT_SHA}
docker push dockerfriend1234/medsense-pharmacy-chat:latest

# Deploy
ssh <droplet>
cd /opt/rocketchat/rocketchat-compose/generated
docker login -u dockerfriend1234
docker compose -p rocketchat-compose pull rocketchat
docker compose -p rocketchat-compose up -d --no-deps rocketchat
docker compose -p rocketchat-compose logs -f rocketchat
```

**Rollback**:
```bash
cd ~/medsense.webchat
git checkout main  # Restore previous version
# Or redeploy previous Docker image tag
```

---

### Known Limitations & Remaining References

**The following Rocket.Chat references will remain (not changed by this plan):**

1. **Non-English Translations** (~50 languages):
   - Files: `packages/i18n/dist/resources/*.i18n.json`
   - Impact: Users with non-English language preferences will see "Rocket.Chat"
   - Reason: Manual translation effort for 50+ languages out of scope

2. **NPM Package Names**:
   - All `@rocket.chat/*` package namespaces (~50 packages)
   - Examples: `@rocket.chat/meteor`, `@rocket.chat/fuselage-ui-kit`, `@rocket.chat/ui-client`
   - Impact: Internal code references, no user-facing impact
   - Reason: Breaking change, affects build system

3. **Database Names**:
   - MongoDB database: `rocketchat` (MONGO_URL parameter)
   - Collections: May contain "rocketchat" prefixes
   - Impact: Internal only, no user-facing impact
   - Reason: Data migration complexity

4. **Code Comments & Documentation**:
   - Inline code comments mentioning Rocket.Chat
   - JSDocs, TSDoc references
   - Impact: Developer-only
   - Reason: Low priority, no user impact

5. **Git History & Repository Metadata**:
   - Git commit messages
   - Repository origin URL (if unchanged)
   - Impact: Development team only
   - Reason: Cannot retroactively change git history

6. **Build Artifacts** (if not rebuilt):
   - Compiled JS bundles mentioning Rocket.Chat
   - Source maps
   - Impact: Will be fixed after rebuild
   - Reason: Auto-generated from source

7. **External Dependencies**:
   - Third-party packages referencing Rocket.Chat
   - node_modules content
   - Impact: No user-facing impact
   - Reason: External code, not modifiable

8. **Widget JavaScript API** (optional):
   - `window.RocketChat` global object
   - Impact: External integrations may expect this API name
   - Recommendation: Keep for backward compatibility unless no external integrations exist

**User-Facing Impact**: Minimal for English users. Non-English users will see mixed branding (MedSense in some places, Rocket.Chat in translation strings).

**Mitigation**: Set site language to English for all users, or accept mixed branding as technical debt.

---

## Phase 1 Status Update (2025-12-19)

### ✅ PHASE 1 COMPLETE - Telemetry Removal

**Implementation Status**: Already implemented in working directory (no branch yet)

**Changes Made**:
1. ✅ `apps/meteor/app/api/server/v1/stats.ts` - Returns 410 with `telemetryDisabled` for all statistics/telemetry routes
2. ✅ `apps/meteor/app/statistics/server/functions/sendUsageReport.ts` - Short-circuits, no collector send
3. ✅ `apps/meteor/app/cloud/server/functions/getWorkspaceAccessToken.ts` - Returns empty unless `MEDSENSE_ENABLE_CLOUD_ACCESS=true`
4. ✅ `apps/meteor/client/views/root/hooks/useAnalyticsEventTracking.ts` - Telemetry hook is no-op (Piwik/GA disabled)
5. ✅ `packages/tracing/src/index.ts` - Tracing stays off unless `TRACING_ENABLED=yes`
6. ✅ Client telemetry calls removed from:
   - Slash commands
   - OTR stats
   - Audit hooks
   - Admin users
   - Engagement dashboard
   - Advanced contact modal
   - Telemetry mutation stubbed

**Verification Commands**:
```bash
cd /home/builder/medsense.webchat

# Check modified files
git status --short

# Verify telemetry disabled
grep "telemetryDisabled" apps/meteor/app/api/server/v1/stats.ts
grep "Usage/telemetry reporting disabled" apps/meteor/app/statistics/server/functions/sendUsageReport.ts
grep "MedSense" apps/meteor/app/cloud/server/functions/getWorkspaceAccessToken.ts

# Test API endpoints (when app running)
# curl http://localhost:3000/api/v1/statistics → expect 410 with telemetryDisabled
```

**Next Step**: Create branch to preserve changes
```bash
wsl bash -c "cd /home/builder/medsense.webchat && git checkout -b medsense-rebranding"
```

**Ready for**: Phase 2 - UI Text Rebranding

---

## CRITICAL MISSING STEP: Rebuild Required

### Issue: "Powered by Rocket.Chat" Still Appears

**Root Cause**: Compiled bundles in `apps/meteor/.meteor/local/build/` contain old branding from before Phase 2 changes.

**Solution**: **MUST rebuild the application** after modifying source i18n files.

### Rebuild Steps (Add to Phase 2):

```bash
cd /home/builder/medsense.webchat

# After editing i18n source files, MUST rebuild:
# 1. Clean old build artifacts
rm -rf apps/meteor/.meteor/local/build/

# 2. Rebuild i18n packages
yarn workspace @rocket.chat/i18n build

# 3. Rebuild entire application (REQUIRED)
cd apps/meteor
yarn build
# OR for development:
yarn dsv  # This will trigger rebuild

# 4. Verify compiled bundles updated
grep "Powered by" .meteor/local/build/programs/server/packages/modules.js
# Should show: "Powered by MedSense"
```

### Why This Was Missing:

The plan mentioned `yarn workspace @rocket.chat/i18n build` but didn't emphasize that:
1. **Meteor caches compiled bundles** in `.meteor/local/build/`
2. **Server-side rendering** uses these cached bundles
3. **Client-side bundles** are also pre-compiled
4. Simply editing source files **does NOT update the running app**

### Updated Phase 2 Workflow:

1. Edit source i18n files ✓ (already done in plan)
2. **Clean build cache** ← MISSING
3. **Rebuild i18n** ✓ (in plan)
4. **Rebuild full app** ← MISSING
5. **Restart dev server** ← MISSING
6. Verify changes

### Quick Fix (If You Already Edited Source Files):

```bash
# Stop running app (if any)
# Ctrl+C to kill yarn dsv

# Clean and rebuild
cd /home/builder/medsense.webchat
rm -rf apps/meteor/.meteor/local/build/
yarn workspace @rocket.chat/i18n build
cd apps/meteor
yarn dsv  # Rebuilds and starts dev server

# Wait for build to complete, then test:
# Navigate to livechat widget → footer should show "Powered by MedSense"
```

**Verification**: Check browser DevTools → Elements → Search for "Powered by" → Should be "MedSense"
