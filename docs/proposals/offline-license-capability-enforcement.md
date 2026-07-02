# Proposal: Type-System Enforcement for Offline-License Cloud Guards

## Status

Draft

## Problem

Workspaces with an offline (air-gapped) license must never initiate outbound connections to Rocket.Chat-owned endpoints — Cloud/Fleet Command (`cloud.rocket.chat`), Marketplace, the usage collector, `releases.rocket.chat`, NPS, and the Push Gateway. For the customers this serves, the *attempt* itself is a compliance violation, regardless of whether it succeeds.

Today this is enforced by runtime checks — `License.hasOfflineLicense()` guards scattered across ~15 files:

- `apps/meteor/app/cloud/server/functions/syncWorkspace/index.ts` (sync entry)
- `apps/meteor/app/cloud/server/functions/getWorkspaceAccessToken.ts` and `getWorkspaceAccessTokenWithScope.ts` (OAuth token funnel)
- `apps/meteor/ee/server/apps/marketplace/MarketplaceAPIClient.ts`, `ee/server/apps/cron.ts`, `ee/server/apps/appRequestsCron.ts`
- `apps/meteor/app/statistics/server/functions/sendUsageReport.ts`
- `apps/meteor/app/version-check/server/functions/checkVersionUpdate.ts`
- `apps/meteor/app/push/server/push.ts` (`shouldUseGateway()` and the send loop)
- `apps/meteor/server/modules/core-apps/cloudAnnouncements.module.ts`
- `assertNotOfflineLicense()` calls in the interactive registration/OAuth/billing functions under `apps/meteor/app/cloud/server/functions/`

These checks work, but they are a **side-condition the compiler knows nothing about**. Any new feature can `import { serverFetch } from '@rocket.chat/server-fetch'`, build a URL from `Cloud_Url` (or hardcode a domain), and ship a compliance violation that no type error, no test, and no reviewer checklist reliably catches. The guard has to be *remembered*, and knowledge of *which* endpoints require it lives only in developers' heads.

## Proposed Solution

Make the ability to contact a Rocket.Chat-owned endpoint a **capability**: a value of a branded type that can only be produced by a factory that performs the offline-license check. Every function that performs cloud I/O requires that value in its signature. New code physically cannot typecheck a cloud call without going through the guard — forgetting it becomes a compile error instead of a compliance incident.

### The capability module

One new module, `apps/meteor/app/cloud/server/cloudClient.ts`, becomes the single construction site:

```ts
import { License } from '@rocket.chat/license';
import { serverFetch, type ExtendedFetchOptions, type Response } from '@rocket.chat/server-fetch';

import { CloudOfflineLicenseError } from '../../../lib/errors/CloudOfflineLicenseError';
import { SystemLogger } from '../../../server/lib/logger/system';

declare const cloudConnectionBrand: unique symbol; // NOT exported — unforgeable outside this module

/**
 * Capability proving the offline-license check has been performed for this attempt.
 *
 * Acquire one per attempt, at the top of the operation. NEVER store a connection on a
 * class field, module scope, or a retry/timer closure — the license can change at
 * runtime, and a cached connection would keep a stale "online" verdict alive.
 */
export type CloudConnection = {
	readonly [cloudConnectionBrand]: true;
	fetch(input: string, options?: ExtendedFetchOptions, allowSelfSignedCerts?: boolean): Promise<Response>;
};

// Consumers get their fetch types from here, not from @rocket.chat/server-fetch.
export type { ExtendedFetchOptions, Response };

const createConnection = (): CloudConnection =>
	({
		fetch: (input, options, allowSelfSignedCerts) => serverFetch(input, options, allowSelfSignedCerts),
	}) as CloudConnection; // the only cast, inside the only allowed module

/** Background jobs: `null` means offline — skip silently. */
export function tryGetCloudConnection(context?: string): CloudConnection | null {
	if (License.hasOfflineLicense()) {
		SystemLogger.debug({ msg: 'Skipping cloud communication: workspace has an offline license', context });
		return null;
	}
	return createConnection();
}

/** Interactive flows: throws the typed error surfaced to the caller/UI. */
export function getCloudConnectionOrThrow(message?: string): CloudConnection {
	if (License.hasOfflineLicense()) {
		throw new CloudOfflineLicenseError(
			message ?? 'Cloud connectivity is disabled by the offline license applied to this workspace',
		);
	}
	return createConnection();
}
```

Design notes:

- **The factories are synchronous.** `License.hasOfflineLicense()` is a sync read of the in-memory license, so per-attempt acquisition is free — removing any temptation to cache the connection.
- **The two factories mirror the existing runtime helper pair** in `apps/meteor/app/cloud/server/functions/offlineLicense.ts` (`hasOfflineLicense` for silent background skips, `assertNotOfflineLicense` for interactive throws), so migration is mechanical and behavior-preserving: same silent skips, same `CloudOfflineLicenseError`, same single informational log at license application.
- **The `message` parameter** preserves context-specific error text (e.g. the Marketplace-specific message currently thrown by `MarketplaceAPIClient.fetch`).
- **The workspace access token is deliberately NOT bundled into the capability.** The OAuth token exchange is itself a guarded fetch (`getWorkspaceAccessTokenWithScope.ts` posts to `${Cloud_Url}/api/oauth/token`), several guarded endpoints are unauthenticated (releases, collector, pre-registration), scopes vary per caller, and push has its own authorization flow. Instead, the token funnel migrates to the capability internally — which transitively guards its ~30 consumers exactly as the runtime checks do today, preserving the `''`-token-when-offline contract.

