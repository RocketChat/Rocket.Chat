import { useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSubscription } from 'use-subscription';

import { RouterContext } from '../contexts/RouterContext';

export const useRouteParameter = (name: string): string | undefined => {
	const value = useParams<Record<string, string>>()[name];

	const { queryRouteParameter } = useContext(RouterContext);
	const fallbackValue = useSubscription(
		useMemo(() => queryRouteParameter(name), [queryRouteParameter, name]),
	);

	return value ?? fallbackValue;
};
