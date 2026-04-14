import type { IUser } from '@rocket.chat/core-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import { LegacyRoomManager } from '../../../../app/ui-utils/client';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

export const useReloadAfterLogin = (user: IUser | null) => {
	const usernameRef = useRef<string>();
	const router = useRouter();

	useEffect(() => {
		const isNewUser = !usernameRef.current && user?.username;
		const usernameChanged = user?.username && usernameRef.current !== user.username;

		if (isNewUser || usernameChanged) {
			usernameRef.current = user.username;

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
					search: router.getSearchParameters(),
				});
			}
		}
		// Purposely not cleaning up usernameRef - it needs to be persistent when logging out/in
	}, [router, user?.username]);
};
