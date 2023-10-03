import type { ILicenseV3, LicenseLimitKind } from '../definition/ILicenseV3';
import type { LicenseBehavior, BehaviorWithContext } from '../definition/LicenseBehavior';
import type { LicenseManager } from '../license';
import { validateLicenseLimits } from './validateLicenseLimits';
import { validateLicensePeriods } from './validateLicensePeriods';
import { validateLicenseUrl } from './validateLicenseUrl';

export async function runValidation(
	this: LicenseManager,
	license: ILicenseV3,
	behaviorsToValidate?: LicenseBehavior[],
	limitsToValidate?: LicenseLimitKind[],
): Promise<BehaviorWithContext[]> {
	const shouldValidateBehavior = (behavior: LicenseBehavior) => !behaviorsToValidate || behaviorsToValidate.includes(behavior);
	const shouldValidateLimit = (limit: LicenseLimitKind) => !limitsToValidate || limitsToValidate.includes(limit);

	return [
		...validateLicenseUrl.call(this, license, shouldValidateBehavior),
		...validateLicensePeriods(license, shouldValidateBehavior),
		...(await validateLicenseLimits.call(this, license, shouldValidateBehavior, shouldValidateLimit)),
	];
}
