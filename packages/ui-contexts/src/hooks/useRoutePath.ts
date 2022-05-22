import { useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { QueryStringParameters, RouteParameters, RouterContext } from '../RouterContext';

export const useRoutePath = (
	name: string,
	parameters?: RouteParameters,
	queryStringParameters?: QueryStringParameters,
): string | undefined => {
	const { queryRoutePath } = useContext(RouterContext);

	return useSubscription(
		useMemo(() => queryRoutePath(name, parameters, queryStringParameters), [queryRoutePath, name, parameters, queryStringParameters]),
	);
};
