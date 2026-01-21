# Medsense Webchat – Quick Dev & Deploy Notes

## Components
- MedSense Orchestrator: `D:\medora_build\medsense_orchestrator`

## Local Dev (WSL)
- Start local Mongo/NATS (WSL-backed, ports on localhost):  
  `cd ~/medsense.webchat`  
  `docker compose -f deployment/docker-compose.localdeps.yml up -d`
- Alternative (simple Docker one-shot):
  `bash scripts/dev-local-docker.sh`
- Run the app (from repo root):  
  ```
  cd ~/medsense.webchat
  MONGO_URL="mongodb://127.0.0.1:27017/rocketchat?replicaSet=rs0" \
  MONGO_OPLOG_URL="mongodb://127.0.0.1:27017/local?replicaSet=rs0" \
  TRANSPORTER="monolith+nats://127.0.0.1:4222" \
  LOCAL_BROKER_TIMEOUT_MS=60000 \
  yarn dsv
  ```
- If Mongo errors about `ENOTFOUND mongo`, reconfig RS host inside Mongo:  
  `sudo docker exec -it deployment-mongo-1 mongosh --quiet --eval 'cfg=rs.conf(); cfg.members[0].host="127.0.0.1:27017"; rs.reconfig(cfg,{force:true});'`
- If Marketplace errors appear in dev, keep mock fetch enabled:
  `export MARKETPLACE_FETCH_STRATEGY=mock`

## Current Progress (2025-12-27)
- Build/runtime fixes applied:
  - Deno runtime pinned to `1.43.5` in `Dockerfile.medsense-source` to match the last working image.
  - Cloud supported versions endpoint points to `https://releases.rocket.chat/v2/server/supportedVersions`.
  - Marketplace calls default to mock fetch (no external API calls).
  - Deployment UI now guards missing `statistics.process` fields to avoid `nodeVersion` crash.
  - Web Crypto polyfills added for HTTP deployments (randomUUID fallback).
- Dev env helpers:
  - `scripts/dev-local-docker.sh` starts Mongo + NATS, initializes RS, and bypasses cloud registration.
  - `LOCAL_BROKER_TIMEOUT_MS=60000` recommended to avoid LocalBroker startup timeout.
- Deployment helper:
  - `D:\medsense-chat-local\deploy-to-droplet.sh` injects `MARKETPLACE_FETCH_STRATEGY=mock` into compose by default.
- Common commands:
  - Build image: `docker build --progress=plain -f Dockerfile.medsense-source -t dockerfriend1234/medsense-pharmacy-chat:sha-<git> .`
  - Push image: `docker push dockerfriend1234/medsense-pharmacy-chat:sha-<git>`

## Troubleshooting Recap (2026-01-08)
- **UI crashes from stale bundles**: `Dockerfile.medsense-source` prefers `prebuilt/bundle`, so rebuilding without updating it keeps old JS. Rebuild `prebuilt/bundle` before image builds.
- **Updated client guards**: `useHasLicenseModule`, `useShouldPreventAction`, and modal context hooks are now guarded to avoid undefined hooks. Rebuild bundle + clear service worker cache.
- **Apps Engine regression**: running image moved to `@rocket.chat/apps-engine` `1.59.0-rc.0`; rolled back to `1.58.0` to match last working image.
- **i18n build failure**: fixed invalid JSON in `packages/i18n/src/locales/en.i18n.json` (line breaks escaped).
- **Apps Engine typings**: added `activity?: string` to `IVisitor`; exported `IRoomRaw` from apps-engine rooms index.
- **LocalBroker timeouts**: caused by Mongo/NATS connectivity + replica set host mismatch. Set `LOCAL_BROKER_TIMEOUT_MS=60000`, `APPS_ENGINE_RUNTIME_TIMEOUT=60000`, and fix replica set host to match container DNS.
- **Docker image “disappearing”**: BuildKit didn’t load image into local store. Use `docker buildx build --load ...` or `DOCKER_BUILDKIT=0` to ensure tag appears in `docker images`.
- **Local compose**: added `docker-compose.medsense-local.yml` with Mongo/NATS/Chat, explicit `BIND_IP=0.0.0.0`, and `MONGO_VOLUME` support to reuse existing workspace volume.
- **Windows access**: open port 3000 for private network and browse via LAN IP (not `127.0.0.1`).

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


# Dev Notes: Smart Forms + Orchestrator Wiring

