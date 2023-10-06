import type { LicenseLimitKind } from '../definition/ILicenseV3';
import type { BehaviorWithContext } from '../definition/LicenseBehavior';
import type { LicenseLimit } from '../definition/LicenseLimit';
import type { LicensePeriod } from '../definition/LicensePeriod';

export const getResultingBehavior = (
	data: LicenseLimit | LicensePeriod | Partial<Omit<BehaviorWithContext, 'reason'>>,
	{ reason, limit }: { reason: BehaviorWithContext['reason']; limit?: LicenseLimitKind },
): BehaviorWithContext => {
	const behavior = 'invalidBehavior' in data ? data.invalidBehavior : data.behavior;

	switch (behavior) {
		case 'disable_modules':
			return {
				behavior,
				modules: ('modules' in data && data.modules) || [],
				reason,
				limit,
			};

		default:
			return {
				behavior,
				reason,
				limit,
			} as BehaviorWithContext;
	}
};
