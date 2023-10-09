import type { LicenseLimitKind } from '@rocket.chat/license';

type Limits = Record<
	LicenseLimitKind,
	{
		max: number;
		value?: number;
	}
>;

export const isOverLicenseLimits = (limits: Limits): boolean => {
	for (const key in limits) {
		if (Object.hasOwn(limits, key)) {
			const limit = limits[key as keyof Limits];
			if (limit.value !== undefined && limit.value > limit.max) {
				return true;
			}
		}
	}

	return false;
};
