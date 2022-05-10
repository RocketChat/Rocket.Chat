import type { ISubscription } from '@rocket.chat/core-typings';
import { useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { Fields, UserContext } from '../UserContext';

export const useUserSubscription = (rid: string, fields?: Fields): ISubscription | undefined => {
	const { querySubscription } = useContext(UserContext);
	const subscription = useMemo(() => querySubscription({ rid }, fields), [querySubscription, rid, fields]);
	return useSubscription(subscription);
};
