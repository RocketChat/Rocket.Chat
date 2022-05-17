import { useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { QueryStringParameters, RouteGroupName, RouteName, RouteParameters, RouterContext } from '../RouterContext';

export const useCurrentRoute = (): [RouteName?, RouteParameters?, QueryStringParameters?, RouteGroupName?] => {
	const { queryCurrentRoute } = useContext(RouterContext);

	return useSubscription(useMemo(() => queryCurrentRoute(), [queryCurrentRoute]));
};
