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

## Medsense Hub (toolbar app entry point)
- Goal: add a top-toolbar “Medical” icon that opens a dropdown of available private apps (hub actions), not the apps directly.
- Permission: create `medsense-view-hub` (grant to admin for now) to gate icon/dropdown visibility.
- Core UI:
  - Add MedicalIcon button near “Create new”.
  - On click, fetch available hub actions and render dropdown (label, optional icon, permission-filtered).
  - On select, call server to execute the action (opens app modal via UIKit).
- Server bridge:
  - Add API `/api/v1/medsense/hub.actions` to list actions from Apps-Engine registry.
  - Add API `/api/v1/medsense/hub.execute` to trigger an action and return a UIKit view.
- Apps-Engine contract:
  - “Medsense Hub” app exposes actions (id, label, optional icon, order, requiredPermissions) and an execute handler returning a UIKit modal.
  - Future private apps register actions with the hub—no core rebuild needed.
- Mock app for feasibility (new folder `medsense-chat-local/medsense-hub-app/`):
  - Settings: topics JSON (or remote URL) to render modal options.
  - Endpoint returns a mock modal (title “Medsense Hub”, a couple of dummy buttons).
- Files to touch (core):
  - Permission defaults: `apps/meteor/app/lib/server/startup/*permissions*.ts` (add `medsense-view-hub`).
  - Toolbar/dropdown: component rendering create-new icons (NavBar V2/toolbar) → add MedicalIcon + dropdown.
  - API bridge: `apps/meteor/app/api/server/v1/medsense.ts` → add `hub.actions` + `hub.execute`.
- Files to touch (hub app):
  - `medsense-chat-local/medsense-hub-app/app.json`
  - `src/MedsenseHubApp.ts` (register HTTP endpoint + UIKit logic)
  - `src/endpoints/HubActionsEndpoint.ts`, `HubExecuteEndpoint.ts`
  - `src/ui/views/*` for modal payload builders.

### Fix list (current gaps to correct)
- Replace mock UIKit modal payload in core with either:
  - a real Apps‑Engine modal (requires `appId` + `id` in view), or
  - a standard core modal (if staying core‑only during mock).
- Replace toolbar `plus` icon with `MedicalIcon` (custom trigger element) and keep dropdown behavior.
- Move hub actions data source out of hardcoded mock list and into hub app endpoint (`/api/apps/public/<appId>/hub.actions`).
- Ensure `medsense-view-hub` permission is created once at startup and assigned to `admin` only.

### Confirm later (quick validation checklist)
- Icon only shows for users with `medsense-view-hub`.
- Clicking icon opens dropdown of actions (no direct modal).
- Selecting an action opens modal successfully (no console errors).
- Modal submit/close triggers app callbacks (if Apps‑Engine path).
- Hub actions reflect app settings or remote JSON without core rebuild.

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

### Fix list (current gaps to correct)
- Replace mock UIKit modal payload in core with either:
  - a real Apps‑Engine modal (requires `appId` + `id` in view), or
  - a standard core modal (if staying core‑only during mock).
- Replace toolbar `plus` icon with `MedicalIcon` (custom trigger element) and keep dropdown behavior.
- Move hub actions data source out of hardcoded mock list and into hub app endpoint (`/api/apps/public/<appId>/hub.actions`).
- Ensure `medsense-view-hub` permission is created once at startup and assigned to `admin` only.

### Confirm later (quick validation checklist)
- Icon only shows for users with `medsense-view-hub`.
- Clicking icon opens dropdown of actions (no direct modal).
- Selecting an action opens modal successfully (no console errors).
- Modal submit/close triggers app callbacks (if Apps‑Engine path).
- Hub actions reflect app settings or remote JSON without core rebuild.

---

### Build Details (v1 Implementation - Dynamic)
- **Status**: Implemented dynamic discovery. Core relays to ANY installed app exposing `hub.actions`.
- **Permissions**:
  - `medsense-view-hub` (Admin).
- **Server API**:
  - `/v1/medsense/hub.actions`: Queries **all enabled apps** for a public endpoint `api/apps/public/<appId>/hub.actions`. Aggregates results. Prefixes IDs with `appId:`.
  - `/v1/medsense/hub.execute`: Parses `appId:actionId`, routes execution to `api/apps/public/<appId>/hub.execute`.