- Smart Forms app: d:/medsense-chat-local/smart-forms-app (Rocket.Chat private app).
- App triggers:
  - Uses message customFields.formId first; falls back to [MEDSENSE_FORM] prefix parsing.
  - Form payload fetched from orchestrator: GET /forms/payload/<formId>.
  - Submissions POST to /forms/submit (absolute URL built from orchestrator_base_url).
- Inline vs modal:
  - Single-step forms render inline buttons with a Submit action.
  - Multi-step forms render modal (Open form) when supported; widget cannot do modals.
- Inline behavior:
  - Button clicks store selections; Submit sends payload to /forms/submit.
  - Clears form cache/progress after completion.
- Livechat block actions:
  - executeLivechatBlockActionHandler is implemented (no ILivechatBlockActionHandler type in this apps-engine version).
- Orchestrator SmartForms agent:
  - Name/tool: smartforms (renamed from smart_forms).
  - Uses provided steps directly; Gemini only when steps missing.
  - Escalation form is static and matches screenshot.
- Trigger message:
  - Orchestrator posts friendly trigger_message; no [MEDSENSE_FORM]/formId in text.
  - formId is attached as message customFields.formId (requires Message Custom Fields enabled + validation schema).
- Required Rocket.Chat setting:
  - Enable Message Custom Fields with JSON schema allowing formId.
## Debug endpoints (Orchestrator):
  - POST /forms/debug/inline and /forms/debug/modal for smart form smoke tests.
  - POST /escalation/debug/takeover for takeover flow smoke test.
  - POST /debug/intake for connectivity smoke test to the intake channel (requires DEBUG_INTAKE_ROOM_ID env).

### Intake Connectivity Smoke Test
```bash
# Set the room ID of your intake channel in your .env or shell
# Then trigger the message from the orchestrator
curl -sS -X POST http://localhost:8080/debug/intake
```

**Required Orchestrator Implementation (main.py):**
```python
@app.route("/debug/intake", methods=["POST"])
def debug_intake_smoke():
    """Smoke test: Send a fixed message to the configured intake room."""
    room_id = DEBUG_INTAKE_ROOM_ID
    if not room_id:
        return jsonify({"error": "DEBUG_INTAKE_ROOM_ID not configured"}), 400

    message_text = "🚑 MedSense Intake Smoke Test: Orchestrator -> Rocket.Chat connectivity verified."
    msg_record = post_bot_message_to_rc(room_id, message_text)

    if msg_record:
        return jsonify({"status": "success", "message_id": msg_record.get("_id")})
    return jsonify({"error": "Failed to post message"}), 500
```

## Recent fixes
- Invalid URL errors fixed by making submit URL absolute in app.
- Custom fields strict mode error fixed by using customFields.formId (not smart_forms).
- Gemini empty_steps handled by skipping Gemini if steps provided.
- Added ai.error payload logging in orchestrator.
- Smart Forms modal flow: stable modal id, Back/Next navigation, and selections stay editable.
- Modal submit sends all stored step selections once on final Submit.
- Modal selections use action buttons instead of radio/checkbox inputs.
- Inline submit uses a Submit button (no immediate submit on selection).
- Inline submit now hides Submit until a selection exists.
- Added divider between selection buttons and navigation buttons in modals.
- Modal navigation labels now use arrows (← Back / Next →).
- Orchestrator debug endpoints are /forms/debug/inline and /forms/debug/modal.
- Orchestrator posts Selected: <values> on /forms/submit for dev visibility.
- Smart Forms can fetch Cloud Run ID tokens via webhook /token (settings: orchestrator_token_url, orchestrator_token_secret).
- Summary posting now uses /forms/submit response (no /forms/summary endpoint) and posts to room using cached room object.
- Added form expiry timer setting (form_expire_ms, default 15 min) with expiry message and cleanup.
- "Other" input isolation fixed by step-scoped actionId; no carry-over between steps.
- Added "New bot chat" modal with optional user greeting input (button label uses Medsense_Start_Chat_Label).
- Added view-directory permission to hide/show the directory button in the UI.
- Create Team modal now has toggles to create intake/handover channels; /v1/teams.create accepts flags and creates team channels.
- Sidebar shows a persistent badge + bold highlight when room.customFields.unassignedCount > 0.
- Added REST endpoint GET /api/v1/medsense/available_teams to return hasLivechatAvailable for requested teamIds.

### Takeover Smoke Test
```bash
curl -sS -X POST http://localhost:8080/escalation/debug/takeover \
  -H "Content-Type: application/json" \
  -d '{
    "patientRoomId": "<patient-room-id>",
    "teamId": "pharmacy-team"
  }'
```

