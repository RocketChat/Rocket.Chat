import { useCallback, useContext, useSyncExternalStore } from 'react';

import { RouterContext } from '../RouterContext';

export const useRouteParameter = (name: string): string | undefined => {
	const router = useContext(RouterContext);

	const getSnapshot = useCallback(() => {
		return router.getRouteParameters()[name];
	}, [router, name]);

	return useSyncExternalStore(router.subscribeToRouteChange, getSnapshot);
};
