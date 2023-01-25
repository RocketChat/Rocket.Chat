import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';

import { useRoom } from '../contexts/RoomContext';

export const useGoToThreadList = ({ replace = false }: { replace?: boolean } = {}): (() => void) => {
	const room = useRoom();
	const [routeName, { context, ...params } = { context: '' }] = useCurrentRoute();

	if (!routeName) {
		throw new Error('Route name is not defined');
	}

	const roomRoute = useRoute(routeName);
	const go = replace ? roomRoute.replace : roomRoute.push;
	return useMutableCallback(() => {
		go({ rid: room._id, ...params, tab: 'thread' });
	});
};
