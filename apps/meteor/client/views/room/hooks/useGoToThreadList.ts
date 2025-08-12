import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';

import { useRoom } from '../contexts/RoomContext';

export const useGoToThreadList = ({ replace = false }: { replace?: boolean } = {}): (() => void) => {
	const router = useRouter();
	const room = useRoom();

	return useEffectEvent(() => {
		const routeName = router.getRouteName();

		if (!routeName) {
			throw new Error('Route name is not defined');
		}

		const { context, ...params } = router.getRouteParameters();

		router.navigate(
			{
				name: routeName,
				params: { rid: room._id, ...params, tab: 'thread' },
				search: router.getSearchParameters(),
			},
			{ replace },
		);
	});
};
