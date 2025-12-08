import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

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
