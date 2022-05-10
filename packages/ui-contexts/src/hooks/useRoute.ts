import { useContext, useMemo } from 'react';

import { QueryStringParameters, RouteParameters, RouterContext } from '../RouterContext';

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
			getPath: (parameters, queryStringParameters): string | undefined =>
				queryRoutePath(name, parameters, queryStringParameters).getCurrentValue(),
			getUrl: (parameters, queryStringParameters): ReturnType<Route['getUrl']> =>
				queryRouteUrl(name, parameters, queryStringParameters).getCurrentValue(),
			push: (parameters, queryStringParameters): ReturnType<Route['push']> => pushRoute(name, parameters, queryStringParameters),
			replace: (parameters, queryStringParameters): ReturnType<Route['replace']> => replaceRoute(name, parameters, queryStringParameters),
		}),
		[queryRoutePath, queryRouteUrl, name, pushRoute, replaceRoute],
	);
};
