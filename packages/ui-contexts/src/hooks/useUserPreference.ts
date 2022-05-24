import { useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { UserContext } from '../UserContext';

export const useUserPreference = <T>(key: string, defaultValue?: T): T | undefined => {
	const { queryPreference } = useContext(UserContext);
	const subscription = useMemo(() => queryPreference(key, defaultValue), [queryPreference, key, defaultValue]);
	return useSubscription(subscription);
};
