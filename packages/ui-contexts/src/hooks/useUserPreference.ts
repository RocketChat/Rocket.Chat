import { useContext, useMemo, useSyncExternalStore } from 'react';

import { UserContext } from '../UserContext';

export const useUserPreference = <T>(key: string, defaultValue?: T): T | undefined => {
	const { queryPreference } = useContext(UserContext);
	const [subscribe, getSnapshot] = useMemo(() => queryPreference(key, defaultValue), [queryPreference, key, defaultValue]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
