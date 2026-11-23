import { useContext, useMemo, useSyncExternalStore } from 'react';

import type { FindOptions, SubscriptionQuery } from '../UserContext.js';
import { UserContext } from '../UserContext.js';
import type { SubscriptionWithRoom } from '../types/SubscriptionWithRoom.js';

export const useUserSubscriptions = (query: SubscriptionQuery, options?: FindOptions): SubscriptionWithRoom[] => {
	const { querySubscriptions } = useContext(UserContext);
	const [subscribe, getSnapshot] = useMemo(() => querySubscriptions(query, options), [querySubscriptions, query, options]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
