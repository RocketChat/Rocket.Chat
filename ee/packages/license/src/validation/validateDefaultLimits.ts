import type { BehaviorWithContext } from '../definition/LicenseBehavior';
import type { LicenseLimit } from '../definition/LicenseLimit';
import type { LicenseValidationOptions } from '../definition/LicenseValidationOptions';
import type { LicenseManager } from '../license';
import { validateLimits } from './validateLimits';

export const defaultLimits: {
	privateApps: LicenseLimit[];
	marketplaceApps: LicenseLimit[];
	// monthlyActiveContacts?: LicenseLimit[];
} = {
	privateApps: [
		{
			behavior: 'prevent_action',
			max: 3,
		},
	],
	marketplaceApps: [
		{
			behavior: 'prevent_action',
			max: 5,
		},
	],
};

export async function validateDefaultLimits(this: LicenseManager, options: LicenseValidationOptions): Promise<BehaviorWithContext[]> {
	return validateLimits.call(this, defaultLimits, options);
}
