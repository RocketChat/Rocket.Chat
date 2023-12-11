import type { LicenseBehavior } from './LicenseBehavior';
import type { LicenseModule } from './LicenseModule';

export type LicenseLimit<T extends LicenseBehavior = LicenseBehavior> = {
	max: number;
	behavior: T;
} & (T extends 'disable_modules' ? { behavior: T; modules: LicenseModule[] } : { behavior: T });
