import { useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { UserContext } from '../UserContext';

export const useUserPreference = <T>(key: string, defaultValue?: T): T | undefined => {
	const { queryPreference } = useContext(UserContext);
	const [subscribe, getSnapshot] = useMemo(() => queryPreference(key, defaultValue), [queryPreference, key, defaultValue]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
