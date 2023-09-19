import type { IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Users } from '@rocket.chat/models';

import type { LicenseLimitKind } from '../definition/ILicenseV3';
import { logger } from '../logger';

type LimitContext<T extends LicenseLimitKind> = T extends 'roomsPerGuest' ? { userId: IUser['_id'] } : Record<string, never>;

const dataCounters = new Map<LicenseLimitKind, (context?: LimitContext<LicenseLimitKind>) => Promise<number>>();

export const setLicenseLimitCounter = <T extends LicenseLimitKind>(limitKey: T, fn: (context?: LimitContext<T>) => Promise<number>) => {
	dataCounters.set(limitKey, fn as (context?: LimitContext<LicenseLimitKind>) => Promise<number>);
};

setLicenseLimitCounter('activeUsers', () => Users.getActiveLocalUserCount());
setLicenseLimitCounter('guestUsers', () => Users.getActiveLocalGuestCount());
setLicenseLimitCounter('roomsPerGuest', async (context) => (context?.userId ? Subscriptions.countByUserId(context.userId) : 0));

export const getCurrentValueForLicenseLimit = async <T extends LicenseLimitKind>(
	limitKey: T,
	context?: Partial<LimitContext<T>>,
): Promise<number> => {
	if (dataCounters.has(limitKey)) {
		return dataCounters.get(limitKey)?.(context as LimitContext<LicenseLimitKind> | undefined) ?? 0;
	}

	logger.error({ msg: 'Unable to validate license limit due to missing data counter.', limitKey });

	return 0;
};
