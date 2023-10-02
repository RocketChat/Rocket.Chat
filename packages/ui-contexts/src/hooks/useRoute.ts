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

/** @deprecated prefer `useRouter` */
export const useRoute = (name: RouteName): Route => {
	const router = useContext(RouterContext);

	return useMemo<Route>(
		() => ({
			push: (params, queryStringParameters) => {
				const search =
					typeof queryStringParameters === 'function' ? queryStringParameters(router.getSearchParameters()) : queryStringParameters;
				router.navigate({ name, params, search }, { replace: false });
			},
			replace: (params, queryStringParameters) => {
				const search =
					typeof queryStringParameters === 'function' ? queryStringParameters(router.getSearchParameters()) : queryStringParameters;
				router.navigate({ name, params, search }, { replace: true });
			},
		}),
		[name, router],
	);
};