## Known constraints
- Livechat widget does not support UIKit modals; use inline steps for widget.
- No message update API for livechat, so inline multi-step is sequential messages.

## Medsense intake badge + take fixes (2026-01-15)
- Smart Forms intake take action now guards against null persistence arrays, prevents repeat "Taken" posts, and only proceeds when the record is unassigned.
- Intake room id resolution hardened (id/_id/name) so unassignedCount increments reliably.
- Apps-engine room updates now use saveRoomCustomFields + notifyOnRoomChangedById so unassignedCount pushes live to clients.
- Subscription cache now preserves customFields from subscription updates to avoid badge disappearing until refresh.
- Intake badge styling updated (custom colors + centered count).

---

## Pharmacy (Department-like) Plan (First-class Models)

### Goal
Implement a department-like **Pharmacy** feature in the Rocket.Chat fork, to scope manager/staff operations and to support patient triage + escalation into Team intake channels, without relying on user/team custom fields as the source of truth.

### Data Model (Mongo)
- `medsense_pharmacies`
  - `_id`, `name`, `slug`, `active`, `createdAt`, `createdBy`, optional metadata (address/phone/timezone)
- `medsense_pharmacy_memberships` (staff can be in multiple pharmacies)
  - `_id`, `pharmacyId`, `userId`, `roles` (`manager|staff`), `active`, `createdAt`, `createdBy`
  - Unique index: `{ pharmacyId, userId }`
- `medsense_patient_pharmacy` (patient has one preferred pharmacy)
  - `_id`, `patientUserId`, `pharmacyId`, `setAt`, `setBy` (patient/admin)
  - Unique index: `{ patientUserId }`
- `medsense_pharmacy_teams` (maps pharmacy -> teams + intake/handover channels)
  - `_id`, `pharmacyId`, `teamId`, `purpose` (`pharmacist|technician|assistant|general`), `intakeRoomId`, optional `handoverRoomId`
  - Unique index: `{ pharmacyId, teamId }`

### Permissions / Roles
- `medsense-manage-pharmacies` (global admin)
- `medsense-manage-own-pharmacy` (pharmacy manager)
- `medsense-view-pharmacy-members`
- `medsense-invite-pharmacy-staff`
- `medsense-create-pharmacy-teams`

### Medsense REST APIs (RC fork)
All under ` /api/v1/medsense/... ` and **server-side enforced** (no UI-only guards).

**Pharmacies**
- `GET medsense/pharmacies.mine` → pharmacies current user can manage (for manager dropdown)
- `GET medsense/pharmacies.list` → admin list (optionally includes members count)
- `POST medsense/pharmacies.create` → admin create
- `POST medsense/pharmacies.update` → admin or manager (scoped)

**Membership**
- `GET medsense/pharmacies.members.list?pharmacyId=...` → scoped list
- `POST medsense/pharmacies.members.invite` `{ pharmacyId, email, name, roles }`
  - Creates/updates RC user, writes membership row, sends RC invite/welcome email
  - Staff can be invited into multiple pharmacies (multiple membership rows)
- `POST medsense/pharmacies.members.addExisting/remove` → manager scoped to selected pharmacy

**Patient preference**
- `GET medsense/patient.pharmacy.mine`
- `POST medsense/patient.pharmacy.set` `{ pharmacyId }` (patient can change via UI toggle)

**Routing helper for orchestrator**
- `GET medsense/pharmacies.available_teams?pharmacyId=...`
  - Returns teams (teamId + teamName + purpose) and `hasLivechatAvailable`/`countAvailable`
  - Uses: team membership ∩ livechat agents (`statusLivechat`)

### Manager UI Flow (no global directory)
- Add Medsense “Pharmacy” admin UI:
  - Admin: create pharmacies, assign managers
  - Manager: select pharmacy (dropdown from `pharmacies.mine`), create teams + intake/handover channels
  - Manager: invite staff via `pharmacies.members.invite` and manage only pharmacy members

### Patient Registration + Engagement (Managed mode)
- Use Rocket.Chat managed invites/registration (email-based).
- On first login (or first start-chat), if `medsense_patient_pharmacy` missing:
  - Require patient to pick preferred pharmacy.
- Allow patient to change preferred pharmacy later via settings UI toggle.

### Integration With Teams → Intake → Take Chat
- Team creation (for a selected pharmacy) creates/records:
  - `purpose`, `teamId`, `intakeRoomId` (default), optional `handoverRoomId`
