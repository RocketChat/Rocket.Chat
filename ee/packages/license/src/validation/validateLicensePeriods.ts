import type { ILicenseV3 } from '../definition/ILicenseV3';
import type { BehaviorWithContext, LicenseBehavior } from '../definition/LicenseBehavior';
import type { Timestamp } from '../definition/LicensePeriod';
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

export const validateLicensePeriods = (
	license: ILicenseV3,
	behaviorFilter: (behavior: LicenseBehavior) => boolean,
): BehaviorWithContext[] => {
	const {
		validation: { validPeriods },
	} = license;

	return validPeriods
		.filter(({ validFrom, validUntil, invalidBehavior }) => behaviorFilter(invalidBehavior) && isPeriodInvalid(validFrom, validUntil))
		.map((period) => {
			logger.error({
				msg: 'Period validation failed',
				period,
			});
			return getResultingBehavior(period);
		});
};
