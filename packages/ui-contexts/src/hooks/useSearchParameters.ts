import { useSyncExternalStore } from 'react';

import { useRouter } from '../RouterContext';

export const useSearchParameters = () => {
	const { getSearchParameters, subscribeToRouteChange } = useRouter();
	return useSyncExternalStore(subscribeToRouteChange, getSearchParameters);
};