- Orchestrator escalation flow:
  1) Determine patient preferred pharmacyId
  2) Call `medsense/pharmacies.available_teams` to get team options + availability
  3) Use SmartForms to present choices (label: teamName, value: teamId)
  4) On selection, orchestrator calls SmartForms intake endpoint with `{ teamId, patientRoomId, issueTitle, issueSummary }`
  5) SmartForms resolves `teamId → intakeRoomId` and posts intake card + increments `room.customFields.unassignedCount` on the intake room
  6) Staff clicks “Take chat” → decrements `unassignedCount`, updates intake card to Taken, posts “Taken by…”, and adds staff to patient private r
### 2026-01-16: Pharmacy Data Models Implementation

#### Components Added
To support the department-like 'Pharmacy' structure, the following data models and types have been implemented:

**1. Data Models (\packages/models/src/models/\)**
-   \MedsensePharmacies.ts\: Stores pharmacy entity (name, slug).
-   \MedsensePharmacyMemberships.ts\: Links users to pharmacies with roles (manager/staff).
-   \MedsensePatientPharmacy.ts\: Stores patient's preferred pharmacy.
-   \MedsensePharmacyTeams.ts\: Maps pharmacies to Rocket.Chat Teams (intake/handover rooms).

**2. Type Definitions**
-   **Core Typings (\packages/core-typings/src/\)**:
    -   \IMedsensePharmacy.ts    -   \IMedsensePharmacyMembership.ts    -   \IMedsensePatientPharmacy.ts    -   \IMedsensePharmacyTeam.ts-   **Model Interfaces (\packages/model-typings/src/models/\)**:
    -   \IMedsensePharmaciesModel.ts\ (Data access contract)
    -   etc.

**3. Service Registration**
-   Updated \packages/models/src/index.ts\ and \modelClasses.ts\ to register these models in the service container.
-   Proxies exported as \MedsensePharmacies\, \MedsensePharmacyMemberships\, etc.

**4. Permissions**
-   Added to \pps/meteor/app/lib/server/startup/medsense.ts\:
    -   \medsense-manage-pharmacies\ (Admin)
    -   \medsense-manage-own-pharmacy\ (Admin, Manager)
    -   \medsense-view-pharmacy-members\ (Admin, Manager, Staff)
    -   \medsense-invite-pharmacy-staff\ (Admin, Manager)

#### Next Steps
-   Implement REST APIs in \pps/meteor/app/api/server/v1/medsense.ts\ to expose these models.

- **Permissions Update**: Added \medsense-create-pharmacy-teams\ to allow creating Rocket.Chat teams for pharmacies.
- **Roles**: Ensured `pharmacy-manager` and `pharmacy-staff` roles are created on startup.

### 2026-01-16: Pharmacy REST API Implementation & Verification

#### Implementation Methods
- **API Endpoints**: Implemented in `apps/meteor/app/api/server/v1/medsense.ts`.

### 2026-01-19: Build Alignment & Queue Refinements (Pharmacy-Only)

**Goal**: Align local build with Queue Build Orchestrator specs. Replace intake-channel flow with API-driven queue flow, removing all Team logic in favor of direct Pharmacy routing.

#### Orchestrator (`medora-build/medsense_orchestrator`)
- **Remove Team Logic**:
  - Delete all environment-based teamId handling.
  - Remove queries for team availability.
- **Escalation Confirmation**:
  - Call `pending.set` on confirmation.
  - **Payload**: `roomId`, `pharmacyId`, `reason`, `patientUserId`, `issueTitle` (if present), `context`.
  - **Pre-check**: Abort if room is already pending or taken.
- **Reason Propagation**:
  - Ensure Triage Agent includes `reason` in output.
  - Pass `reason` through SmartForms context -> submit -> `pending.set`.
- **Auth**: Use bot service account credentials.

#### Webhook (`medora-build/medsense_webhook`)
- **Webhooks**: Keep integrated webhook only for private channels if used.
- **Summary**: (Optional) Endpoint to accept roomId + messages -> return summary.

#### Server (`medsense.webchat`)
- **API `pending.set`**:
  - Set `status='pending'`, store `pharmacyId`, `reason`.
  - Write `MedsenseAudit` record.
  - Broadcast `room.save`.
- **API `pending.list` / `pending.mine`**:
  - Filter by `pharmacyId`.
  - Return only pending items.
  - **NO Team Logic**.
