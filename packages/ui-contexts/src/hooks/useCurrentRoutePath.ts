import { useCallback, useSyncExternalStore } from 'react';

import { useRouter } from '../RouterContext';

export const useCurrentRoutePath = () => {
	const router = useRouter();

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
