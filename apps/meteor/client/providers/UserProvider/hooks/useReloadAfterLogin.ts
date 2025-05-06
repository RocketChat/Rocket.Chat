import type { IUser } from '@rocket.chat/core-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import { LegacyRoomManager } from '../../../../app/ui-utils/client';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

export const useReloadAfterLogin = (user: IUser | null) => {
	const currentUsername = useRef<string>();
	const router = useRouter();

	useEffect(() => {
		if (!currentUsername.current && user?.username) {
			currentUsername.current = user.username;
			LegacyRoomManager.closeAllRooms();

			const routeName = router.getRouteName();
			if (!routeName) {
				return;
			}
			const roomType = roomCoordinator.getRouteNameIdentifier(routeName);

			if (roomType) {
				router.navigate({
					name: routeName,
					params: router.getRouteParameters(),
				});
			}
		}
		return () => {
			currentUsername.current = undefined;
		};
	}, [router, user?.username]);
};
