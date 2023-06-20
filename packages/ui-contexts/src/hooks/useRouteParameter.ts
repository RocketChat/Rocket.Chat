import { useCallback, useContext } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { RouterContext } from '../RouterContext';

export const useRouteParameter = (name: string): string | undefined => {
	const { subscribeToRouteChange, getParameters } = useContext(RouterContext);

	const getSnapshot = useCallback(() => {
		const parameters = getParameters();
		return parameters[name];
	}, [getParameters, name]);

	return useSyncExternalStore(subscribeToRouteChange, getSnapshot);
};
