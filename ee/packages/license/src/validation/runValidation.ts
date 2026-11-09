import type { ILicenseV3, BehaviorWithContext, LicenseValidationOptions } from '@rocket.chat/core-typings';

import type { LicenseManager } from '../license.js';
import { validateLicenseLimits } from './validateLicenseLimits.js';
import { validateLicensePeriods } from './validateLicensePeriods.js';
import { validateLicenseUrl } from './validateLicenseUrl.js';

export async function runValidation(
	this: LicenseManager,
	license: ILicenseV3,
	options: LicenseValidationOptions,
): Promise<BehaviorWithContext[]> {
	return [
		...validateLicenseUrl.call(this, license, options),
		...validateLicensePeriods(license, options),
		...(await validateLicenseLimits.call(this, license, options)),
	];
}
