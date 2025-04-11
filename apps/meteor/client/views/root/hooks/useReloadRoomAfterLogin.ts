import { useUser, useRouter } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import { LegacyRoomManager } from '../../../../app/ui-utils/client';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

export const useReloadRoomAfterLogin = (): void => {
	const user = useUser();
	const router = useRouter();
	const currentUsernameRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		const username = user?.username;
		if (currentUsernameRef.current === undefined && username) {
			currentUsernameRef.current = username;

			LegacyRoomManager.closeAllRooms();

			const routeName = router.getRouteName();
			if (!routeName) {
				return;
			}

			const roomType = roomCoordinator.getRouteNameIdentifier(routeName);
			if (roomType) {
				const searchParams = router.getSearchParameters();
				router.navigate({ pathname: router.getLocationPathname() || '/', search: searchParams }, { replace: true });
			}
		}
	}, [user, router]);
};
