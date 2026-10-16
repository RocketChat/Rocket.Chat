import type { ISidebarFilterSort } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { applyQueryOptions } from '../../../../lib/cachedStores/applyQueryOptions';

export const sortSubscriptions = (
	subscriptions: SubscriptionWithRoom[],
	{ by, direction }: ISidebarFilterSort,
	useRealName: boolean,
): SubscriptionWithRoom[] => {
	const order = direction === 'asc' ? 1 : -1;

	if (by === 'activity') {
		return applyQueryOptions(subscriptions, { sort: { lm: order } });
	}

	return applyQueryOptions(subscriptions, { sort: useRealName ? { lowerCaseFName: order } : { lowerCaseName: order } });
};
