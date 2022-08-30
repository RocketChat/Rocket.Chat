import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { useContext, useMemo } from 'react';

import type { LoginService } from '../LoginContext';
import { LoginContext } from '../LoginContext';

export const useLoginServices = (): LoginService[] => {
	const { queryAllServices } = useContext(LoginContext);
	const [subscribe, getSnapshot] = useMemo(() => queryAllServices(), [queryAllServices]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