- **Logic**:
  - **Last Staff Leave**: Set `status='resolved'` (never re-queue).
  - **Staff Role Setting**: Add `Medsense_Staff_Roles` to detect staff.
- **Data APIs**:
  - Fetch patient preferred pharmacy.
  - **Remove** available_teams endpoints.

#### UI (`medsense.webchat`)
- **Queue Page**:
  - Default tab: "Chat Queue".
  - Columns: Pharmacy Name, Reason, Patient, Waiting Since. (Remove Team column).
  - Badge: Count of current pharmacy queue only.
  - Label: "Waiting for staff" (instead of "pending").
  - `POST medsense/pharmacies.create`: Admin only. Creates a pharmacy and assigns creator as manager.
  - `GET medsense/pharmacies.list`: Returns all (for admins) or owned (for managers) pharmacies.
  - `POST medsense/pharmacies.update`: Updates pharmacy details (name, active status).
  - `POST medsense/pharmacies.members.(invite/list/remove)`: Managing pharmacy staff.
  - `GET/POST medsense/patient.pharmacy.*`: Managing patient preferences.

#### Runtime Fixes
- **Model Registration**: The Medsense models required manual registration in `apps/meteor/server/models.ts` to be available at runtime. The automatic discovery via `packages/models` export was insufficient for the main server bundle.
- **Roles Creation**: Fixed `Roles.createOrUpdate` error (deprecated/missing method) by using `Roles.findOneById` + `Roles.insertOne` pattern.
- **Typing Fix**: `IMedsensePharmacy.ts` was fixed to remove invalid invisible characters/literals.

#### Verification
- **Automated Script**: `scripts/test-pharmacy-api.sh` verified the full flow:
  1. Login as admin/manager.
  2. Create Pharmacy (success, returned ID).
  3. List Pharmacies (success, validated ID presence).
  4. Set Patient Preference (success).
  5. Get Patient Preference (success, validated correct ID).
- **Status**: PASSED. Endpoints are functional and ready for UI integration.

#### 2026-01-17: Pharmacy Teams Availability
- **New Endpoint**: `GET /api/v1/medsense/pharmacies.available_teams?pharmacyId=...`
  - Returns teams mapped to the specified pharmacy (requires `MedsensePharmacyTeams` model).
  - Response includes: `teamId`, `name`, `purpose`, `intakeRoomId`, `handoverRoomId`, and `hasLivechatAvailable`.
  - Availability logic: Intersection of team membership and `livechat-agent` status (online/available).
- **Permissions**: Gate matches `medsense/available_teams`:
  - `view-all-teams` AND (`transfer-livechat-guest` OR `edit-omnichannel-contact`).
- **Implementation**: Updated `medsense.ts` to import `MedsensePharmacyTeams` and joined data with `Users` (agents) and `Team` (names).

Planned: Simplified Pending Queue (Teams)

Flow: When a patient selects a team, set room custom fields pendingTeamId=<teamId> and pendingStatus=pending (no intake room/message).
Queue UI: Team-scoped view lists rooms where pendingTeamId is in the viewer’s teams and pendingStatus=pending; publish per-team counts for badges.
Take action: In one operation, clear pendingStatus, add the agent to the room, post a system message (“Taken by @user at <time>”), and write an audit record.
Audit: Server collection logs state changes (pending → taken/closed) with roomId, teamId, userId, timestamp; room system messages keep visible history.
Optional: Mirror state changes to a team log channel if a shared feed is desired, but not required for queue/badges.
Permissions: Queue/take actions gated to team members (and admins); orchestrator sets the pending fields when posting the team choice.
#### Planned: Alerts for New Pending Rooms
- When a room is marked pending for a team, emit a push event so team members know immediately.
  - Server: emit a  (or per-user ) event with .
  - Client: listen, show a toast/desktop notification, and refresh the pending queue list.
- Keep the per-team pending count driving the sidebar badge; bump it when a room becomes pending.
- Optional: post a short log message into a team log channel to give a shared feed/unread badge (not required for the queue to work).

### 2026-01-18: End-to-End Queue Escalation (Orchestrator + Webhook + SmartForms + Core)

example payload from intergrated webhook:
{
  "token": "medsense",
  "bot": false,
  "channel_id": "69652e0c8352dcb643ebc028",
  "channel_name": "medsense-testuser2-bot-WAk78c",
  "message_id": "Z9yo9ChE6n4NbbTF7",
  "timestamp": "2026-01-18T17:30:24.352Z",
  "user_id": "T7GLMtcpGKDs2b5BA",
  "user_name": "smart-forms.bot",
  "text": "Selected: Talk to newpharmacy1",
  "siteUrl": "http://localhost:3000"
}
note the channel_id is the room_id

