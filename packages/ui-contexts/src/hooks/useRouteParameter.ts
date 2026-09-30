import { useCallback, useSyncExternalStore } from 'react';

import { useRouter } from '../RouterContext';

export const useRouteParameter = (name: string): string | undefined => {
	const router = useRouter();

	const getSnapshot = useCallback(() => {
		return router.getRouteParameters()[name];
	}, [router, name]);

	return useSyncExternalStore(router.subscribeToRouteChange, getSnapshot);
};
