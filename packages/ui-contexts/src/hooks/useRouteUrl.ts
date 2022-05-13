import { useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { QueryStringParameters, RouteParameters, RouterContext } from '../RouterContext';

export const useRouteUrl = (
	name: string,
	parameters?: RouteParameters,
	queryStringParameters?: QueryStringParameters,
): string | undefined => {
	const { queryRouteUrl } = useContext(RouterContext);

	return useSubscription(
		useMemo(() => queryRouteUrl(name, parameters, queryStringParameters), [queryRouteUrl, name, parameters, queryStringParameters]),
	);
};
