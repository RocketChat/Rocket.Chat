import { useContext, useSyncExternalStore } from 'react';

import { RouterContext } from '../RouterContext';

export const useLocationHash = () => {
	const { getLocationHash, subscribeToRouteChange } = useContext(RouterContext);
	return useSyncExternalStore(subscribeToRouteChange, getLocationHash);
};
