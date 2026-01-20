import type { RouteParameters, SearchParameters } from '@rocket.chat/ui-contexts';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

export const useOmnichannelDirectoryRouter = () => {
	const router = useRouter();
	const routeName = router.getRouteName();
	const validRoutes = routeName === 'omnichannel-directory' || routeName === 'omnichannel-current-chats';

	const handleNavigate = useCallback(
		(params?: RouteParameters, search?: SearchParameters) => {
			if (!routeName || !validRoutes) {
				return;
			}

			return router.navigate({ name: routeName, params, search });
		},
		[validRoutes, routeName, router],
	);

	const getDirectoryRouteName = useCallback(() => {
		if (!routeName || !validRoutes) {
			return undefined;
		}

		return routeName;
	}, [routeName, validRoutes]);

	return {
		...router,
		navigate: handleNavigate,
		getRouteName: getDirectoryRouteName,
	};
};
