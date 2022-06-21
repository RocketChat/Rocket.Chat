import { useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { QueryStringParameters, RouteGroupName, RouteName, RouteParameters, RouterContext } from '../RouterContext';

export const useCurrentRoute = (): [RouteName?, RouteParameters?, QueryStringParameters?, RouteGroupName?] => {
	const { queryCurrentRoute } = useContext(RouterContext);

	const [subscribe, getSnapshot] = useMemo(() => queryCurrentRoute(), [queryCurrentRoute]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
