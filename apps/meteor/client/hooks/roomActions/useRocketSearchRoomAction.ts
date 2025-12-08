import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

const MessageSearchTab = lazy(() => import('../../views/room/contextualBar/MessageSearchTab'));

export const useRocketSearchRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'rocket-search',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'live', 'team'],
			title: 'Search_Messages',
			icon: 'magnifier',
			tabComponent: MessageSearchTab,
			order: 5,
		}),
		[],
	);
};
