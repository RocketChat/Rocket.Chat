import { useContext, useMemo, useSyncExternalStore } from 'react';

import { SessionContext } from '../SessionContext.js';

export const useSession = (name: string): unknown => {
	const { query } = useContext(SessionContext);
	const [subscribe, getSnapshot] = useMemo(() => query(name), [query, name]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
