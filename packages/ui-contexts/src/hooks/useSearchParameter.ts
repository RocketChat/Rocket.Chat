import { useCallback, useContext } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { RouterContext } from '../RouterContext';

export const useSearchParameter = (name: string): string | undefined => {
	const { getSearchParameters, subscribeToRouteChange } = useContext(RouterContext);

	const getSnapshot = useCallback(() => {
		const searchParameters = getSearchParameters();
		return searchParameters[name];
	}, [getSearchParameters, name]);

	return useSyncExternalStore(subscribeToRouteChange, getSnapshot);
};
