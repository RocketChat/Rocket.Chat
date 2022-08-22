import { useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { RouterContext } from '../RouterContext';

export const useRouteParameter = (name: string): string | undefined => {
	const { queryRouteParameter } = useContext(RouterContext);

	const [subscribe, getSnapshot] = useMemo(() => queryRouteParameter(name), [queryRouteParameter, name]);

	return useSyncExternalStore(subscribe, getSnapshot);
};
