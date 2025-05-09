import type { RouteParameters } from '@rocket.chat/ui-contexts';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect } from 'react';

export const useContactRoute = () => {
	const { navigate, getRouteParameters, getRouteName } = useRouter();
	const currentRouteName = getRouteName();
	const currentParams = getRouteParameters();

	const handleNavigate = useCallback(
		(params: RouteParameters) => {
			if (!currentRouteName) {
				return;
			}

			if (currentRouteName === 'omnichannel-directory') {
				return navigate({
					name: currentRouteName,
					params: {
						...currentParams,
						tab: 'contacts',
						...params,
					},
				});
			}

			navigate({
				name: currentRouteName,
				params: {
					...currentParams,
					...params,
				},
			});
		},
		[navigate, currentParams, currentRouteName],
	);

	useEffect(() => {
		if (!currentParams.context) {
			handleNavigate({ context: 'info' });
		}
	}, [currentParams.context, handleNavigate]);

	return handleNavigate;
};
