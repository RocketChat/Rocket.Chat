import type { LicenseLimitKind } from './ILicenseV3';
import type { LicenseBehavior } from './LicenseBehavior';
import type { LimitContext } from './LimitContext';

export type LicenseValidationOptions = {
	behaviors?: LicenseBehavior[];
	limits?: LicenseLimitKind[];
	suppressLog?: boolean;
	isNewLicense?: boolean;
	context?: Partial<{ [K in LicenseLimitKind]: Partial<LimitContext<LicenseLimitKind>> }>;
	triggerSync?: boolean;
};
