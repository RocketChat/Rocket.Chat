import type { IMessage } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';

import { ROOM_TABS_SEARCH, threadsTabSearch } from './useActiveRoomTab';

type GoToThreadsTabOptions = {
	tmid?: IMessage['_id'];
	/** A message of the thread to jump to. */
	msg?: IMessage['_id'];
	/** Also closes whatever the Chat tab has open in the contextual bar, so it is not there on the way back. */
	closeContextualBar?: boolean;
};

/** Switches the room to the Threads tab, with `tmid` open, or with the room's own conversation without one. */
export const useGoToThreadsTab = ({ replace = false }: { replace?: boolean } = {}) => {
	const router = useRouter();

	return useStableCallback(({ tmid, msg, closeContextualBar = false }: GoToThreadsTabOptions = {}) => {
		const routeName = router.getRouteName();

		if (!routeName) {
			throw new Error('Route name is not defined');
		}

		const { msg: _, [ROOM_TABS_SEARCH.threadsTabThread]: __, ...search } = router.getSearchParameters();

		router.navigate(
			{
				name: routeName,
				params: { ...router.getRouteParameters(), ...(closeContextualBar && { tab: '', context: '' }) },
				search: { ...search, ...threadsTabSearch(tmid), ...(tmid && msg && { msg }) },
			},
			{ replace },
		);
	});
};
