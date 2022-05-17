import { useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { SessionContext } from '../SessionContext';

export const useSession = (name: string): unknown => {
	const { query } = useContext(SessionContext);
	const subscription = useMemo(() => query(name), [query, name]);
	return useSubscription(subscription);
};
