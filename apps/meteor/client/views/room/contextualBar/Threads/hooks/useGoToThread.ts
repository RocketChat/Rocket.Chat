import type { IMessage } from '@rocket.chat/core-typings';
import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { useRoom } from '../../../contexts/RoomContext';

export const useGoToThread = (): ((tmid: IMessage['_id']) => void) => {
	const room = useRoom();
	const [routeName, params] = useCurrentRoute();

	if (!routeName) {
		throw new Error('Route name is not defined');
	}

	const roomRoute = useRoute(routeName);
	// TODO: remove params recycling
	return useCallback(
		(tmid) => {
			roomRoute.replace({ rid: room._id, ...params, tab: 'thread', context: tmid });
		},
		[room._id, params, roomRoute],
	);
};