- **Medsense Hub App**:
  - Created at `d:\medsense-chat-local\medsense-hub-app`.
  - Exposes `hub.actions` (list) and `hub.execute` (modal).
  - Must be installed via `rc-apps deploy`.
- **Client UI**:
  - `NavBarItemMedsenseHub` uses `MedicalIcon` inside a Fuselage `Menu`.
  - Fetches actions via hook, displays them with icons.
  - Clicking action triggers `hub.execute` -> returns mapped UIKit Modal.

### Hub Build Review (2026-01-22)
- **Confirmed in code**:
  - Dynamic discovery in `apps/meteor/app/api/server/v1/medsense.ts` uses `/api/apps/public/<appId>/hub.actions` + `/hub.execute`.
  - UI entry uses `MedicalIcon` in `NavBarItemMedsenseHub` + `Menu`.
  - Permission `medsense-view-hub` created in `apps/meteor/app/lib/server/startup/medsense.ts`.
- **Fix list (if issues appear)**:
  - Ensure the Hub app is deployed via `rc-apps deploy` and endpoints are reachable from core.
  - If actions show but modals fail, verify `hub.execute` returns a UIKit view with valid `appId` + `id`.
  - If icon missing, confirm `NavBarItemMedsenseHub` is rendered in `NavBarPagesGroup` and permission assigned.
- **Confirm later**:
  - Hub icon visible only for users with `medsense-view-hub`.
  - Clicking icon opens dropdown (no modal).
  - Selecting action opens modal without console errors.

## Medsense Clinical Flow + SmartForms Inline Forms (Plan)

### End-to-end flow (UTI example)
1) Triage detects clinical intent (e.g., UTI) and posts a **confirmation inline form** in the patient room.
2) **No request record yet**. Confirmation timeout ends the flow if the patient does not confirm.
3) Patient confirms -> create **request record**:
   - status=pending
   - patientStage=pre_assessment
   - reason from triage
   - nswers empty
   - contextSummary seeded
4) Orchestrator/SmartForms posts **one inline form message per step** (no modal). Each step:
   - uses fixed required fields, but dynamic labels and helper text
   - updates nswers + contextSummary
   - advances patientStage when complete (e.g., pre_assessment -> waiting_staff).
5) Queue shows request when status=pending.
6) Staff takes -> status=taken, add staff to room, AI stops.
7) Staff closes -> status=closed, remove staff from room, move to history.
8) Pre-assessment timeout: if still in pre_assessment after expiry, auto-close.

### Implementation plan (junior dev tasks)

#### 1) Request model + typings (DONE)
- Add/confirm fields (request record only; room fields limited to medsenseActiveRequestId/Status):
  - patientStage (string enum)
  - contextSummary (string)
  - answers (object)
  - currentStepId (string, optional)
  - preAssessmentExpiresAt (Date, optional)
- Files:
  - packages/core-typings/src/IMedsenseRequest.ts (Updated)
  - packages/model-typings/src/models/IMedsenseRequestsModel.ts (Updated)
  - packages/models/src/models/MedsenseRequests.ts (Updated)
  - packages/models/src/index.ts

#### 2) Server API (medsense) (DONE)
- Ensure request endpoints include new fields in create/update and list outputs.
- Add helper method to update answers, contextSummary, patientStage, currentStepId.
- Add periodic cleanup to auto-close expired pre-assessments.
- Files:
  - apps/meteor/app/api/server/v1/medsense.ts (Updated request.set & added request.update)
  - apps/meteor/app/lib/server/startup/medsense.ts (permissions, scheduled job setup)

#### 3) SmartForms app: inline-only forms
- Remove modal/UIKit view usage for SmartForms intake steps.
- Post **inline block form** message per step (static_select / multi_static_select / plain_text_input).
- Handle submission via executeBlockActionHandler.
- Validate required fields; if missing, re-post same step with error note.
- On submit, call request update API to persist answers + contextSummary + patientStage.
- Files:
  - d:/medsense-chat-local/smart-forms-app/SmartFormsApp.ts
  - d:/medsense-chat-local/smart-forms-app/src/... (inline block builders / submit handlers)
  - d:/medsense-chat-local/smart-forms-app/app.json (remove modal-related permissions)

