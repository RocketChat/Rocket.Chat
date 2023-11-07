import type { ILicenseV3 } from '../definition/ILicenseV3';
import type { BehaviorWithContext } from '../definition/LicenseBehavior';
import type { LicenseValidationOptions } from '../definition/LicenseValidationOptions';
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
