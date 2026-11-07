import type { LicenseLimitKind } from './ILicenseV3.js';
import type { LicenseModule } from './LicenseModule.js';

export type LicenseBehavior =
	'invalidate_license' | 'start_fair_policy' | 'prevent_action' | 'allow_action' | 'prevent_installation' | 'disable_modules';

export type BehaviorWithContext =
	| {
			behavior: LicenseBehavior;
			modules?: LicenseModule[];
			reason: 'limit';
			limit?: LicenseLimitKind;
	  }
	| {
			behavior: LicenseBehavior;
			modules?: LicenseModule[];
			reason: 'period' | 'url';
	  };
