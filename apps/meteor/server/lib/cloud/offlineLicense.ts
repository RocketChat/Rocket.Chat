import { License } from '@rocket.chat/license';

import { CloudOfflineLicenseError } from '../../../lib/errors/CloudOfflineLicenseError';

/**
 * Guard for interactive cloud flows (registration, OAuth, billing). Background
 * jobs should instead skip silently by checking {@link License.hasOfflineLicense}.
 */
export function assertNotOfflineLicense(): void {
	if (License.hasOfflineLicense()) {
		throw new CloudOfflineLicenseError('Cloud connectivity is disabled by the offline license applied to this workspace');
	}
}
