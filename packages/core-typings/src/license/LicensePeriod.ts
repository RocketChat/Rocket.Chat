import type { LicenseBehavior } from './LicenseBehavior.js';
import type { LicenseModule } from './LicenseModule.js';

export type LicensePeriod = {
	validFrom?: string;
	validUntil?: string;
	invalidBehavior: LicenseBehavior;
} & ({ validFrom: string } | { validUntil: string }) &
	({ invalidBehavior: 'disable_modules'; modules: LicenseModule[] } | { invalidBehavior: Exclude<LicenseBehavior, 'disable_modules'> });
