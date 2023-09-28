import type { ILicenseV3 } from '../definition/ILicenseV3';
import type { LicenseBehavior, BehaviorWithContext } from '../definition/LicenseBehavior';
import type { LicenseManager } from '../license';
import { validateLicenseLimits } from './validateLicenseLimits';
import { validateLicensePeriods } from './validateLicensePeriods';
import { validateLicenseUrl } from './validateLicenseUrl';

export async function runValidation(
	this: LicenseManager,
	license: ILicenseV3,
	behaviorsToValidate: LicenseBehavior[] = [],
): Promise<BehaviorWithContext[]> {
	const shouldValidateBehavior = (behavior: LicenseBehavior) => !behaviorsToValidate.length || behaviorsToValidate.includes(behavior);

	return [
		...new Set([
			...validateLicenseUrl.call(this, license, shouldValidateBehavior),
			...validateLicensePeriods(license, shouldValidateBehavior),
			...(await validateLicenseLimits.call(this, license, shouldValidateBehavior)),
		]),
	];
}
