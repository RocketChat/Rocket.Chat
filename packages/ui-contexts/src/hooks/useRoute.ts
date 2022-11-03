import { useContext, useMemo } from 'react';

import type { QueryStringParameters, RouteParameters } from '../RouterContext';
import { RouterContext } from '../RouterContext';

type Route = {
	getPath: (parameters?: RouteParameters, queryStringParameters?: QueryStringParameters) => string | undefined;
	getUrl: (parameters?: RouteParameters, queryStringParameters?: QueryStringParameters) => string | undefined;
	push: (parameters?: RouteParameters, queryStringParameters?: QueryStringParameters) => void;
	replace: (parameters?: RouteParameters, queryStringParameters?: QueryStringParameters) => void;
};

export const useRoute = (name: string): Route => {
	const { queryRoutePath, queryRouteUrl, pushRoute, replaceRoute } = useContext(RouterContext);

	return useMemo<Route>(
		() => ({
			getPath: (parameters, queryStringParameters): string | undefined => queryRoutePath(name, parameters, queryStringParameters)[1](),
			getUrl: (parameters, queryStringParameters): ReturnType<Route['getUrl']> =>
				queryRouteUrl(name, parameters, queryStringParameters)[1](),
			push: (parameters, queryStringParameters): ReturnType<Route['push']> => pushRoute(name, parameters, queryStringParameters),
			replace: (parameters, queryStringParameters): ReturnType<Route['replace']> => replaceRoute(name, parameters, queryStringParameters),
		}),
		[queryRoutePath, queryRouteUrl, name, pushRoute, replaceRoute],
	);
};
