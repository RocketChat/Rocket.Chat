import type { IMessage } from '@rocket.chat/core-typings';
import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { useRoom } from '../../../contexts/RoomContext';

export const useGoToThread = (): ((tmid: IMessage['_id']) => void) => {
	const room = useRoom();
	const [routeName] = useCurrentRoute();

	if (!routeName) {
		throw new Error('Route name is not defined');
	}

	const roomRoute = useRoute(routeName);
	return useCallback(
		(tmid) => {
			roomRoute.replace({ rid: room._id, ...(room.name && { name: room.name }), tab: 'thread', context: tmid });
		},
		[room._id, room.name, roomRoute],
	);
};
