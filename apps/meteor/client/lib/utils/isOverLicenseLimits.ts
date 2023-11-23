import type { LicenseLimitKind } from '@rocket.chat/license';

type Limits = Record<
	LicenseLimitKind,
	{
		max: number;
		value?: number;
	}
>;

export const isOverLicenseLimits = (limits: Limits): boolean =>
	Object.values(limits).some((limit) => limit.value !== undefined && limit.max !== -1 && limit.value > limit.max);
