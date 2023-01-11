import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { useRoom } from '../../../contexts/RoomContext';

export const useGoToThreadList = (): (() => void) => {
	const room = useRoom();
	const [routeName, { context, ...params } = { context: '' }] = useCurrentRoute();

	if (!routeName) {
		throw new Error('Route name is not defined');
	}

	const roomRoute = useRoute(routeName);
	return useCallback(() => {
		roomRoute.replace({ rid: room._id, ...params, tab: 'thread' });
	}, [room._id, roomRoute, params]);
};
