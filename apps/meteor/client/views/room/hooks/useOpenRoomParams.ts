import type { RoomType } from '@rocket.chat/core-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useLayoutEffect, useState } from 'react';

import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

type OpenRoomParams = { type: RoomType; reference: string };

const extractFromRouter = (router: ReturnType<typeof useRouter>): OpenRoomParams | null => {
	const routeName = router.getRouteName();
	if (!routeName) {
		return null;
	}

	const identifier = roomCoordinator.getRouteNameIdentifier(routeName);
	if (!identifier) {
		return null;
	}

	const directives = roomCoordinator.getRoomDirectives(identifier);
	if (!directives?.extractOpenRoomParams) {
		return null;
	}

	return directives.extractOpenRoomParams(router.getRouteParameters());
};

export const useOpenRoomParams = (): OpenRoomParams | null => {
	const router = useRouter();
	const [params, setParams] = useState(() => extractFromRouter(router));

	useLayoutEffect(() => router.subscribeToRouteChange(() => setParams(extractFromRouter(router))), [router]);

	return params;
};
