import type { LicenseBehavior } from './LicenseBehavior';
import type { LicenseModule } from './LicenseModule';

export type Timestamp = string;

export type LicensePeriod = {
	validFrom?: Timestamp;
	validUntil?: Timestamp;
	invalidBehavior: LicenseBehavior;
} & ({ validFrom: Timestamp } | { validUntil: Timestamp }) &
	({ invalidBehavior: 'disable_modules'; modules: LicenseModule[] } | { invalidBehavior: Exclude<LicenseBehavior, 'disable_modules'> });

export type LicensePeriodBehavior = Exclude<LicenseBehavior, 'prevent_action'>;
