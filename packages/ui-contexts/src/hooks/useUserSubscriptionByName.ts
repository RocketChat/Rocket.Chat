import type { ISubscription } from '@rocket.chat/core-typings';
import { useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { Fields, Sort } from '../UserContext';
import { UserContext } from '../UserContext';

export const useUserSubscriptionByName = (name: string, fields?: Fields, sort?: Sort): ISubscription | undefined => {
	const { querySubscription } = useContext(UserContext);
	const [subscribe, getSnapshot] = useMemo(() => querySubscription({ name }, fields, sort), [querySubscription, name, fields, sort]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
