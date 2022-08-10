import type { ISubscription } from '@rocket.chat/core-typings';
import { useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { Fields } from '../UserContext';
import { UserContext } from '../UserContext';

export const useUserSubscription = (rid: string, fields?: Fields): ISubscription | undefined => {
	const { querySubscription } = useContext(UserContext);
	const [subscribe, getSnapshot] = useMemo(() => querySubscription({ rid }, fields), [querySubscription, rid, fields]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
