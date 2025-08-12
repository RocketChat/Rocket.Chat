import type { ISubscription } from '@rocket.chat/core-typings';
import { useContext, useMemo, useSyncExternalStore } from 'react';

import { UserContext } from '../UserContext';

export const useUserSubscriptionByName = (name: string): ISubscription | undefined => {
	const { querySubscription } = useContext(UserContext);
	const [subscribe, getSnapshot] = useMemo(() => querySubscription({ name }), [querySubscription, name]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
