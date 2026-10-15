import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';

import { ROOM_TABS_SEARCH } from './useActiveRoomTab';

/** Switches the room back to the Chat tab, with its contextual bar as the user left it. */
export const useGoToChatTab = () => {
	const router = useRouter();

	return useStableCallback(() => {
		const routeName = router.getRouteName();

		if (!routeName) {
			throw new Error('Route name is not defined');
		}

		const { [ROOM_TABS_SEARCH.tab]: _, [ROOM_TABS_SEARCH.threadsTabThread]: __, ...search } = router.getSearchParameters();

		router.navigate({
			name: routeName,
			params: router.getRouteParameters(),
			search,
		});
	});
};
