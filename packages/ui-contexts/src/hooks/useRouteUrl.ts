import { useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { QueryStringParameters, RouteParameters } from '../RouterContext';
import { RouterContext } from '../RouterContext';

export const useRouteUrl = (
	name: string,
	parameters?: RouteParameters,
	queryStringParameters?: QueryStringParameters,
): string | undefined => {
	const { queryRouteUrl } = useContext(RouterContext);

	const [subscribe, getSnapshot] = useMemo(
		() => queryRouteUrl(name, parameters, queryStringParameters),
		[queryRouteUrl, name, parameters, queryStringParameters],
	);

	return useSyncExternalStore(subscribe, getSnapshot);
};
