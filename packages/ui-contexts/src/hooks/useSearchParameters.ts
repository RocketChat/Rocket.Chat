import { useContext, useSyncExternalStore } from 'react';

import { RouterContext } from '../RouterContext';

export const useSearchParameters = () => {
	const { getSearchParameters, subscribeToRouteChange } = useContext(RouterContext);
	return useSyncExternalStore(subscribeToRouteChange, getSearchParameters);
};
