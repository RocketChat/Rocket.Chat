import { useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { FindOptions, SubscriptionQuery } from '../UserContext';
import { UserContext } from '../UserContext';
import type { SubscriptionWithRoom } from '../types/SubscriptionWithRoom';

export const useUserSubscriptions = (query: SubscriptionQuery, options?: FindOptions): SubscriptionWithRoom[] => {
	const { querySubscriptions } = useContext(UserContext);
	const [subscribe, getSnapshot] = useMemo(() => querySubscriptions(query, options), [querySubscriptions, query, options]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
