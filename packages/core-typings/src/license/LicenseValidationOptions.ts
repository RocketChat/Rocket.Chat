import type { LicenseLimitKind } from './ILicenseV3.js';
import type { LicenseBehavior } from './LicenseBehavior.js';
import type { LimitContext } from './LimitContext.js';

export type LicenseValidationOptions = {
	behaviors?: LicenseBehavior[];
	limits?: LicenseLimitKind[];
	suppressLog?: boolean;
	isNewLicense?: boolean;
	context?: Partial<{ [K in LicenseLimitKind]: Partial<LimitContext<LicenseLimitKind>> }>;
	triggerSync?: boolean;
};
