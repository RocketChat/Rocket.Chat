import type { ISubscription } from '@rocket.chat/core-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { LegacyRoomManager } from '../../../../../app/ui-utils/client';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';

const routeNameToRoomTypeMap: Record<string, string> = {
	channel: 'c',
	group: 'p',
	direct: 'd',
	live: 'l',
};

export const useRedirectOnSettingsChanged = (subscription?: ISubscription | null) => {
	const router = useRouter();

	const subExists = !!subscription;

	useEffect(() => {
		if (!subExists) {
			return;
		}
		const redirect = async () => {
			const routeConfig = roomCoordinator.getRoomDirectives(subscription.t).config.route;

			const channelName = router.getRouteParameters().name;
			const routeName = router.getRouteName() as string;

			if (!routeConfig?.path || !routeName || !channelName) {
				return;
			}

			if (routeConfig.name === routeName && channelName === subscription.name) {
				return;
			}

			const routeRoomType = routeNameToRoomTypeMap[routeName];

			if (routeRoomType) {
				await LegacyRoomManager.close(routeRoomType + routeName);
			}

			router.navigate({
				pattern: routeConfig.path,
				params: { ...router.getRouteParameters(), name: subscription.name },
				search: router.getSearchParameters(),
			});
		};
		redirect();
	}, [subscription?.t, subscription?.name, router, subExists]);
};