### Signatures carry the requirement

The payoff is in function signatures. Helpers that perform cloud I/O take the capability as a parameter:

```ts
// before — nothing in the signature says this talks to Rocket.Chat Cloud:
export async function fetchWorkspaceSyncPayload({ token, data }: { ... }): Promise<...>

// after — cloud I/O is visible, and the compiler forces callers through the guard:
export async function fetchWorkspaceSyncPayload(
	connection: CloudConnection,
	{ token, data }: { ... },
): Promise<...>
```

A developer adding a new cloud endpoint follows the types: they need a `CloudConnection`, the only way to get one is a factory whose name and JSDoc explain the offline rule, and the choice between the two factories forces them to *decide* the offline behavior (skip vs. throw) instead of ignoring it.

### Migration patterns

Roughly 27 files fetch Rocket.Chat-owned endpoints. They fall into four shapes:

**A — Interactive flows** (registration, OAuth, checkout, license removal, announcement interactions: `startRegisterWorkspace.ts`, `connectWorkspace.ts`, `finishOAuthAuthorization.ts`, `getCheckoutUrl.ts`, `cloudAnnouncements.module.ts`, …). The existing `assertNotOfflineLicense()` line and the raw fetch collapse into:

```ts
const connection = getCloudConnectionOrThrow();
const response = await connection.fetch(`${cloudUrl}/api/v2/register/workspace`, { ... });
```

**B — Background jobs** (`syncWorkspace/index.ts`, `sendUsageReport.ts`, the NPS pair, `getNewUpdates.ts`). Null means skip, keeping existing side effects:

```ts
const connection = tryGetCloudConnection('syncWorkspace');
if (!connection) {
	await getCachedSupportedVersionsToken.reset(); // still refreshed locally from the license/build
	return;
}
await announcementSync(connection);
await syncCloudData(connection);
```

Inner helpers only reachable from a guarded entry point (`announcementSync`, `fetchWorkspaceSyncPayload`, `legacySyncWorkspace`) take `connection` as a parameter rather than re-acquiring — acceptable within one logical operation with no timers between acquisition and use.

**C — Class-based client** (`MarketplaceAPIClient.ts`). The strategy pattern (real vs. mock fetch for tests) is preserved; the strategy signature gains a leading `connection` parameter, acquired per `fetch()` call and never stored on the instance. All `orchestrator.getMarketplaceClient().fetch(...)` consumers keep their call sites unchanged.

**D — Retry closures** (push gateway `sendGatewayPush` in `apps/meteor/app/push/server/push.ts`, the `supportedVersionsToken` retry chain). The rule: **acquire at the top of each attempt; the timer closure holds no connection.**

```ts
private async sendGatewayPush(gateway, service, token, notification, retryOptions): Promise<void> {
	const connection = tryGetCloudConnection('push-gateway');
	if (!connection) {
		return; // license went offline between scheduling and this attempt — drop, incl. pending retries
	}
	// ...
	setTimeout(() => this.sendGatewayPush(...), ms); // next attempt re-checks
}
```

This is strictly better than the current runtime checks: today a retry chain started while online keeps fetching if the license flips to offline mid-flight; per-attempt acquisition stops it.

**Carve-out**: the two fetches in `ee/server/apps/communication/rest.ts` that download an app package from an **admin-supplied URL** (install-from-URL) are not Rocket.Chat endpoints and must keep working under offline licenses — installing private apps from a URL or file is core to air-gapped operation. They stay on raw `serverFetch`.

### What stays as-is

The `offlineLicense.ts` helpers remain for **behavior** gates that don't themselves fetch: `shouldUseGateway()` in push, the marketplace cron-body early returns, and the fail-fast assert in `getOAuthAuthorizationUrl` (which only builds a URL). These gate control flow, not I/O, and don't need a capability.

### Migration ordering and test impact

1. `cloudClient.ts` + unit tests (no behavior change).
2. Token funnel (`getWorkspaceAccessTokenWithScope.ts`) — transitively guards all token consumers.
3. The 15 other `app/cloud/server/functions/**` files.
4. Marketplace (`MarketplaceAPIClient.ts` strategy, `appRequestNotifyUsers.ts`).
5. Telemetry, NPS, version-check, announcements, push gateway.

Every step is independently green. Test impact is confined to proxyquire maps: `sendUsageReport.spec.ts` and `push.spec.ts` swap their `@rocket.chat/server-fetch` stubs for a `cloudClient` stub — and the offline assertions get *stronger*, since specs can now assert the connection was never requested at all. The `ee/packages/license` jest suite is untouched.

## Limitations

TypeScript cannot forbid an import. A brand-new file can still `import { serverFetch }` directly and hardcode `cloud.rocket.chat`, bypassing the capability entirely; `{} as CloudConnection` likewise defeats the brand (though it is greppable and glaring in review). What the type system guarantees is narrower but valuable: **all code routed through the typed cloud helpers cannot skip the guard**, the offline decision (skip vs. throw) is forced explicitly at every new call site, and violations shrink to two obvious review signals — a raw `serverFetch` import next to a Rocket.Chat domain, or a forged cast.

A directory-scoped lint rule (`no-restricted-imports` on `@rocket.chat/server-fetch` with `cloudClient.ts` as the sole exemption) or a CI grep could close the remaining hole; both were considered and deliberately left out of this proposal in favor of a types-only approach.
