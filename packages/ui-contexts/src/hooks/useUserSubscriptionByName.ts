import type { ISubscription } from '@rocket.chat/core-typings';
import { useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { Fields, Sort, UserContext } from '../UserContext';

export const useUserSubscriptionByName = (name: string, fields: Fields, sort?: Sort): ISubscription | undefined => {
	const { querySubscription } = useContext(UserContext);
	const subscription = useMemo(() => querySubscription({ name }, fields, sort), [querySubscription, name, fields, sort]);
	return useSubscription(subscription);
};
