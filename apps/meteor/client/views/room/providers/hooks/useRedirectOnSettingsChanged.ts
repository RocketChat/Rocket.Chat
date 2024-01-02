import type { ISubscription } from '@rocket.chat/core-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { LegacyRoomManager } from '../../../../../app/ui-utils/client';

export const useRedirectOnSettingsChanged = (subscription?: ISubscription | null) => {
	const router = useRouter();

	const routeType = router.getRouteName() === 'channel' ? 'c' : 'p';
	const routeName = router.getRouteParameters().name;

	const subExists = !!subscription;

	useEffect(() => {
		if (!subExists) {
			return;
		}
		const redirect = async () => {
			if (routeType !== subscription.t || routeName !== subscription.name) {
				await LegacyRoomManager.close(routeType + routeName);
				router.navigate({
					pattern: subscription.t === 'c' ? '/channel/:name/:tab?/:context?' : '/group/:name/:tab?/:context?',
					params: { name: subscription.name },
					search: router.getSearchParameters(),
				});
			}
		};
		redirect();
	}, [subscription?.t, subscription?.name, routeType, routeName, router, subExists]);
};
