# Investigation Summary: Intake Smoke Test

**Date**: 2026-01-14

## Context
The user requested a smoke test to verify posting messages to an "intake team channel".

## Findings
- **"Intake" Feature**: Not found as a distinct code module. `DEV_NOTES.md` indicates `POST /api/v1/teams.create` accepts flags to create intake channels.
- **Relevant Files**:
    - `apps/meteor/app/api/server/v1/teams.ts`: Likely handles the team creation flags.
    - `apps/meteor/app/api/server/v1/medsense.ts`: MedSense specific API endpoints.
- **Testing**: No existing "smoke" suite found. `apps/meteor/tests/e2e/messaging.spec.ts` contains relevant patterns for message posting tests.

## Next Actions
1.  Inspect `teams.ts` to find the exact parameter for intake channel creation.
2.  Implement the smoke test (likely in `scripts/smoke-intake.sh` or a new e2e test).

### 2026-01-14: Medsense Settings & Bot Integration
- **Medsense Settings Migration**:
    - Created `apps/meteor/app/lib/server/startup/medsense.ts` to define Medsense-specific settings in code, replacing manual DB entries.
    - Implemented **dynamic bot fetching**: `Medsense_Bot_User` dropdown now populates at startup by querying users with `roles: 'bot'`.
    - Removed deprecated `Medsense_Sign_In_Role_*` settings from both code and database.
    - Fixed build issues by ensuring proper `Meteor.startup` usage and correct import paths.
- **Team Creation Logic**:
    - Updated `teams.ts` to automatically add the configured bot user (from `Medsense_Bot_User`) to the **#intake** channel upon team creation.
- **Orchestrator Analysis**:
    - Confirmed Orchestrator triggers intake flows via `/escalation/debug/takeover`.
    - It delegates the UI work to the Smart Forms App via the `medsense.intake` webhook, passing `teamId` and `patientRoomId`.

### 2026-01-14: Smart Forms & Intake Escalation Setup
**Critical Configuration & Setup Instructions**

#### 1. Environment Variables (Orchestrator)
Ensure these are set in your execution environment (e.g., `start-local-dev.sh` or Docker):
- `MEDSENSE_INTAKE_URL`: The full URL to the Smart Forms App intake webhook.
    - Example: `http://localhost:3000/api/apps/public/<app-id>/medsense.intake`
- `MEDSENSE_TEAM_IDS`: Comma-separated list of Team IDs that the Orchestrator manages.
    - Example: `69682923529747ba8f30aceb`
- `RC_SECRET`: Shared secret for authenticating with the Webhook and App.
    - Must match the `medsense_shared_secret` setting in the Smart Forms App.
    - Example: `medsense`

#### 2. Bot User Permissions (Rocket.Chat)
The bot user (configured via `Medsense_Bot_User` setting or `RC_BOT_USERNAME` env) requires specific permissions to properly manage escalations and check team availability.
**Required Permissions:**
- `view-all-teams`: To query the list of teams.
- `transfer-livechat-guest` OR `edit-omnichannel-contact`: To access the restricted `medsense/available_teams` endpoint.
- `view-l-room`: To view Livechat rooms.
- `view-p-room`: To view private channels (intake channels).
- `preview-c-room`: To check public channels.

*Note: The startup script `apps/meteor/app/lib/server/startup/medsense.ts` attempts to grant `view-all-teams`, `transfer-livechat-guest`, and `edit-omnichannel-contact` to the 'bot' role automatically.*

#### 3. Smart Forms App Configuration
- **Medsense Webhook URL**: Point this to your Webhook Forwarder (e.g., `http://host.docker.internal:8081/rocketchat`).
- **Medsense Shared Secret**: Must match `RC_SECRET`.

#### 4. Custom API Endpoints (Medsense Webchat)
- `GET /api/v1/medsense/available_teams?teamIds=...`
    - Returns availability status AND team names for the provided IDs.
    - Optimized to prevent N+1 queries.
    - Requires bot authentication and permissions listed above.

### 2026-01-15: Smart Forms Escalation - Verified Working

#### Summary
The Smart Forms intake escalation flow has been **successfully verified**. When triggered, the Intake Card appears in the designated team channel with "Take Chat" button.

#### Configuration (Verified Working)
```bash
# Environment Variables (start-local-dev.sh)
RC_BASE_URL="http://172.19.127.209:3000"  # Use WSL IP for Docker connectivity
SMART_FORMS_APP_ID="4fc45c85-e69e-4dc9-a318-8c8dcae02967"
MEDSENSE_TEAM_IDS="69682923529747ba8f30aceb"
RC_SECRET="medsense"
```

#### Test Results
- **Intake Room ID**: `69682923529747ba8f30acee` (`newpharmacy1-intake`)
- **Team ID**: `69682923529747ba8f30aceb` (`newpharmacy1`)
- **Endpoint**: `POST /api/apps/public/{APP_ID}/medsense.intake`
- **Status**: ✅ Card successfully posted to intake channel

#### Key Fixes Applied
1. **Docker Networking**: Changed from `host.docker.internal` to WSL IP (`172.19.127.209`). Docker Desktop cannot route to WSL via `host.docker.internal` for App endpoints.
2. **Host Header**: When calling from external IPs, the App endpoint requires `Host: localhost:3000` header (or use localhost directly).
3. **App Permissions**: Added `server-setting.read` to `app.json` to allow the App to read `Site_Url`.
4. **Intake Room Resolution**: Refactored `SmartFormsApp.ts` to resolve rooms locally via `getRoomReader().getById()` instead of making external HTTP calls.
5. **Authentication**: Orchestrator now includes `X-Rocketchat-Secret` header when calling the intake endpoint.

#### Remaining Items
- [ ] Wire up the escalation confirmation flow in Orchestrator to use `intakeRoomId` from team configuration
- [ ] Handle WSL IP changes (IP is dynamic, may need to be updated after reboot)
- [ ] Implement "Take Chat" button handler to join agent to patient room