#### 4) Orchestrator updates
- Confirmation step posts inline form (no modal).
- On confirm: create request with patientStage=pre_assessment + preAssessmentExpiresAt.
- On each step: pass summary + required_fields to Gemini; validate response.
- Update request record after each step.
- Files:
  - d:/medora-build/medsense-orchestrator/main.py
  - d:/medora-build/medsense-orchestrator/rocketchat_client.py

#### 5) Queue UI (request record source)
- Use request record fields (patientStage, contextSummary, answers) for display.
- Keep status for Waiting/Followed/History tabs.
- Files:
  - apps/meteor/client/views/medsense/queue/QueuePage.tsx

### Confirmation checklist (for junior dev)
- Confirm form appears inline in room and submits without modal.
- Request created **only after confirm**; no request if user times out or declines.
- Pre-assessment steps are inline messages; required fields validated.
- Request record updates with answers + contextSummary each step.
- patientStage transitions: pre_assessment -> waiting_staff.
- Queue shows pending request with summary + reason.
- Staff take sets status=taken and adds staff to room.
- Close removes staff and sets status=closed (moves to history).
- Pre-assessment timeout auto-closes stale requests.


### Review Findings (Post-Junior Build)
- SmartForms still modal-based: d:/medsense-chat-local/smart-forms-app/SmartFormsApp.ts still builds/updates modal views (openModalViewResponse/updateModalViewResponse). This conflicts with the plan for inline-only block forms.
- Orchestrator still targets SmartForms modal flow: d:/medora-build/medsense-orchestrator/main.py still posts SmartForms payloads and handles modal submissions (/forms/submit, Smart Forms Agent). Needs alignment to inline block submissions if we remove modals.
- Pre-assessment auto-close not implemented: no scheduler/cleanup found in apps/meteor/app/lib/server/startup/medsense.ts for preAssessmentExpiresAt. Current request.set hardcodes 15 min expiry but nothing enforces it.
- patientStage enum mismatch: typings include in_consultation, plan mentions with_staff. Decide and align enums and UI labels.
- Request update permissions: medsense/request.update currently gates on medsense-take-request (plus bot role). Consider dedicated permission (medsense-update-request) or explicitly allow orchestrator/service accounts.
- Queue UI not using contextSummary/answers: apps/meteor/client/views/medsense/queue/QueuePage.tsx shows reason only. If summary should be displayed, update UI to prefer contextSummary when present.
- DEV_NOTES text corruption: plan section contains control characters in words like answers/apps. Clean up those lines to avoid copy/paste issues for junior dev.

### Orchestrator payload examples (minimal)
#### 1) Orchestrator -> SmartForms (post into room)
```json
{
  "text": "A few more questions",
  "medsenseForm": {
    "requestId": "req_9f7c0b",
    "flowId": "uti",
    "roomId": "69652e0c8352dcb643ebc028",
    "aiFormRound": 2,
    "patientStage": "pre_assessment",
    "form": {
      "id": "uti-round-2",
      "fields": [
        { "type": "single_select", "id": "fever", "label": "Do you have a fever?", "options": ["yes", "no"] }
      ]
    }
  }
}
```

#### 2) Orchestrator -> Request record update
```json
{
  "requestId": "req_9f7c0b",
  "aiFormRound": 2,
  "patientStage": "pre_assessment",
  "summary": "Burning and frequency x3 days. Need to rule out fever."
}
```

#### 3) SmartForms -> /forms/submit (to webhook/orchestrator)
```json
{
  "medsenseForm": {
    "requestId": "req_9f7c0b",
    "flowId": "uti",
    "roomId": "69652e0c8352dcb643ebc028",
    "aiFormRound": 2,
    "patientStage": "pre_assessment",
    "form": { "id": "uti-round-2" },
    "answers": [
      { "id": "fever", "value": "no" }
    ],
    "freeText": ""
  }
}
```

### Flow: Webhook -> Orchestrator -> UTI agent (new medsenseForm schema)
#### Webhook (`d:/medora-build/medsense_webhook/server.js`)
- `/forms/submit` should **pass through** the `medsenseForm` payload untouched to `ORCHESTRATOR_URL/forms/submit`.
- No role/bot filtering for `/forms/submit` (that filter is only for `/rocketchat`).
- Keep `X-Rocketchat-Secret` header forwarding as-is.