#### Orchestrator (medsense-orchestrator)
- Remove legacy intake-channel flow:
  - Delete `_resolve_team_intake_room` usage and envs (`RC_INTAKE_ROOM_KEY`, `MEDSENSE_TEAM_IDS`, `RC_PHARMACIST_DEPARTMENT_ID`).
  - Replace `/debug/intake` with a queue smoke that calls `medsense/pending.set`.
- Escalation form build (pre-confirm):
  - Resolve patient pharmacy with a server endpoint (see Core change below).
  - Call `GET /api/v1/medsense/pharmacies.available_teams?pharmacyId=...` to get team options.
  - Build SmartForms options with `label=teamName`, `value=teamId`.
- Escalation confirm:
  - Require selected `teamId` and `patientUserId`.
  - Call `POST /api/v1/medsense/pending.set` with `{ roomId, teamId, patientUserId }`.
  - Post patient confirmation message.
- Update tests to remove intake-room assertions and to validate pending-queue calls.

#### Webhook (medsense_webhook)
- Ensure webhook payload passed to orchestrator includes:
  - `roomId`, `userId` (patient), `username`, `messageId`.
- Keep bot/secret filtering unchanged.

#### Smart Forms App
- Escalation form payload:
  - Options: `{ label: teamName, value: teamId }`.
  - Context: include `roomId` and `patientUserId` (or explicit fields).
- Submit handler should forward `teamId` + `patientUserId` to orchestrator (no intake-room creation).

#### Core (medsense.webchat)
**New endpoint**
- `GET /api/v1/medsense/patient.pharmacy.resolve?userId=...`
  - Returns patient’s preferred pharmacy using service-account permissions.
  - Intended for orchestrator (bot user).

**Existing endpoints used**
- `GET /api/v1/medsense/pharmacies.available_teams?pharmacyId=...` (already implemented)
- `POST /api/v1/medsense/pending.set` (extend to accept `patientUserId`)

**Pending queue fields**
- On `pending.set`, store:
  - `pendingTeamId`, `pendingStatus=pending`, `pendingSetAt`, `pendingPatientUserId`.
- On `pending.take`, store:
  - `takenBy`, `takenAt` and write audit entry.

**Audit (source of truth)**
- Extend `MedsenseAudit` to capture:
  - `patientUserId`, `teamId`, `roomId`, `action`, `pendingSetAt`, `takenAt`, `takenBy`.
- Add endpoint: `GET /api/v1/medsense/audit.list?from=&to=&patientUserId=&takenBy=&teamId=`.
- Permission: `medsense-view-audit` (staff/admin only).

**Queue UI**
- Queue page uses `medsense/pending.list` for live queue.
- Add filters for auditing (date range, patient, takenBy) using `medsense/audit.list`.
- Home default tab for staff: `Chat Queue` (permission-gated).
- Remove queue link from sidebar footer (now lives in Home tabs).

#### Settings / Env
- Remove: `MEDSENSE_TEAM_IDS`, `RC_INTAKE_ROOM_KEY`, `RC_PHARMACIST_DEPARTMENT_ID`.
- Optional debug envs:
  - `DEBUG_PENDING_ROOM_ID`, `DEBUG_PENDING_TEAM_ID`.

### 2026-01-19: Pharmacy Queue Refactor (Final Implementation)

#### Goal
Refactor the escalation logic to route patients to their preferred Pharmacy queue instead of a generic Team queue, enabling true multi-pharmacy support.

#### Orchestrator Changes (`medsense-orchestrator`)
- **`main.py`**:
    - Refactored `_execute_escalation_agent` to resolve `pharmacyId` from patient data using `rocketchat_client.get_patient_pharmacy`.
    - Updated `handle_form_submit` to pass `pharmacyId`, `issueTitle`, and `reason` from Smart Forms to `pending.set`.
    - Removed legacy team selection logic (`_select_pharmacy_team`) and usage of `MEDSENSE_TEAM_IDS`.
- **`rocketchat_client.py`**:
    - Updated `set_pending_status` to accept `pharmacyId` and optional `patientUserId`/`issueTitle`.
    - Removed legacy `get_available_teams` helper.

