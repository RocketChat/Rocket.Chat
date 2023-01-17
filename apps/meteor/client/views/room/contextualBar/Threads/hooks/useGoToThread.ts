import type { IMessage } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';

import { useRoom } from '../../../contexts/RoomContext';

export const useGoToThread = (): ((tmid: IMessage['_id'], jump?: IMessage['_id']) => void) => {
	const room = useRoom();
	const [routeName, params, queryParams] = useCurrentRoute();

	if (!routeName) {
		throw new Error('Route name is not defined');
	}

	const roomRoute = useRoute(routeName);
	// TODO: remove params recycling
	return useMutableCallback((tmid, jump) => {
		roomRoute.replace({ rid: room._id, ...params, tab: 'thread', context: tmid }, { ...queryParams, ...(jump && { jump }) });
	});
};
