import { useCallback, useContext, useSyncExternalStore } from 'react';

import { RouterContext } from '../RouterContext';

export const useCurrentRoutePath = () => {
	const router = useContext(RouterContext);

	const getSnapshot = useCallback(() => {
		const name = router.getRouteName();
		return name
			? router.buildRoutePath({
					name,
					params: router.getRouteParameters(),
					search: router.getSearchParameters(),
				})
			: undefined;
	}, [router]);

	return useSyncExternalStore(router.subscribeToRouteChange, getSnapshot);
};
