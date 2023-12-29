import type { ILicenseV3, LicenseLimitKind, BehaviorWithContext, LicenseValidationOptions } from '@rocket.chat/core-typings';

import { isLimitAllowed, isBehaviorAllowed } from '../isItemAllowed';
import type { LicenseManager } from '../license';
import { logger } from '../logger';
import { getCurrentValueForLicenseLimit } from './getCurrentValueForLicenseLimit';
import { getResultingBehavior } from './getResultingBehavior';
import { logKind } from './logKind';
import { validateLimit } from './validateLimit';

export async function validateLimits(
	this: LicenseManager,
	limits: ILicenseV3['limits'],
	options: LicenseValidationOptions,
): Promise<BehaviorWithContext[]> {
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
					.filter(({ max, behavior }) => validateLimit(max, currentValue, behavior, extraCount))
					.map((limit) => {
						if (!options.suppressLog) {
							switch (logKind(limit.behavior)) {
								case 'error':
									logger.error({
										msg: 'Limit validation failed',
										kind: limitKey,
										limit,
									});
									break;
								case 'info':
									logger.info({
										msg: 'Limit validation failed',
										kind: limitKey,
										limit,
									});
									break;
							}
						}
						return getResultingBehavior(limit, { reason: 'limit', limit: limitKey });
					});
			}),
		)
	).flat();
}