#### Server Changes (`medsense.webchat`)
- **API Endpoints (`apps/meteor/app/api/server/v1/medsense.ts`)**:
    - `medsense/pending.set`: Now requires `pharmacyId` and stores it in `MedsenseAudit` and Room custom fields.
    - `medsense/pending.list`: Filters by `pharmacyId`.
    - `medsense/audit.list`: Supports `pharmacyId` filtering and verified permissions.
    - `medsense/pending.take`: Records `pharmacyId` in the "taken" audit log.
- **Models**:
    - `packages/core-typings/src/IMedsenseAudit.ts`: Added `pharmacyId`, `issueTitle`, `reason`.
    - `packages/models/src/models/MedsenseAudit.ts`: Added database index for `pharmacyId`.

#### Client UI Changes (`medsense.webchat`)
- **Queue Page (`apps/meteor/client/views/medsense/queue/QueuePage.tsx`)**:
    - Refactored to select **Pharmacy** instead of Team.
    - Displays "Live Queue" and "History" specific to the selected pharmacy.
    - Added "Urgency", "Issue", and "Patient" columns to the queue table.

### 2026-01-19: Fixes needed to match Pharmacy-only Queue plan

#### Orchestrator (medsense-orchestrator)
- main.py: remove team fallback in _execute_smart_forms_agent (drop _get_configured_team_ids/_fetch_available_teams and any teamId option building).
- main.py: delete legacy debug endpoints that call team/intake flow:
  - /debug/intake should call pending.set with pharmacyId (no teamId).
  - /escalation/debug/takeover should NOT call medsense.intake (endpoint removed).
- main.py: stop using livechat room info to resolve patient userId for private rooms. Use userId from webhook payload/context instead.
- rocketchat_client.py: remove get_available_teams and /medsense/available_teams usage.

#### Server (medsense.webchat)
- apps/meteor/app/lib/server/startup/medsense.ts:
  - Replace pendingTeamId usage with pendingPharmacyId for auto-take/auto-resolve.
  - Audit entries should store pharmacyId (not teamId).
- apps/meteor/app/api/server/v1/medsense.ts:
  - Remove medsense/available_teams and medsense/pharmacies.available_teams routes (no teams).
  - Remove medsense/pharmacies.teams.create route (team creation no longer used).
  - pending.mine should not map teamId or expose legacy team fields.
  - audit.list should drop teamId filter if not used.

#### UI (medsense.webchat)
- apps/meteor/client/views/medsense/queue/QueuePage.tsx:
  - Show pendingReason (from API) instead of urgency (API does not return urgency).
  - Display status label as 

### 2026-01-20: Request-Record Queue Plan (Replace Room Pending + Audit)

**Decision summary**
- Use a dedicated MedsenseRequest record (single source of truth).
- Keep only `room.medsenseActiveRequestId` and `room.medsenseActiveRequestStatus`.
- Statuses: `pending` → `taken` → `closed` (manual close only from Followed tab).
- Enforce one active request per room; reject simultaneous requests.
- History is request-based and expands to show full action log.
- Webhook payload only includes the two room fields above.
- Remove `medsense-create-pharmacy-teams` permission.
- Replace role setting with permissions: `medsense-view-request`, `medsense-take-request`, `medsense-close-request`.

**Model changes**
- Add `IMedsenseRequest` in `packages/core-typings/src/IMedsenseRequest.ts`.
- Add `IMedsenseRequestModel` in `packages/model-typings/src/models/`.
- Add `MedsenseRequests` model in `packages/models/src/models/`.
- Register in `packages/models/src/index.ts` + `apps/meteor/server/models.ts` if needed.

**Room fields**
- `room.medsenseActiveRequestId`
- `room.medsenseActiveRequestStatus`

**API changes (`apps/meteor/app/api/server/v1/medsense.ts`)**
- Add:
  - `POST medsense/request.set` (create request, reject if active exists)
  - `GET medsense/request.list` (status=pending, by pharmacy)
  - `GET medsense/request.followed` (status=taken, by pharmacy)
  - `POST medsense/request.close` (status=closed, clears room fields)
  - `GET medsense/request.history` (status=closed, list requests)
- Remove:
  - `medsense/pending.*`
  - `medsense/audit.*`

**Auto-take on join (`apps/meteor/app/lib/server/startup/medsense.ts`)**
- If user has `medsense-take-request` and room has active request in `pending`, mark request as `taken` and update room status.
- No auto-close on leave (manual close only).

