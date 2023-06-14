import { useContext, useMemo } from 'react';

import type { QueryStringParameters, RouteName, RouteParameters } from '../RouterContext';
import { RouterContext } from '../RouterContext';

type Route = {
	getPath: (parameters?: RouteParameters, queryStringParameters?: QueryStringParameters) => string | undefined;
	push: (
		parameters?: RouteParameters,
		queryStringParameters?: ((prev: Record<string, string>) => Record<string, string>) | Record<string, string>,
	) => void;
	replace: (
		parameters?: RouteParameters,
		queryStringParameters?: ((prev: Record<string, string>) => Record<string, string>) | Record<string, string>,
	) => void;
};

export const useRoute = (name: RouteName): Route => {
	const { queryRoutePath, queryRouteUrl, pushRoute, replaceRoute } = useContext(RouterContext);

	return useMemo<Route>(
		() => ({
			getPath: (parameters, queryStringParameters) => queryRoutePath(name, parameters, queryStringParameters)[1](),
			push: (parameters, queryStringParameters) => pushRoute(name, parameters, queryStringParameters),
			replace: (parameters, queryStringParameters) => replaceRoute(name, parameters, queryStringParameters),
		}),
		[queryRoutePath, queryRouteUrl, name, pushRoute, replaceRoute],
	);
};