#### Orchestrator (`d:/medora-build/medsense-orchestrator/main.py`)
- In `/forms/submit`, detect `medsenseForm`:
  - If present, **bypass** `_pending_forms` + old SmartForms `formId/steps/context` flow.
  - Validate: `requestId`, `flowId`, `roomId`, `form.id`, `answers`.
- Fetch request context before routing:
  - Add `get_request_info(requestId)` in `rocketchat_client.py` and call it here.
  - Merge request context + `answers` + `aiFormRound` + `patientStage` into agent input.
- Route by `flowId`:
  - `uti` -> `_execute_uti_assessment_agent` / `_execute_uti_assessment_apply`.
  - Other flows can plug into the same pattern later.
- Enforce `Medsense_AI_Form_Rounds_Limit` using `aiFormRound` (reject/escalate if exceeded).
- After agent response:
  - Call `medsense/request.update` to persist `summary`, `patientStage`, `aiFormRound`, `currentStepId`, and `answers`.
  - Post next form into room using **new** `medsenseForm` shape (see examples).

#### Rocket.Chat client (`d:/medora-build/medsense-orchestrator/rocketchat_client.py`)
- Add:
  - `get_medsense_request(request_id)` -> GET `/api/v1/medsense/request.info`
  - `update_medsense_request(payload)` -> POST `/api/v1/medsense/request.update`
- Keep `create_medsense_request` for confirm step (request.set).

#### UTI agent (`d:/medora-build/medsense-orchestrator/uti_assessment.py` + main.py wrappers)
- Input should be **pure data** (no network calls):
  - `requestId`, `aiFormRound`, `patientStage`, `summary`, `answers`, `requirements`.
- Output should include:
  - `nextStage` (patientStage), `summary`, `nextForm` (fields array).
- Agent does **not** update request or post messages directly; orchestrator does.

#### Required fields checklist (for new medsenseForm flow)
- Inbound `/forms/submit` payload must include:
  - `medsenseForm.requestId`
  - `medsenseForm.flowId`
  - `medsenseForm.roomId`
  - `medsenseForm.form.id`
  - `medsenseForm.answers` (array; allow empty if freeText is used)
- If any required fields are missing, return `400 { error: "invalid_medsense_form" }`.

#### Orchestrator implementation detail (suggested logic)
1) Receive `/forms/submit`:
   - If `medsenseForm` is present -> use new flow.
   - Else -> fallback to legacy SmartForms `_pending_forms` (until removed).
2) Validate required fields.
3) Call `get_medsense_request(requestId)`; if not found -> 404.
4) Enforce `Medsense_AI_Form_Rounds_Limit` using `aiFormRound`; if exceeded:
   - Update request: `patientStage="waiting_staff"` and summary explaining escalation.
   - Post a short message to room (“We’re connecting you to staff”).
5) Build agent input from request + answers:
   - Include `summary`, `aiFormRound`, `patientStage`, and last `answers`.
6) Call agent by `flowId` (UTI).
7) Persist agent output:
   - `request.update` with `summary`, `patientStage`, `aiFormRound+1`, `currentStepId`, `answers`.
8) Post next form into room using `medsenseForm` (minimal schema).

#### Request update vs staff actions
- `medsense/request.update`: orchestrator-only fields (summary, patientStage, aiFormRound, answers).
- `medsense/request.take` / `medsense/request.close`: staff actions (status transitions).

### 2026-01-23: Clinical Flow Implementation Status (Completed)

#### Summary
Implemented the "Medsense Clinical Flow" enabling stateless, inline-only assessment forms driven by the Orchestrator. This replaces the modal-based SmartForms flow for clinical assessments.

#### Components Delivered
1.  **Server API (`medsense.webchat`)**
    -   Added `GET /api/v1/medsense/request.info` to fetch request context by ID.
    -   Verified `request.set` and `request.update` support new fields (`patientStage`, `contextSummary`, `answers`).

2.  **Orchestrator (`medsense-orchestrator`)**
    -   **`main.py`**:
        -   Implemented `_handle_medsense_form_submit` to process inline form submissions.
        -   Added `_execute_uti_assessment_agent` for stateless agent logic.
        -   Enforced `MEDSENSE_AI_FORM_ROUNDS_LIMIT` (default 5).
    -   **`uti_assessment.py`**:
        -   Refactored to expose `get_consent_prompt`, `get_symptom_prompt`, etc. as public helpers.
    -   **`rocketchat_client.py`**:
        -   Added `get_medsense_request` and `update_medsense_request` wrappers.

