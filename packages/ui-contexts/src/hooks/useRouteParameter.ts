import { useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { RouterContext } from '../RouterContext';

export const useRouteParameter = (name: string): string | undefined => {
	const { queryRouteParameter } = useContext(RouterContext);

	return useSubscription(useMemo(() => queryRouteParameter(name), [queryRouteParameter, name]));
};
