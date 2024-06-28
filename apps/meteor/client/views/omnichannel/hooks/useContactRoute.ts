import { useRouter } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

export const useContactRoute = () => {
	const { navigate, getRouteParameters, getRouteName } = useRouter();
	const currentRouteName = getRouteName();
	const currentParams = getRouteParameters();

	// if (route) {
	// 	router.navigate({
	// 		name: route,
	// 		params: {
	// 			tab: 'contact-profile',
	// 			context: 'edit',
	// 			id: roomId,
	// 		},
	// 	});
	// 	return;
	// }

	// router.navigate({
	// 	name: 'omnichannel-directory',
	// 	params: {
	// 		page: 'contacts',
	// 		id: contactId,
	// 		bar: 'edit',
	// 	},
	// });

	const handleNavigate = useCallback(
		(param: string) => {
			if (!currentRouteName) {
				return;
			}

			if (currentRouteName === 'omnichannel-directory') {
				return navigate({
					name: currentRouteName,
					params: {
						// page: 'contacts',
						...currentParams,
						bar: param,
					},
				});
			}

			navigate({
				name: currentRouteName,
				params: {
					...currentParams,
					context: param,
				},
			});
		},
		[navigate, currentParams, currentRouteName],
	);

	return handleNavigate;
};
