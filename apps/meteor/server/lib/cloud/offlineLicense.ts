import { License } from '@rocket.chat/license';

import { CloudOfflineLicenseError } from '../../../lib/errors/CloudOfflineLicenseError';

/**
 * Whether the applied license was issued for offline (air-gapped) workspaces.
 *
 * When this returns true the workspace must never initiate outbound connections
 * to Rocket.Chat Cloud services (registration, sync, marketplace, telemetry) or
 * to the Rocket.Chat Push Gateway. Calls must be suppressed at the source — not
 * by relying on the requests failing.
 */
export function hasOfflineLicense(): boolean {
	return License.hasOfflineLicense();
}

/**
 * Guard for interactive cloud flows (registration, OAuth, billing). Background
 * jobs should instead skip silently via {@link hasOfflineLicense}.
 */
export function assertNotOfflineLicense(): void {
	if (hasOfflineLicense()) {
		throw new CloudOfflineLicenseError('Cloud connectivity is disabled by the offline license applied to this workspace');
	}
}
