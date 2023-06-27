import { useCallback, useContext } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { RouteParameters, IRouterPaths, SearchParameters } from '../RouterContext';
import { RouterContext } from '../RouterContext';

export const useRoutePath = (name: keyof IRouterPaths, params?: RouteParameters, search?: SearchParameters): string | undefined => {
	const router = useContext(RouterContext);

	const getSnapshot = useCallback(() => {
		return router.buildRoutePath({ name, params, search });
	}, [name, params, router, search]);

	return useSyncExternalStore(router.subscribeToRouteChange, getSnapshot);
};
