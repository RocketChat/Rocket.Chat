import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const MentionsTab = lazy(() => import('../../views/room/contextualBar/MentionsTab'));

export const useMentionsRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'mentions',
			groups: ['channel', 'group', 'team'],
			title: 'Mentions',
			icon: 'at',
			tabComponent: MentionsTab,
			order: 6,
			type: 'organization',
		}),
		[],
	);
};
