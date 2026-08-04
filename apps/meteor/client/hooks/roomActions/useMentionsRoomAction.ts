import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

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
