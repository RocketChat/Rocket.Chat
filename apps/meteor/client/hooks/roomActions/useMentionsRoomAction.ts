import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const MentionsTab = lazy(() => import('../../views/room/contextualBar/MentionsTab'));

export const useMentionsRoomAction = () => {
	const enabled = useSetting('Menu_Mentions_List');

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabled) {
			return undefined;
		}

		return {
			id: 'mentions',
			groups: ['channel', 'group', 'team'],
			title: 'Mentions',
			icon: 'at',
			tabComponent: MentionsTab,
			order: 9,
		};
	}, [enabled]);
};