3.  **SmartForms App (`smart-forms-app`)**
    -   **`SmartFormsApp.ts`**:
        -   Updated `executePostMessageSent` to detect and normalize `customFields.medsenseForm` into a renderable payload.
        -   Updated `submitFormPayload` to preserve the `medsenseForm` structure during submission to `/forms/submit`.
        -   Confirmed inline rendering works without modals.

#### Verification
-   Orchestrator successfully posts `medsenseForm` payloads.
-   SmartForms renders them as inline blocks.
-   Submissions flow back to Orchestrator -> Agent -> Request Update -> Next Form.

### 2026-01-24: Medsense Hub & UTI App Implementation (Completed)

#### Summary
Implemented the **Medsense Hub** ecosystem and the **UTI Assessment App** as its first module. The architecture decouples the app logic from the Orchestrator via a public Webhook.

#### Components Delivered
1.  **Medsense Webhook (`medsense_webhook`)**
    -   Added `POST /flow/start` endpoint to forward flow initiation requests to the Orchestrator (validated by secret).

2.  **Orchestrator (`medsense-orchestrator`)**
    -   Added `POST /flow/start` endpoint in `main.py`.
    -   Maps `flowId="uti"` to `_execute_uti_assessment_entry`.
    -   Initiates the flow by posting a confirmation form to the provided room (or resolving one via `patientUserId`).

3.  **Medsense UTI App (`medsense-uti-app`)**
    -   **Registry**: Implemented `HubActionsEndpoint` to register "UTI Assessment" with the Hub.
    -   **UI**: Implemented `HubExecuteEndpoint` returning a Modal with a Patient Picker.
    -   **Logic**: Implemented `executeViewSubmitHandler` to capture patient selection and call the Webhook.
    -   **Lib**: Created `WebhookApi.ts` to abstract `POST /flow/start` calls.

#### Architecture Flow
1.  User clicks "UTI Assessment" in Hub Dropdown.
2.  Core calls `HubExecuteEndpoint` -> App returns Modal.
3.  User selects Patient -> Click Start.
4.  App calls `WebhookApi.startFlow`.
5.  Webhook forwards to Orchestrator `/flow/start`.
6.  Orchestrator posts Confirmation Form to Room.
7.  Patient confirms -> Standard Clinical Flow takes over.

#### Next Steps
-   Deploy `medsense-uti-app` via `rc-apps deploy`.
-   Verify end-to-end connectivity in staging.
---
## Medsense Hub + UTI App – Framework Spec (Junior Dev)

### Goal
Implement a **separate UTI app** that plugs into the Medsense Hub dropdown (toolbar icon). The hub app stays generic and only lists installed hub apps. The UTI app launches the clinical flow using SmartForms + Orchestrator + request records.

### Core Flow (End-to-End)
1) Hub action: User opens Medsense Hub dropdown, selects UTI Assessment.
2) App action: Hub app opens a UIKit modal (confirm “Start UTI assessment?”).
3) Create room: Create (or reuse) a patient chat room with bot (private).
4) Confirm form: Orchestrator posts a static confirm form in the room (SmartForms inline).
5) Patient confirms: SmartForms submits to Orchestrator `/forms/submit` with `medsenseForm`.
6) Create request: Orchestrator creates a request record with `status="ai_preassessment"`.
7) Dynamic rounds: Orchestrator calls UTI agent each round to generate next form + summary.
8) Staff handoff: When form completes or round limit reached, request status -> `waiting_staff`.
9) Queue UI: Request shows in Waiting tab with status label (e.g. “AI preassessment”).

### Request Schema (Minimal)
- requestId
- flowId = `uti`
- roomId
- status: `waiting_patient`, `ai_preassessment`, `waiting_staff`, `taken`, `closed`
- aiFormRound (int)
- contextSummary (string)
- answers (object map field_id -> value/array)

### Hub App Contract (Generic Hub)
- Hub app only lists installed hub apps and proxies execution.
- Expose:
  - `hub.actions`: list of actions `{ id, label, icon?, order? }`
  - `hub.execute`: accepts `{ actionId }` and returns a UIKit modal

