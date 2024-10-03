import type { LicenseLimitKind } from './ILicenseV3';

export type LicenseBehavior =
	| 'invalidate_license'
	| 'start_fair_policy'
	| 'prevent_action'
	| 'allow_action'
	| 'prevent_installation'
	| 'disable_modules';

export type BehaviorWithContext =
	| {
			behavior: LicenseBehavior;
			modules?: string[];
			reason: 'limit';
			limit?: LicenseLimitKind;
	  }
	| {
			behavior: LicenseBehavior;
			modules?: string[];
			reason: 'period' | 'url';
	  };
