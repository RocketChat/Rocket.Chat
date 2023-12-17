import type { LicenseLimitKind, BehaviorWithContext, LicenseLimit, LicensePeriod } from '@rocket.chat/core-typings';

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
