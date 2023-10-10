import type { ILicenseV3, LicenseLimitKind } from '../definition/ILicenseV3';
import type { BehaviorWithContext } from '../definition/LicenseBehavior';
import type { LicenseValidationOptions } from '../definition/LicenseValidationOptions';
import { isLimitAllowed, isBehaviorAllowed } from '../isItemAllowed';
import type { LicenseManager } from '../license';
import { logger } from '../logger';
import { getCurrentValueForLicenseLimit } from './getCurrentValueForLicenseLimit';
import { getResultingBehavior } from './getResultingBehavior';

export async function validateLicenseLimits(
	this: LicenseManager,
	license: ILicenseV3,
	options: LicenseValidationOptions,
): Promise<BehaviorWithContext[]> {
	const { limits } = license;

	const limitKeys = (Object.keys(limits) as LicenseLimitKind[]).filter((limit) => isLimitAllowed(limit, options));
	return (
		await Promise.all(
			limitKeys.map(async (limitKey) => {
				// Filter the limit list before running any query in the database so we don't end up loading some value we won't use.
				const limitList = limits[limitKey]?.filter(({ behavior, max }) => max >= 0 && isBehaviorAllowed(behavior, options));
				if (!limitList?.length) {
					return [];
				}

				const extraCount = options.context?.[limitKey]?.extraCount ?? 0;
				const currentValue = (await getCurrentValueForLicenseLimit.call(this, limitKey, options.context?.[limitKey])) + extraCount;

				return limitList
					.filter(({ max, behavior }) => {
						switch (behavior) {
							case 'invalidate_license':
							case 'prevent_installation':
							case 'disable_modules':
							case 'start_fair_policy':
							default:
								return currentValue > max;
							case 'prevent_action':
								/**
								 * if we are validating the current count the limit should be equal or over the max, if we are validating the future count the limit should be over the max
								 */

								return extraCount ? currentValue > max : currentValue >= max;
						}
					})
					.map((limit) => {
						if (!options.suppressLog) {
							logger.error({
								msg: 'Limit validation failed',
								kind: limitKey,
								limit,
							});
						}
						return getResultingBehavior(limit, { reason: 'limit', limit: limitKey });
					});
			}),
		)
	).flat();
}