### UTI App Contract (Separate App)
- Expose:
  - `hub.actions`: returns UTI action (label “UTI Assessment”).
  - `hub.execute`: returns UIKit modal with Start/Cancel.
- On Start: call Orchestrator REST to create room / post confirm form.

### SmartForms Payload (Inbound from Orchestrator)
- In message `custom_fields.medsenseForm`:
  - requestId, flowId, roomId
  - form: { id, fields: [{ id, type, label, options? }] }
- Field types:
  - single_static_select, multi_static_select, text

### SmartForms Payload (Submit to Orchestrator)
POST `/forms/submit`:
```
{
  "medsenseForm": {
    "requestId": "...",
    "flowId": "uti",
    "roomId": "...",
    "form": { "id": "..." },
    "answers": [{ "id": "field_id", "value": "string|array" }],
    "freeText": "string?"
  }
}
```

### Orchestrator Expectations
- Validate required fields: `roomId`, `form.id`, non-empty `answers`.
- Load request by requestId.
- Update:
  - aiFormRound (top-level)
  - answers merge (multi-select preserved)
  - contextSummary
  - status -> `ai_preassessment` if next form, else `waiting_staff`
- Post next form with `custom_fields.medsenseForm`.

### Queue UI Expectations
- Use request status to show:
  - Waiting tab (waiting_patient/ai_preassessment/waiting_staff)
  - Followed tab (taken)
  - History tab (closed)
- Display labels:
  - waiting_patient -> “Waiting for patient”
  - ai_preassessment -> “AI preassessment”
  - waiting_staff -> “Waiting for staff”
  - taken -> “Taken”
  - closed -> “Closed”

### Permissions
- medsense-view-hub (hub icon visibility)
- medsense-view-request (queue visibility)
- medsense-take-request, medsense-close-request (actions)

### Files to Touch (Core)
- `apps/meteor/client/navbar/...` for hub icon + dropdown.
- `apps/meteor/app/api/server/v1/medsense.ts` for hub endpoints if needed.
- `apps/meteor/app/lib/server/startup/medsense.ts` for permissions.
- `apps/meteor/client/views/medsense/queue/QueuePage.tsx` for status labels.

### Files to Touch (Hub App - Generic)
- `medsense-chat-local/medsense-hub-app/app.json`
- `medsense-chat-local/medsense-hub-app/src/MedsenseHubApp.ts`
- `medsense-chat-local/medsense-hub-app/src/endpoints/HubActionsEndpoint.ts`
- `medsense-chat-local/medsense-hub-app/src/endpoints/HubExecuteEndpoint.ts`
- `medsense-chat-local/medsense-hub-app/src/ui/views/*` (modal layout)

### Files to Touch (UTI App - New App)
- `medsense-chat-local/medsense-uti-app/app.json`
- `medsense-chat-local/medsense-uti-app/src/MedsenseUtiApp.ts`
- `medsense-chat-local/medsense-uti-app/src/endpoints/HubActionsEndpoint.ts`
- `medsense-chat-local/medsense-uti-app/src/endpoints/HubExecuteEndpoint.ts`
- `medsense-chat-local/medsense-uti-app/src/ui/views/*` (modal layout)

### Verification Checklist
- Hub dropdown shows UTI action.
- Clicking action opens modal.
- Start creates room and posts confirm form.
- Confirm submission creates request and posts next form.
- Queue shows request with "AI preassessment".
- Round limit -> status `waiting_staff`.

---

## Queue Preview + Decline + Status Colors (2026-01-25)

### Features Added
- **Preview Modal**: Staff can preview request context summary before taking (shows patient info, issue, and AI assessment summary)
- **Decline Modal**: Staff can decline pending requests with a reason, which posts a message to the room and closes the request
- **Status Colors Setting**: `Medsense_Queue_Status_Colors` admin setting (JSON) controls Tag colors in Queue UI
- **New Status**: `ready_for_staff` status indicates assessment is complete and ready for pharmacist review

### Files Modified

**Orchestrator (`medsense-orchestrator`):**
- `main.py`: Context summaries now append per round (with `---` separator), final status is `ready_for_staff`

