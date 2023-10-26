import type { LicenseLimitKind } from './definition/ILicenseV3';
import type { LicenseBehavior } from './definition/LicenseBehavior';
import type { LicenseValidationOptions } from './definition/LicenseValidationOptions';

const isItemAllowed = <T>(item: T, allowList?: T[]): boolean => {
	return !allowList || allowList.includes(item);
};

export const isLimitAllowed = (item: LicenseLimitKind, options: LicenseValidationOptions): boolean => isItemAllowed(item, options.limits);

export const isBehaviorAllowed = (item: LicenseBehavior, options: LicenseValidationOptions): boolean =>
	isItemAllowed(item, options.behaviors) && (options.isNewLicense || item !== 'prevent_installation');
