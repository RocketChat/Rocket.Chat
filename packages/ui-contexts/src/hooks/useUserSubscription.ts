import type { ISubscription } from '@rocket.chat/core-typings';
import { useContext, useMemo, useSyncExternalStore } from 'react';

import { UserContext } from '../UserContext';

export const useUserSubscription = (rid: string): ISubscription | undefined => {
	const { querySubscription } = useContext(UserContext);
	const [subscribe, getSnapshot] = useMemo(() => querySubscription({ rid }), [querySubscription, rid]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
