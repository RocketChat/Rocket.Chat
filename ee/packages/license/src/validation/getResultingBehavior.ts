import type { BehaviorWithContext } from '../definition/LicenseBehavior';
import type { LicenseLimit } from '../definition/LicenseLimit';
import type { LicensePeriod } from '../definition/LicensePeriod';

export const getResultingBehavior = (data: LicenseLimit | LicensePeriod | Partial<BehaviorWithContext>): BehaviorWithContext => {
	const behavior = 'invalidBehavior' in data ? data.invalidBehavior : data.behavior;

	switch (behavior) {
		case 'disable_modules':
			return {
				behavior,
				modules: ('modules' in data && data.modules) || [],
			};

		default:
			return {
				behavior,
			} as BehaviorWithContext;
	}
};
