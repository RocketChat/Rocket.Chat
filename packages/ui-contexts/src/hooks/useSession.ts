import { useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { SessionContext } from '../SessionContext';

export const useSession = (name: string): unknown => {
	const { query } = useContext(SessionContext);
	const [subscribe, getSnapshot] = useMemo(() => query(name), [query, name]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
