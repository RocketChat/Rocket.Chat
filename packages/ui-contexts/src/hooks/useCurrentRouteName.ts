import { useContext, useSyncExternalStore } from 'react';

import { RouterContext } from '../RouterContext';

/** Which route is showing, by name — for anything that behaves differently depending on where it is rendered. */
export const useCurrentRouteName = () => {
	const { getRouteName, subscribeToRouteChange } = useContext(RouterContext);
	return useSyncExternalStore(subscribeToRouteChange, getRouteName);
};
