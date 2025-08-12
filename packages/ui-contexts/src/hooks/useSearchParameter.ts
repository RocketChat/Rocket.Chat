import { useCallback, useContext, useSyncExternalStore } from 'react';

import { RouterContext } from '../RouterContext';

export const useSearchParameter = (name: string): string | undefined => {
	const { getSearchParameters, subscribeToRouteChange } = useContext(RouterContext);

	const getSnapshot = useCallback(() => {
		const searchParameters = getSearchParameters();
		return searchParameters[name];
	}, [getSearchParameters, name]);

	return useSyncExternalStore(subscribeToRouteChange, getSnapshot);
};
