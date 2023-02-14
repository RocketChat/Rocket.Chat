import { useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { QueryStringParameters, RouteParameters } from '../RouterContext';
import { RouterContext } from '../RouterContext';

export const useRoutePath = (
	name: string,
	parameters?: RouteParameters,
	queryStringParameters?: QueryStringParameters,
): string | undefined => {
	const { queryRoutePath } = useContext(RouterContext);

	const [subscribe, getSnapshot] = useMemo(
		() => queryRoutePath(name, parameters, queryStringParameters),
		[queryRoutePath, name, parameters, queryStringParameters],
	);

	return useSyncExternalStore(subscribe, getSnapshot);
};
