import type { RouteParameters } from '@rocket.chat/ui-contexts';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect } from 'react';

export const useContactRoute = () => {
	const { navigate, getRouteParameters, getRouteName } = useRouter();
	const currentRouteName = getRouteName();
	const currentParams = getRouteParameters();

	const handleNavigate = useCallback(
		({ id, ...params }: RouteParameters) => {
			if (!currentRouteName) {
				return;
			}

			// TODO: Map out all the routes that use this hook and properly handle them
			if (currentRouteName === 'omnichannel-directory' || currentRouteName === 'omnichannel-current-chats') {
				return navigate({
					name: currentRouteName,
					params: {
						...currentParams,
						tab: 'contacts',
						id: id || currentParams.id,
						...params,
					},
				});
			}

			navigate({
				name: currentRouteName,
				params: {
					...currentParams,
					id: currentParams.id,
					...params,
				},
			});
		},
		[navigate, currentParams, currentRouteName],
	);

	useEffect(() => {
		if (!currentParams.context) {
			handleNavigate({ context: 'details' });
		}
	}, [currentParams.context, handleNavigate]);

	return handleNavigate;
};
