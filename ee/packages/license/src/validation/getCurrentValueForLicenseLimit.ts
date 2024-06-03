import type { LicenseLimitKind, LimitContext } from '@rocket.chat/core-typings';

import type { LicenseManager } from '../license';
import { logger } from '../logger';
import { applyPendingLicense, hasPendingLicense } from '../pendingLicense';

export function setLicenseLimitCounter<T extends LicenseLimitKind>(
	this: LicenseManager,
	limitKey: T,
	fn: (context?: LimitContext<T>) => Promise<number> | number,
) {
	this.dataCounters.set(limitKey, fn as (context?: LimitContext<LicenseLimitKind>) => Promise<number>);

	if (hasPendingLicense.call(this) && hasAllDataCounters.call(this)) {
		void applyPendingLicense.call(this);
	}
}

export async function getCurrentValueForLicenseLimit<T extends LicenseLimitKind>(
	this: LicenseManager,
	limitKey: T,
	context?: Partial<LimitContext<T>>,
): Promise<number> {
	const counterFn = this.dataCounters.get(limitKey);
	if (!counterFn) {
		logger.error({ msg: 'Unable to validate license limit due to missing data counter.', limitKey });
		throw new Error(`Unable to validate license limit due to missing ${limitKey} data counter`);
	}

	return counterFn(context as LimitContext<LicenseLimitKind> | undefined);
}

export function hasAllDataCounters(this: LicenseManager) {
	return (
		['activeUsers', 'guestUsers', 'roomsPerGuest', 'privateApps', 'marketplaceApps', 'monthlyActiveContacts'] as LicenseLimitKind[]
	).every((limitKey) => this.dataCounters.has(limitKey));
}
