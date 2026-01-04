import type { LicenseBehavior } from './LicenseBehavior';
import type { LicenseModule } from './LicenseModule';

export type Timestamp = string;

export type LicensePeriod = {
	validFrom?: string;
	validUntil?: string;
	invalidBehavior: LicenseBehavior;
} & ({ validFrom: string } | { validUntil: string }) &
	({ invalidBehavior: 'disable_modules'; modules: LicenseModule[] } | { invalidBehavior: Exclude<LicenseBehavior, 'disable_modules'> });
