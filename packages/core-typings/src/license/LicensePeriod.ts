import type { LicenseBehavior } from './LicenseBehavior';

export type Timestamp = string;

export type LicensePeriod = {
	validFrom?: Timestamp;
	validUntil?: Timestamp;
	invalidBehavior: LicenseBehavior;
} & ({ validFrom: Timestamp } | { validUntil: Timestamp }) &
	({ invalidBehavior: 'disable_modules'; modules: string[] } | { invalidBehavior: Exclude<LicenseBehavior, 'disable_modules'> });

export type LicensePeriodBehavior = Exclude<LicenseBehavior, 'prevent_action'>;
