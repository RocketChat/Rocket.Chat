import type { LicenseModule } from './LicenseModule';

export type LicenseBehavior = 'invalidate_license' | 'start_fair_policy' | 'prevent_action' | 'prevent_installation' | 'disable_modules';

export type BehaviorWithContext = {
	behavior: LicenseBehavior;
	modules?: LicenseModule[];
};
