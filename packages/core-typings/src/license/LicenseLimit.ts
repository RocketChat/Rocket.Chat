import type { LicenseBehavior } from './LicenseBehavior.js';
import type { LicenseModule } from './LicenseModule.js';

export type LicenseLimit<T extends LicenseBehavior = LicenseBehavior> = {
	max: number;
	behavior: T;
} & (T extends 'disable_modules' ? { behavior: T; modules: LicenseModule[] } : { behavior: T });
