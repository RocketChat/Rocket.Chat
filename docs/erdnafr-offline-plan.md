# erdnafr offline fork plan

## Current fork state

- Local working fork cloned from `https://github.com/RocketChat/Rocket.Chat.git`
- Local branch: `custom/offline-base`
- Remote renamed to `upstream`
- Upstream branch base: `develop`

## Key repo observations

### 1) The repo already has a built-in FOSS strip path
- Root `package.json` exposes `yarn fossify`
- `scripts/fossify.ts` deletes:
  - `ee/`
  - `apps/meteor/ee/`
- It also swaps:
  - `apps/meteor/startRocketChat.ts`
  - with `apps/meteor/startRocketChatFOSS.ts`

This is the cleanest first cut for removing Enterprise / Pro / licensing code.

### 2) Enterprise code is isolated enough to cut mechanically
Main paid/licensed surfaces live in:
- `ee/packages/license`
- `ee/packages/federation-matrix`
- `ee/packages/media-calls`
- `ee/packages/network-broker`
- `ee/packages/omni-core-ee`
- `ee/packages/omnichannel-services`
- `ee/packages/presence`
- `ee/packages/pdf-worker`
- `apps/meteor/ee/`

### 3) “Air-gapped” exists, but it is not your target architecture
There is air-gapped logic tied to licensing restrictions (`AirGappedRestriction`), not a clean offline-first product mode.
For your fork, offline mode should not depend on licensing code at all.

### 4) External/cloud features are spread across FOSS code too
Important non-EE external surfaces:
- Cloud registration / cloud sync:
  - `apps/meteor/app/cloud/server/**`
  - `packages/server-cloud-communication`
- Usage reporting / telemetry:
  - `apps/meteor/app/statistics/server/functions/sendUsageReport.ts`
  - posts to `https://collector.rocket.chat/`
- Version checking:
  - `apps/meteor/app/version-check/server/**`
  - hits `https://releases.rocket.chat/updates/check`
- Error reporting:
  - `apps/meteor/app/lib/server/lib/bugsnag.ts`
  - `apps/meteor/client/views/root/OutermostErrorBoundary.tsx`
- Marketplace UI / app marketplace flows:
  - `apps/meteor/client/views/marketplace/**`
  - `packages/apps-engine/**` marketplace and app-license paths
- Push/mobile-related features:
  - `apps/meteor/app/push/**`
  - `apps/meteor/app/push-notifications/**`
- Optional integrations that reach outward:
  - Slack bridge, GitHub, GitLab, Google OAuth, custom OAuth, Nextcloud, WebDAV, IRC, outgoing integrations

## Recommended cut list

### Phase 1 — Safe legal/product normalization
Goal: make the fork cleanly FOSS-only.

1. Run `yarn fossify`
2. Verify workspace/build config no longer references deleted EE packages
3. Commit as:
   - `chore: strip enterprise code with fossify`

Expected removals:
- license enforcement
- enterprise-only startup paths
- federation matrix EE package
- omnichannel EE services
- enterprise media calls backend
- enterprise presence / broker / pdf worker / abac EE bits

### Phase 2 — Offline-first hardening
Goal: no dependency on Rocket.Chat external services.

Disable or remove:
- cloud workspace registration
- cloud sync cron
- workspace registration UI/modals
- usage reporting to collector
- version checker to Rocket.Chat releases
- Bugsnag hooks
- any startup path requiring cloud token / cloud workspace id

Likely targets:
- `apps/meteor/app/cloud/server/**`
- `apps/meteor/client/views/admin/workspace/**`
- `apps/meteor/app/statistics/server/functions/sendUsageReport.ts`
- `apps/meteor/app/version-check/server/**`
- `apps/meteor/app/lib/server/lib/bugsnag.ts`

Preferred approach:
- replace with local no-op implementations where startup wiring expects them
- hide UI for cloud/registration/update checks instead of letting it error noisily

### Phase 3 — Single-user simplification
Goal: cut the “company workspace” baggage.

Strong candidates to disable/remove:
- federation
- marketplace browsing and marketplace licensing flows
- omnichannel / livechat / contact-center flows
- VoIP / media calls / video conference
- push notifications
- external OAuth providers and external integrations
- workspace subscription / upgrade / premium upsell surfaces

Likely targets:
- `apps/meteor/client/views/marketplace/**`
- `packages/apps-engine/src/server/marketplace/**`
- `packages/ui-voip/**`
- `packages/ui-video-conf/**`
- `packages/livechat/**`
- `apps/meteor/client/views/admin/subscription/**`
- `apps/meteor/app/integrations/**`
- `apps/meteor/app/slackbridge/**`
- `apps/meteor/app/github*`
- `apps/meteor/app/gitlab/**`
- `apps/meteor/app/google-oauth/**`
- `apps/meteor/app/custom-oauth/**`
- `apps/meteor/app/nextcloud/**`
- `apps/meteor/app/webdav/**`
- `apps/meteor/app/irc/**`

### Phase 4 — Product reshape for “just me” mode
Goal: make it feel like your private command center instead of a general team chat product.

Potential later changes:
- default single-user setup path
- simplified admin surface
- disable guest/public-channel assumptions
- opinionated defaults for local-only deployment
- stronger local-first search, notes, personal workflows, automations, AI hooks

## Risks / build concerns

1. **`fossify` is necessary but not sufficient**
   It removes EE code, but not all cloud/external/community-product assumptions.

2. **Marketplace logic leaks into FOSS packages**
   `packages/apps-engine` includes marketplace and app-license handling. That needs pruning even after EE removal.

3. **Offline and air-gapped are currently coupled to license behavior**
   We should not rely on enterprise restriction code to implement offline mode.

4. **A lot of external behavior is enabled by startup jobs, not just UI**
   Cloud sync, usage reporting, and version checks run in background/server startup paths.

5. **Big-bang removals will be noisy**
   Best path is phased commits with build checks after each slice.

## Recommended branch strategy

- `custom/offline-base`
  - base branch for legal/FOSS normalization + external-service removal
- `feature/single-user-mode`
  - product simplification
- `feature/private-powerups`
  - your custom features / steroids layer

## First implementation sequence

1. `yarn fossify`
2. fix any build/workspace references broken by EE removal
3. disable cloud registration/sync
4. disable usage reporting + version check + Bugsnag
5. remove marketplace/subscription/upgrade UI
6. remove omnichannel/livechat/federation/calls/push/integrations in slices
7. run build/test gates after each slice

## Minimum next decision needed from erdnafr

To create the **real remote fork**, I need only this:
- destination: GitHub or Gitea or GitLab?
- repo name: e.g. `erdnafr/rocket.chat` or `erdnafr/erdnafr-chat`

Until then, local fork prep can continue safely in this workspace.
