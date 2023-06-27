import { useCallback, useContext } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { RouterContext } from '../RouterContext';

export const useRouteParameter = (name: string): string | undefined => {
	const { subscribeToRouteChange, getRouteParameters } = useContext(RouterContext);

	const getSnapshot = useCallback(() => {
		const parameters = getRouteParameters();
		return parameters[name];
	}, [getRouteParameters, name]);

	return useSyncExternalStore(subscribeToRouteChange, getSnapshot);
};
