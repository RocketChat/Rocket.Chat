import type { ILicenseV3 } from '../definition/ILicenseV3';
import type { BehaviorWithContext, LicenseBehavior } from '../definition/LicenseBehavior';
import type { LicenseManager } from '../license';
import { logger } from '../logger';
import { getCurrentValueForLicenseLimit } from './getCurrentValueForLicenseLimit';
import { getResultingBehavior } from './getResultingBehavior';

export async function validateLicenseLimits(
	this: LicenseManager,
	license: ILicenseV3,
	behaviorFilter: (behavior: LicenseBehavior) => boolean,
): Promise<BehaviorWithContext[]> {
	const { limits } = license;

	const limitKeys = Object.keys(limits) as (keyof ILicenseV3['limits'])[];
	return (
		await Promise.all(
			limitKeys.map(async (limitKey) => {
				// Filter the limit list before running any query in the database so we don't end up loading some value we won't use.
				const limitList = limits[limitKey]?.filter(({ behavior, max }) => max >= 0 && behaviorFilter(behavior));
				if (!limitList?.length) {
					return [];
				}

				const currentValue = await getCurrentValueForLicenseLimit.call(this, limitKey);
				return limitList
					.filter(({ max }) => max < currentValue)
					.map((limit) => {
						logger.error({
							msg: 'Limit validation failed',
							kind: limitKey,
							limit,
						});
						return getResultingBehavior(limit);
					});
			}),
		)
	).flat();
}
