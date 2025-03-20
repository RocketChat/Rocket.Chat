import type { ISubscription } from '@rocket.chat/core-typings';
import { useContext, useMemo, useSyncExternalStore } from 'react';

import type { Fields } from '../UserContext';
import { UserContext } from '../UserContext';

export const useUserSubscription = (rid: string, fields?: Fields): ISubscription | undefined => {
	const { querySubscription } = useContext(UserContext);
	const [subscribe, getSnapshot] = useMemo(() => querySubscription({ rid }, fields), [querySubscription, rid, fields]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
