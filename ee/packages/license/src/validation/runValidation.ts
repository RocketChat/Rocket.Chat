import type { ILicenseV3 } from '../definition/ILicenseV3';
import type { LicenseBehavior, BehaviorWithContext } from '../definition/LicenseBehavior';
import { validateLicenseLimits } from './validateLicenseLimits';
import { validateLicensePeriods } from './validateLicensePeriods';
import { validateLicenseUrl } from './validateLicenseUrl';

export const runValidation = async (license: ILicenseV3, behaviorsToValidate: LicenseBehavior[] = []): Promise<BehaviorWithContext[]> => {
	const shouldValidateBehavior = (behavior: LicenseBehavior) => !behaviorsToValidate?.length || behaviorsToValidate.includes(behavior);

	return [
		...new Set([
			...validateLicenseUrl(license, shouldValidateBehavior),
			...validateLicensePeriods(license, shouldValidateBehavior),
			...(await validateLicenseLimits(license, shouldValidateBehavior)),
		]),
	];
};
