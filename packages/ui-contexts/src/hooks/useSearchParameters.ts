import { useContext } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { RouterContext } from '../RouterContext';

export const useSearchParameters = () => {
	const { getSearchParameters, subscribeToRouteChange } = useContext(RouterContext);
	return useSyncExternalStore(subscribeToRouteChange, getSearchParameters);
};