**UI changes (`apps/meteor/client/views/medsense/queue/QueuePage.tsx`)**
- Rename Live Queue tab → `Waiting` (status=pending).
- Add `Followed` tab (status=taken) with `Close` button.
- History tab lists closed requests; expand row to show full action log.
- Show queue only if user has `medsense-view-request`.

**Webhook payload (`apps/meteor/app/integrations/server/lib/triggerHandler.ts`)**
- Include only:
  - `room.medsenseActiveRequestId`
  - `room.medsenseActiveRequestStatus`

**Orchestrator changes**
- Replace `pending.set` with `request.set` calls.
- Send: `roomId`, `pharmacyId`, `requestedByUserId`, `requestedByUsername`, `reason`.

#### Orchestrator (pharmacy‑only, no teams, no livechat visitor token)

main.py

_build_form_payload_with_gemini system prompt: remove “available_teams / teamName / teamId” rules; replace with “available_pharmacies / pharmacyName / pharmacyId”.
_execute_escalation_agent: stop using get_livechat_room_info to resolve patient; use the room customFields (from webhook payload) or call a rooms.info/rooms.get endpoint for non‑livechat rooms.
_execute_confirmed_escalation: pass pharmacy_id from the prompt flow; keep reason as pendingReason; remove any “team” wording in bot response.
rocketchat_client.py

Remove/avoid livechat‑specific helpers (get_livechat_room_info, get_or_create_livechat_room, visitor_token usage) in pending flow; add a room‑info helper for standard rooms if needed.
Ensure set_pending_status uses pharmacyId only.
start-local-dev.sh

Drop MEDSENSE_TEAM_IDS and RC_INTAKE_ROOM_KEY env vars (legacy). Keep only pharmacy‑based settings.
Webchat API (queue endpoint cleanup)

medsense.ts
Remove MedsensePharmacyTeams import (unused).
In pending.set, remove $unset: { pendingTeamId: '' } (no teams).
In pending.mine, remove any team mapping remnants (already mostly pharmacy‑only; verify no teamId fields returned).
Optional: add/confirm pendingStatus='resolved' is excluded from list endpoints (already only “pending”).
Webchat UI (remove sidebar queue, add home tab badge, hide history)

useRoomList.ts

Remove “Pending_Queue” group and useMedsensePendingQueue hook usage so it no longer shows in sidebar or adds fake rooms.
useMedsensePendingQueue.ts

Remove or repurpose to provide counts for the Home tab badge only (no sidebar injection).
DefaultHomePage.tsx

Add a badge to the “Chat Queue” tab based on count from pending.mine for the selected pharmacy.
Default tab to queue for pharmacy staff (already done), but remove or hide History tab in queue page.
QueuePage.tsx

Hide History tab (always show Live Queue).
Display status label as “Waiting for staff”.
Add “Pharmacy” column if needed for multi‑pharmacy (optional if you always filter by selected pharmacy).
Webhook (ignore taken/resolved rooms)

server.js
In /rocketchat and /medsense_chat/integrated, check payload.room?.customFields?.pendingStatus (from outgoing webhook) and ignore when taken or resolved.
Ensure you’re using the integrated webhook payload that includes room.customFields (now added).


## Request-Record Queue System Refactor (2026-01-20)
- **Goal**: Replaced legacy room-based pending system with a persistent `MedsenseRequests` model.
- **Backend**:
  - Created `MedsenseRequests` model (`medsense_requests` collection).
  - Implemented new APIs: `request.set`, `request.list` (Waiting), `request.followed` (Taken), `request.close`, `request.history`.
  - Removed legacy APIs: `pending.*`, `audit.*`, `available_teams`.
- **Room Logic**:
  - Added lightweight pointers `medsenseActiveRequestId` and `medsenseActiveRequestStatus` to Room.
  - Implemented `afterAddedToRoom` callback for "Auto-take" when staff joins.
- **UI (`apps/meteor/client/views/medsense`)**:
  - **QueuePage.tsx**: Complete refactor. Added "Waiting", "Followed", and "History" tabs. Updated "Take" and "Close" actions.
  - **DefaultHomePage.tsx**: Updated "Chat Queue" badge to use `request.list`.
- **Orchestrator**:
  - Updated `rocketchat_client.py` to use `medsense/request.set` with `requestedByUsername`.
  - Updated `main.py` escalation logic.
- **Permissions**:
  - Added `medsense-view-request`, `medsense-take-request`, `medsense-close-request`.
  - Removed `Medsense_Staff_Roles` setting and `medsense-create-pharmacy-teams` permission.