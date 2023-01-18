import type { IMessage } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';

import { useRoom } from '../contexts/RoomContext';

export const useGoToThread = ({ replace = false }: { replace?: boolean } = {}): ((
	tmid: IMessage['_id'],
	jump?: IMessage['_id'],
) => void) => {
	const room = useRoom();
	const [routeName, params, queryParams] = useCurrentRoute();

	if (!routeName) {
		throw new Error('Route name is not defined');
	}

	const roomRoute = useRoute(routeName);
	const go = replace ? roomRoute.replace : roomRoute.push;

	// TODO: remove params recycling
	return useMutableCallback((tmid, jump) => {
		go({ rid: room._id, ...params, tab: 'thread', context: tmid }, { ...queryParams, ...(jump && { jump }) });
	});
};
