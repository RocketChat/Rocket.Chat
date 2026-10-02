import { useSyncExternalStore } from 'react';

import { useRouter } from '../RouterContext';

export const useLocationHash = () => {
	const { getLocationHash, subscribeToRouteChange } = useRouter();
	return useSyncExternalStore(subscribeToRouteChange, getLocationHash);
};
