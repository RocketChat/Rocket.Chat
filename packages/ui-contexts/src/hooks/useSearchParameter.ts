import { useCallback, useSyncExternalStore } from 'react';

import { useRouter } from '../RouterContext';

export const useSearchParameter = (name: string): string | undefined => {
	const { getSearchParameters, subscribeToRouteChange } = useRouter();

	const getSnapshot = useCallback(() => {
		const searchParameters = getSearchParameters();
		return searchParameters[name];
	}, [getSearchParameters, name]);

	return useSyncExternalStore(subscribeToRouteChange, getSnapshot);
};
