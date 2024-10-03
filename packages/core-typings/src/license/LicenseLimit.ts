import type { LicenseBehavior } from './LicenseBehavior';

export type LicenseLimit<T extends LicenseBehavior = LicenseBehavior> = {
	max: number;
	behavior: T;
} & (T extends 'disable_modules' ? { behavior: T; modules: string[] } : { behavior: T });
