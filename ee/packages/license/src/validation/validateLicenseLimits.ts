import type { ILicenseV3, BehaviorWithContext, LicenseValidationOptions } from '@rocket.chat/core-typings';

import type { LicenseManager } from '../license';
import { validateLimits } from './validateLimits';

export async function validateLicenseLimits(
	this: LicenseManager,
	license: ILicenseV3,
	options: LicenseValidationOptions,
): Promise<BehaviorWithContext[]> {
	const { limits } = license;

	return validateLimits.call(this, limits, options);
}
