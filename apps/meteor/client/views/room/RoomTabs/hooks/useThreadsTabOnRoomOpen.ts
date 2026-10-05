import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { ROOM_TABS_SEARCH } from './useActiveRoomTab';
import { useGoToThreadsTab } from './useGoToThreadsTab';
import { useRoom } from '../../contexts/RoomContext';

/**
 * Lands a room on the Threads tab when it is opened, unless the URL already asks for something the Chat tab shows: a
 * contextual bar, a message to jump to, or a tab of its own. Only on opening, so choosing Chat afterwards sticks.
 */
export const useThreadsTabOnRoomOpen = (enabled: boolean) => {
	const room = useRoom();
	const router = useRouter();
	const goToThreadsTab = useGoToThreadsTab({ replace: true });

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const { tab } = router.getRouteParameters();
		const search = router.getSearchParameters();

		if (tab || search.msg || search[ROOM_TABS_SEARCH.tab]) {
			return;
		}

		goToThreadsTab();
	}, [enabled, room._id, router, goToThreadsTab]);
};
