import type { LicenseManager } from '../license.js';
import { hasAllDataCounters } from './getCurrentValueForLicenseLimit.js';

// Can only validate licenses once the workspace URL and the data counter functions are set
export function isReadyForValidation(this: LicenseManager) {
	return Boolean(this.getWorkspaceUrl() && hasAllDataCounters.call(this));
}
