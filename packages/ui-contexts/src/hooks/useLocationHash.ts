import { useContext, useSyncExternalStore } from 'react';

import { RouterContext } from '../RouterContext.js';

export const useLocationHash = () => {
	const { getLocationHash, subscribeToRouteChange } = useContext(RouterContext);
	return useSyncExternalStore(subscribeToRouteChange, getLocationHash);
};
