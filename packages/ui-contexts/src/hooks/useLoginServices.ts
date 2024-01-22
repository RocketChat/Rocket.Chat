import { useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { LoginService } from '../AuthenticationContext';
import { AuthenticationContext } from '../AuthenticationContext';

export const useLoginServices = (): LoginService[] => {
	const { queryAllServices } = useContext(AuthenticationContext);
	const [subscribe, getSnapshot] = useMemo(() => queryAllServices(), [queryAllServices]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
