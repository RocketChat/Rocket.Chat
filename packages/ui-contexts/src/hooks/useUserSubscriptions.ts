import { useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import type { ISubscription } from '../../../core-typings/dist';
import { FindOptions, SubscriptionQuery, UserContext } from '../UserContext';

export const useUserSubscriptions = (query: SubscriptionQuery, options?: FindOptions): Array<ISubscription> | [] => {
	const { querySubscriptions } = useContext(UserContext);
	const subscription = useMemo(() => querySubscriptions(query, options), [querySubscriptions, query, options]);
	return useSubscription(subscription);
};
