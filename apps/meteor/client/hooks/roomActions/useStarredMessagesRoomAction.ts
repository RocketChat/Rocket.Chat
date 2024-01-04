import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const StarredMessagesTab = lazy(() => import('../../views/room/contextualBar/StarredMessagesTab'));

export const useStarredMessagesRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'starred-messages',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			title: 'Starred_Messages',
			icon: 'star',
			tabComponent: StarredMessagesTab,
			order: 10,
			type: 'organization',
		}),
		[],
	);
};
