import { useContext, useMemo } from 'react';

import type { RouteName, RouteParameters } from '../RouterContext';
import { RouterContext } from '../RouterContext';

type Route = {
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
	const { pushRoute, replaceRoute } = useContext(RouterContext);

	return useMemo<Route>(
		() => ({
			push: (parameters, queryStringParameters) => pushRoute(name, parameters, queryStringParameters),
			replace: (parameters, queryStringParameters) => replaceRoute(name, parameters, queryStringParameters),
		}),
		[name, pushRoute, replaceRoute],
	);
};
