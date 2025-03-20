import type { ILicenseV3, BehaviorWithContext, Timestamp, LicenseValidationOptions } from '@rocket.chat/core-typings';

import { isBehaviorAllowed } from '../isItemAllowed';
import { logger } from '../logger';
import { getResultingBehavior } from './getResultingBehavior';

export const isPeriodInvalid = (from: Timestamp | undefined, until: Timestamp | undefined) => {
	const now = new Date();

	if (from && now < new Date(from)) {
		return true;
	}

	if (until && now > new Date(until)) {
		return true;
	}

	return false;
};

export const validateLicensePeriods = (license: ILicenseV3, options: LicenseValidationOptions): BehaviorWithContext[] => {
	const {
		validation: { validPeriods },
	} = license;

	return validPeriods
		.filter(
			({ validFrom, validUntil, invalidBehavior }) => isBehaviorAllowed(invalidBehavior, options) && isPeriodInvalid(validFrom, validUntil),
		)
		.map((period) => {
			if (!options.suppressLog) {
				logger.error({
					msg: 'Period validation failed',
					period,
				});
			}

			return getResultingBehavior(period, { reason: 'period' });
		});
};