**Core Typings:**
- `packages/core-typings/src/IMedsenseRequest.ts`: Added `ready_for_staff` to status union

**Models:**
- `packages/models/src/models/MedsenseRequests.ts`: Updated `findPendingByPharmacyId` and `findActiveByRoomId` to include `ready_for_staff`

**API:**
- `apps/meteor/app/api/server/v1/medsense.ts`:
  - Updated `request.take` to accept `ready_for_staff` status
  - Added `request.decline` endpoint (posts decline message, closes request)

**Settings:**
- `apps/meteor/app/lib/server/startup/medsense.ts`:
  - Added `Medsense_Queue_Status_Colors` JSON setting
  - Updated status checks to include `ready_for_staff`

**UI:**
- `apps/meteor/client/views/medsense/queue/QueuePage.tsx`:
  - Added Preview button + modal showing context summary
  - Added Decline button + modal with textarea for reason
  - Status label includes "Ready for staff"
  - Tag colors read from `Medsense_Queue_Status_Colors` setting via `useStatusColors` hook

### Status Color Setting (Admin → Settings → Message → Medsense)
Default value:
```json
{
  "waiting_patient": "warning",
  "ai_preassessment": "secondary", 
  "waiting_staff": "warning",
  "ready_for_staff": "featured",
  "taken": "primary",
  "closed": "secondary"
}
```

Available variants: `primary`, `secondary`, `danger`, `warning`, `secondary-danger`, `featured`

---

## Medsense Settings UI + Phone Number Integration (2026-01-26)

### Features Added
- **Interactive Status Colors Table**: Replaced raw JSON input for `Medsense_Queue_Status_Colors` with a custom Table UI in Admin Settings.
  - Located in: Admin > Settings > Message > Medsense
  - Includes live preview tags and dropdowns for color selection.
- **Queue Page Cleanup**: Removed configuration button/modal from Queue Page to declutter usage.
- **Phone Number Field Integration**:
  - Added new `PhoneNumberInput` component (with country flag/code selector) to:
    - **User Profile**: Below Email field.
    - **Registration Form**: Below Email field.
  - Automatically formats numbers to E.164.
  - Saves to `user.customFields.phone`.

### Files Modified & Created

**Registration Package (`packages/web-ui-registration`):**
- **New Component**: `src/components/PhoneNumberInput/PhoneNumberInput.tsx` (supports International/National formatting).
- **Dependencies**: Added `google-libphonenumber` and `@types/google-libphonenumber`.
- `src/RegisterForm.tsx`: Added phone number field and custom fields mapping payload.
- `src/index.ts`: Exported `PhoneNumberInput`.

**Core App (`apps/meteor`):**
- `client/views/account/profile/AccountProfileForm.tsx`: Added phone number field using the new component.
- `client/views/admin/settings/Setting/MemoizedSetting.tsx`: Intercepts `Medsense_Queue_Status_Colors` setting ID to render the custom `MedsenseStatusColorInput` component.
- `client/views/admin/settings/Setting/inputs/MedsenseStatusColorInput.tsx`: New component rendering the configuration table.
- `client/views/medsense/queue/QueuePage.tsx`: Reverted configuration UI (removed button/modal).

**Important Note**:
- **Build**: Added `google-libphonenumber` to workspace dependencies. Requires `yarn install` in root if "Module not found" or "sharp" errors occur.

---

## Twilio SMS Invitation Integration (2026-01-26)

### Server-Side Integration (`apps/meteor`)
- **New API Endpoint**: `POST /api/v1/medsense/invite.sms`
  - Inputs: `roomId`, `phoneNumber`, `requestedBy`.
  - **Logic**: Generates real invite link (`findOrCreateInvite`) and sends SMS using server's Twilio settings.
  - **Validation**: Enforces E.164 phone format.

### Orchestrator (`medsense-orchestrator`)
- **Flow Update**: `flow_start` simplified.
  - Passes `roomId` and `contactPhone` (from modal input only) to server.
  - No longer constructs URLs or handles `fromNumber` locally.
- **Client Wrapper**: Simplified `send_invite_sms` to remove unneeded arguments.

### UTI App (`MedsenseUtiApp`)
- **Strict Logic**: Modal submission now strictly uses the input field value for `contactPhone`, ensuring "Modal is Source of Truth" and preventing profile fallbacks.
