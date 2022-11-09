import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { useContext, useMemo } from 'react';

import type { LoginService } from '../UserContext';
import { UserContext } from '../UserContext';

export const useLoginServices = (): LoginService[] => {
	const { queryAllServices } = useContext(UserContext);
	const [subscribe, getSnapshot] = useMemo(() => queryAllServices(), [queryAllServices]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
