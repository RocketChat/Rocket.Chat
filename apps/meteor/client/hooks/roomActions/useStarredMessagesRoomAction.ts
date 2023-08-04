import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const StarredMessagesTab = lazy(() => import('../../views/room/contextualBar/StarredMessagesTab'));

export const useStarredMessagesRoomAction = () => {
	const enabled = useSetting('Menu_Starred_Messages', true);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabled) {
			return undefined;
		}

		return {
			id: 'starred-messages',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			title: 'Starred_Messages',
			icon: 'star',
			tabComponent: StarredMessagesTab,
			order: 10,
		};
	}, [enabled]);
};
